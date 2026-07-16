import {
  HUBS,
  nearestHub,
  getRouteTemplate,
  QUALITATIVE_BENEFITS,
  COST_PARAMS,
} from "@/lib/data";
import { planMultiLegRoute } from "@/lib/geo";

function hubByName(name) {
  return HUBS.find((h) => h.name === name);
}

function toLatLng(point) {
  return { lat: point.lat, lng: point.lng };
}

// Dựng danh sách điểm trung gian (tên hub) giữa 2 điểm bất kỳ, dựa trên hub
// gần nhất của từng đầu — tái sử dụng đúng bảng lộ trình mẫu hub-to-hub đã
// có (mục 5.4), chỉ khác là 2 đầu tuyến giờ có thể là điểm bất kỳ, không bắt
// buộc phải là hub.
function buildHubChain(fromHub, toHub, cargoType) {
  if (fromHub.id === toHub.id) {
    return { traditional: [], ai: [], cargoNote: null };
  }

  const template = getRouteTemplate(fromHub.name, toHub.name);
  let aiHubs = template.ai;
  let cargoNote = null;

  if (cargoType === "fragile") {
    aiHubs = aiHubs.slice(0, Math.max(0, aiHubs.length - 1));
    cargoNote = "Ưu tiên giảm số lần bốc dỡ để hạn chế hư hỏng";
  } else if (cargoType === "valuable") {
    const secureNames = HUBS.filter((h) => h.secure).map((h) => h.name);
    const hasSecure = aiHubs.some((h) => secureNames.includes(h));
    if (!hasSecure && secureNames.length) aiHubs = [secureNames[0]];
    cargoNote = "Ưu tiên tuyến qua hub có kiểm soát an ninh chặt chẽ";
  }

  return { traditional: template.traditional, ai: aiHubs, cargoNote };
}

function buildTimelineFromLegs(names, legs) {
  const stopMinutes = 30;
  let cursor = new Date();
  cursor.setMinutes(Math.round(cursor.getMinutes() / 10) * 10, 0, 0);

  const stops = [{ label: `Xuất phát từ ${names[0]}`, time: new Date(cursor) }];

  for (let i = 1; i < names.length; i++) {
    cursor = new Date(cursor.getTime() + legs[i - 1].minutes * 60000);
    const isLast = i === names.length - 1;
    stops.push({
      label: isLast
        ? `Đến ${names[i]} (hoàn tất)`
        : `Đến ${names[i]} (trung chuyển, dừng ~${stopMinutes} phút)`,
      time: new Date(cursor),
    });
    if (!isLast) cursor = new Date(cursor.getTime() + stopMinutes * 60000);
  }

  return stops.map((s) => ({
    label: s.label,
    time: s.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  }));
}

async function planOnePath(fromPoint, toPoint, hubNames) {
  const points = [fromPoint, ...hubNames.map((n) => toLatLng(hubByName(n))), toPoint];
  const names = [fromPoint.name, ...hubNames, toPoint.name];
  const route = await planMultiLegRoute(points);
  const cost =
    Math.round(route.km) * COST_PARAMS.pricePerKm + hubNames.length * COST_PARAMS.transshipFee;

  return {
    km: Math.round(route.km),
    hours: (route.minutes / 60).toFixed(1),
    hubs: hubNames.length,
    path: names,
    coords: route.coords,
    cost: Math.round(cost),
    timeline: buildTimelineFromLegs(names, route.legs),
    real: route.allReal,
    anyReal: route.anyReal,
  };
}

// Định tuyến THẬT giữa 2 điểm bất kỳ (không giới hạn trong 5 hub) — tự tìm
// hub gần nhất mỗi đầu làm điểm trung chuyển, gọi OSRM lấy km/giờ/hình học
// đường bộ thật; lỗi mạng thì planMultiLegRoute đã tự fallback đường thẳng
// theo từng chặng nên không bao giờ trả về null hoàn toàn.
export async function planRoute(fromPoint, toPoint, cargoType = "normal") {
  const fromHub = nearestHub(fromPoint);
  const toHub = nearestHub(toPoint);
  const chain = buildHubChain(fromHub, toHub, cargoType);

  const [traditional, ai] = await Promise.all([
    planOnePath(fromPoint, toPoint, chain.traditional),
    planOnePath(fromPoint, toPoint, chain.ai),
  ]);

  const tradHours = parseFloat(traditional.hours);
  const aiHours = parseFloat(ai.hours);
  const savePct =
    tradHours > 0 ? Math.round(((tradHours - aiHours) / tradHours) * 100) : 0;

  const benefits = QUALITATIVE_BENEFITS.slice(0, 3 + Math.floor(Math.random() * 2));

  return {
    traditional,
    ai: { ...ai, benefits },
    savePct,
    cargoNote: chain.cargoNote,
    usedRealRoads: traditional.anyReal || ai.anyReal,
  };
}
