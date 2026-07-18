// =====================================================================
// TRA CỨU ĐỊA ĐIỂM + TUYẾN ĐƯỜNG THẬT — qua OpenStreetMap (Nominatim + OSRM).
// Cả 2 dịch vụ đều miễn phí, không cần API key. Vì là server công cộng nên
// LUÔN có fallback (đường thẳng/toạ độ gần đúng) khi mạng lỗi hoặc quá tải —
// tính năng không bao giờ "trắng trang" vì phụ thuộc dịch vụ ngoài.
// =====================================================================

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// Tìm địa điểm theo tên (mọi địa chỉ ở VN, không giới hạn trong danh sách hub).
export async function searchPlaces(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    format: "json",
    countrycodes: "vn",
    limit: "6",
    addressdetails: "0",
  });
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((d) => ({
      name: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

// Khoảng cách đường chim bay (km) — dùng làm fallback khi OSRM lỗi.
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Hệ số "đường vòng" gần đúng so với đường chim bay — dùng khi OSRM lỗi để
// km fallback vẫn hợp lý hơn là đo thẳng tuyệt đối.
const DETOUR_FACTOR = 1.3;
const FALLBACK_SPEED_KMH = 45;

// Server OSRM công cộng chặn/từ chối (429) nếu nhận nhiều request cùng lúc —
// 1 tuyến có thể có nhiều chặng (traditional + AI chạy song song), nên phải
// xếp hàng gọi lần lượt, cách nhau 1 khoảng nhỏ, thay vì bắn hết cùng lúc.
let osrmQueue = Promise.resolve();
const OSRM_MIN_GAP_MS = 350;

function enqueueOsrm(task) {
  const run = osrmQueue.then(() => task());
  osrmQueue = run.catch(() => {}).then(
    () => new Promise((resolve) => setTimeout(resolve, OSRM_MIN_GAP_MS))
  );
  return run;
}

async function requestOsrmLeg(from, to) {
  const url = `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (res.status === 429) throw new Error("rate-limited");
  if (!res.ok) return null;
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    km: route.distance / 1000,
    minutes: route.duration / 60,
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    real: true,
  };
}

// 1 chặng đường bộ thật giữa 2 điểm {lat,lng}. Trả về null nếu lỗi (gọi nơi
// dùng tự fallback đường thẳng). Có 1 lần thử lại nếu bị giới hạn tần suất.
export async function fetchRoadLeg(from, to) {
  try {
    return await enqueueOsrm(() => requestOsrmLeg(from, to));
  } catch {
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return await enqueueOsrm(() => requestOsrmLeg(from, to));
    } catch {
      return null;
    }
  }
}

function fallbackLeg(from, to) {
  const km = haversineKm(from, to) * DETOUR_FACTOR;
  return {
    km,
    minutes: (km / FALLBACK_SPEED_KMH) * 60,
    coords: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    real: false,
  };
}

// Tính tuyến đi qua nhiều điểm liên tiếp (VD: điểm lấy hàng → hub → hub →
// điểm giao hàng), mỗi chặng gọi OSRM song song, chặng nào lỗi thì tự thay
// bằng đường thẳng — không làm hỏng cả tuyến.
export async function planMultiLegRoute(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i++) legs.push([points[i], points[i + 1]]);

  const results = await Promise.all(
    legs.map(async ([a, b]) => (await fetchRoadLeg(a, b)) ?? fallbackLeg(a, b))
  );

  const km = results.reduce((s, l) => s + l.km, 0);
  const minutes = results.reduce((s, l) => s + l.minutes, 0);
  const allReal = results.every((l) => l.real);
  const anyReal = results.some((l) => l.real);
  const coords = results.flatMap((l) => l.coords);

  return { km, minutes, coords, legs: results, allReal, anyReal };
}
