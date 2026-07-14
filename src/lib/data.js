// =====================================================================
// DỮ LIỆU DÙNG CHUNG CHO DASHBOARD
// - Đơn hàng, tên khách, vị trí: GIẢ LẬP (không có quyền truy cập dữ liệu
//   vận hành thật của doanh nghiệp).
// - Toạ độ 5 hub, khoảng cách giữa các thành phố: SỐ THẬT (gần đúng).
// - Số liệu chuyển đổi số (before/after): SỐ THẬT do Viettel Post công bố,
//   có trích nguồn (xem SOURCES bên dưới).
// =====================================================================

// --- Chuỗi trạng thái đơn hàng (theo đặc tả mục 4.2) ---
export const STATUS_FLOW = ["received", "pickup", "transit", "delivering", "done"];

export const STATUS_META = {
  received: { label: "Đã tiếp nhận", color: "blue" },
  pickup: { label: "Đang lấy hàng", color: "amber" },
  transit: { label: "Đang vận chuyển", color: "blue" },
  delivering: { label: "Đang giao", color: "amber" },
  done: { label: "Đã giao", color: "green" },
  late: { label: "Trễ hạn", color: "red" },
};

// Icon phương tiện suy ra từ trạng thái (mục 4.8)
export function vehicleIcon(status) {
  if (status === "delivering") return "🛵";
  if (status === "pickup" || status === "transit") return "🚚";
  return "📦"; // received / done / late
}

// --- Bộ lọc trạng thái (mục 4.1) ---
export const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "transit", label: "Đang vận chuyển" },
  { key: "delivering", label: "Đang giao" },
  { key: "done", label: "Đã giao" },
  { key: "late", label: "Trễ hạn" },
];

// =====================================================================
// 5 HUB — toạ độ địa lý thật (mục 3.3 / 7)
// =====================================================================
export const HUBS = [
  { id: "hn", name: "Hà Nội", lat: 21.0285, lng: 105.8542, secure: false },
  { id: "hp", name: "Hải Phòng", lat: 20.8449, lng: 106.6881, secure: false },
  { id: "dn", name: "Đà Nẵng", lat: 16.0544, lng: 108.2022, secure: true },
  { id: "hcm", name: "TP.HCM", lat: 10.8231, lng: 106.6297, secure: true },
  { id: "ct", name: "Cần Thơ", lat: 10.0452, lng: 105.7469, secure: false },
];

const CITIES_FOR_ROUTE = HUBS.map((h) => h.name);

const CUSTOMER_NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Bình",
  "Lê Hoàng Cường",
  "Phạm Thu Dung",
  "Vũ Minh Đức",
  "Đỗ Thị Hà",
  "Bùi Quang Huy",
  "Ngô Thị Lan",
  "Hoàng Văn Nam",
  "Đặng Thị Oanh",
  "Cửa hàng Phương Nam",
  "Công ty TNHH Tân Phát",
  "Shop Mẹ & Bé Hạnh Phúc",
  "Nhà thuốc An Khang",
  "Đại lý Vật tư Tiến Đạt",
];

const LOCATIONS = [
  "Kho phân loại Hà Nội",
  "Trên xe tải tuyến QL1A",
  "Bưu cục Đà Nẵng",
  "Kho phân loại TP.HCM",
  "Trung tâm khai thác miền Nam",
  "Điểm giao dịch Cầu Giấy",
  "Xe trung chuyển tuyến Bắc - Trung",
  "Kho phân loại Hải Phòng",
  "Bưu cục Cần Thơ",
  "Đang giao tại địa chỉ khách",
];

// Lý do trễ mẫu (mục 4.4) + nhóm phân loại (mục 4.7)
const DELAY_REASONS = [
  { reason: "Thời tiết xấu tại khu vực miền Trung", category: "weather" },
  { reason: "Tắc nghẽn giao thông tại tuyến QL1A", category: "traffic" },
  { reason: "Thiếu nhân lực giao hàng khu vực nội thành", category: "shipper" },
  { reason: "Sai địa chỉ, đang liên hệ lại khách hàng", category: "address" },
  { reason: "Hàng hóa cần kiểm tra thêm tại kho trung chuyển", category: "other" },
  { reason: "Kẹt xe nghiêm trọng tại cửa ngõ thành phố", category: "traffic" },
];

export const DELAY_CATEGORY_META = {
  traffic: { label: "Kẹt xe/giao thông", color: "#f85149" },
  shipper: { label: "Shipper (thiếu NS)", color: "#f5a524" },
  weather: { label: "Thời tiết xấu", color: "#e8794f" },
  address: { label: "Sai địa chỉ", color: "#d97757" },
  other: { label: "Khác", color: "#8b98a9" },
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOrderId() {
  return "VTP-" + Math.floor(100000 + Math.random() * 900000);
}

function randomRoute() {
  let a = randomFrom(CITIES_FOR_ROUTE);
  let b = randomFrom(CITIES_FOR_ROUTE);
  while (b === a) b = randomFrom(CITIES_FOR_ROUTE);
  return `${a} → ${b}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
}

function randomDeadline() {
  // Dự kiến giao trong khoảng 6-24 giờ kể từ lúc tạo đơn (mục 4.6 / 7).
  const hoursAhead = 6 + Math.random() * 18;
  return Date.now() + hoursAhead * 3600 * 1000;
}

// Tạo ~14 đơn hàng mẫu ban đầu.
export function generateOrders() {
  const statuses = [
    "received",
    "pickup",
    "transit",
    "transit",
    "delivering",
    "done",
    "done",
    "late",
  ];
  const orders = [];
  for (let i = 0; i < 14; i++) {
    const status = randomFrom(statuses);
    const delay = status === "late" ? randomFrom(DELAY_REASONS) : null;
    orders.push({
      id: randomOrderId(),
      customer: randomFrom(CUSTOMER_NAMES),
      route: randomRoute(),
      status,
      location: randomFrom(LOCATIONS),
      updated: nowTime(),
      deadline: randomDeadline(),
      delayReason: delay?.reason ?? null,
      delayCategory: delay?.category ?? null,
      delayEta: status === "late" ? "Dự kiến giao lại trong 4 giờ tới" : null,
    });
  }
  return orders;
}

// Đẩy 1 đơn ngẫu nhiên (chưa hoàn tất) sang trạng thái kế tiếp — dùng cho
// cơ chế "real-time giả lập" mỗi 4 giây (đặc tả mục 4.3).
export function advanceOneOrder(orders) {
  const candidates = orders.filter(
    (o) => o.status !== "done" && o.status !== "late"
  );
  if (candidates.length === 0) return orders;

  const target = randomFrom(candidates);
  const roll = Math.random();
  let newStatus = target.status;
  if (roll < 0.08) {
    newStatus = "late";
  } else if (roll < 0.68) {
    const idx = STATUS_FLOW.indexOf(target.status);
    newStatus = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
  } else {
    return orders; // không đổi lần này
  }

  const delay = newStatus === "late" ? randomFrom(DELAY_REASONS) : null;

  return orders.map((o) =>
    o.id === target.id
      ? {
          ...o,
          status: newStatus,
          location:
            newStatus === "done"
              ? "Đã giao thành công"
              : randomFrom(LOCATIONS),
          updated: nowTime(),
          delayReason: delay?.reason ?? o.delayReason,
          delayCategory: delay?.category ?? o.delayCategory,
          delayEta: newStatus === "late" ? "Dự kiến giao lại trong 4 giờ tới" : o.delayEta,
        }
      : o
  );
}

// --- KPI tính từ danh sách đơn (mục 3.1) ---
export function computeKpis(orders) {
  const total = orders.length;
  const shipping = orders.filter((o) =>
    ["pickup", "transit", "delivering"].includes(o.status)
  ).length;
  const late = orders.filter((o) => o.status === "late").length;
  const onTimeRate = total === 0 ? 0 : Math.round(((total - late) / total) * 100);
  return { total, shipping, late, onTimeRate };
}

// --- Thống kê nguyên nhân trễ hạn (mục 4.7) ---
export function computeDelayStats(orders) {
  const late = orders.filter((o) => o.status === "late" && o.delayCategory);
  const total = late.length;
  const counts = {};
  late.forEach((o) => {
    counts[o.delayCategory] = (counts[o.delayCategory] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({
      category,
      count,
      pct: total === 0 ? 0 : Math.round((count / total) * 100),
      ...DELAY_CATEGORY_META[category],
    }))
    .sort((a, b) => b.count - a.count);
}

// --- SLA countdown (mục 4.6) ---
export function slaStatus(order) {
  if (!order.deadline) return { level: "none" };

  const fmt = new Date(order.deadline).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  // Đơn đã giao/trễ hạn: chỉ hiện mốc giờ dự kiến ban đầu để đối chiếu, không đếm ngược.
  if (order.status === "done" || order.status === "late") {
    return { level: "none", deadlineText: fmt };
  }

  const diffMs = order.deadline - Date.now();
  const diffH = diffMs / 3600000;
  if (diffH < 0) {
    return { level: "over", text: `⛔ Quá hạn ${Math.round(-diffH)} giờ`, deadlineText: fmt };
  }
  if (diffH < 6) {
    return { level: "soon", text: `⚠ Còn ${Math.round(diffH)} giờ`, deadlineText: fmt };
  }
  return { level: "ok", text: `Còn ${Math.round(diffH)} giờ`, deadlineText: fmt };
}

// --- Đếm đơn theo tuyến/hub, dùng cho bản đồ (line weight) + AI alerts ---
export function countByRoute(orders) {
  const counts = {};
  orders.forEach((o) => {
    counts[o.route] = (counts[o.route] || 0) + 1;
  });
  return counts;
}

export function countByHub(orders) {
  const counts = {};
  HUBS.forEach((h) => (counts[h.name] = 0));
  orders.forEach((o) => {
    const [from, to] = o.route.split(" → ");
    if (counts[from] != null) counts[from] += 1;
    if (counts[to] != null) counts[to] += 1;
  });
  return counts;
}

// =====================================================================
// AI DECISION SUPPORT — cảnh báo rule-based (mục 3.4)
// =====================================================================
export function generateAiAlerts(orders) {
  const alerts = [];
  const hubCounts = countByHub(orders);
  const values = Object.values(hubCounts);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  // 1) Hub có lượng đơn vượt > 35% so với trung bình.
  Object.entries(hubCounts).forEach(([hub, count]) => {
    if (avg > 0 && count > avg * 1.35) {
      const pct = Math.round(((count - avg) / avg) * 100);
      alerts.push({
        id: `spike-${hub}`,
        type: "spike",
        title: `Hub ${hub}: lượng đơn tăng ${pct}% so với trung bình`,
        suggestion: `Đề xuất: điều thêm xe từ hub lân cận hỗ trợ ${hub}`,
        detail: `${hub} đang xử lý ${count} đơn, cao hơn mức trung bình ${avg.toFixed(1)} đơn/hub của toàn hệ thống.`,
      });
    }
  });

  // 2) Tuyến có từ 3 đơn trễ hạn trở lên.
  const lateByRoute = {};
  orders
    .filter((o) => o.status === "late")
    .forEach((o) => {
      lateByRoute[o.route] = (lateByRoute[o.route] || 0) + 1;
    });
  Object.entries(lateByRoute).forEach(([route, count]) => {
    if (count >= 2) {
      alerts.push({
        id: `late-${route}`,
        type: "late",
        title: `Tuyến ${route}: ${count} đơn trễ hạn liên tiếp`,
        suggestion: `Đề xuất: chuyển bớt đơn sang đối tác vận chuyển thứ 3 để giảm tải tuyến này`,
        detail: `Tuyến ${route} hiện có ${count} đơn đang ở trạng thái trễ hạn, cần ưu tiên xử lý hoặc tăng nguồn lực.`,
      });
    }
  });

  return alerts.slice(0, 4);
}

// =====================================================================
// ĐỊNH TUYẾN AI (mục 5) — khoảng cách THẬT (gần đúng), km
// =====================================================================
export const ROUTING_CITIES = CITIES_FOR_ROUTE;

export const DISTANCE_KM = {
  "Hà Nội-Hải Phòng": 120,
  "Hà Nội-Đà Nẵng": 770,
  "Hà Nội-TP.HCM": 1710,
  "Hà Nội-Cần Thơ": 1880,
  "Hải Phòng-Đà Nẵng": 850,
  "Hải Phòng-TP.HCM": 1790,
  "Hải Phòng-Cần Thơ": 1960,
  "Đà Nẵng-TP.HCM": 960,
  "Đà Nẵng-Cần Thơ": 1130,
  "TP.HCM-Cần Thơ": 170,
};

export function getDistance(a, b) {
  if (a === b) return 0;
  return DISTANCE_KM[`${a}-${b}`] ?? DISTANCE_KM[`${b}-${a}`] ?? null;
}

// Bảng lộ trình mẫu — hub trung gian cho tuyến truyền thống vs AI (mục 5.4/7).
const ROUTE_TEMPLATES = {
  "Hà Nội-TP.HCM": { traditional: ["Hải Phòng", "Đà Nẵng"], ai: ["Đà Nẵng"] },
  "Hà Nội-Cần Thơ": { traditional: ["Đà Nẵng", "TP.HCM"], ai: ["Đà Nẵng"] },
  "Hải Phòng-TP.HCM": { traditional: ["Hà Nội", "Đà Nẵng"], ai: ["Đà Nẵng"] },
  "Hải Phòng-Cần Thơ": { traditional: ["Đà Nẵng", "TP.HCM"], ai: ["Đà Nẵng"] },
  "Đà Nẵng-Cần Thơ": { traditional: ["TP.HCM"], ai: [] },
};

function getRouteTemplate(a, b) {
  const direct = ROUTE_TEMPLATES[`${a}-${b}`];
  if (direct) return direct;
  const reverse = ROUTE_TEMPLATES[`${b}-${a}`];
  if (reverse) {
    return {
      traditional: [...reverse.traditional].reverse(),
      ai: [...reverse.ai].reverse(),
    };
  }
  // Mặc định: 2 hub gần nhất theo trục Bắc-Nam cho truyền thống, bớt 1 hub cho AI.
  return { traditional: ["Đà Nẵng"], ai: [] };
}

const QUALITATIVE_BENEFITS = [
  "✅ Tránh khung giờ cao điểm tại nội đô các thành phố lớn",
  "✅ Giảm số lần bốc dỡ hàng hóa → giảm rủi ro hư hỏng/thất lạc",
  "✅ Ưu tiên hub có công suất xử lý còn trống, tránh dồn ứ",
  "✅ Phù hợp hơn với hàng dễ vỡ/hàng giá trị cao (ít điểm trung chuyển = ít rủi ro)",
  "✅ Rút ngắn thời gian chờ trung chuyển tại các hub trung gian",
];

const CARGO_TYPES = [
  { key: "normal", label: "Hàng thường" },
  { key: "fragile", label: "Hàng dễ vỡ" },
  { key: "valuable", label: "Hàng giá trị cao" },
];
export { CARGO_TYPES };

const COST_PARAMS = { pricePerKm: 10000, transshipFee: 200000 };

// Mô phỏng có căn cứ: tuyến AI giảm ~9% quãng đường + tốc độ TB nhỉnh hơn do
// ít điểm dừng -> tiết kiệm thời gian rơi vào ~10-20% (đặc tả mục 5.3).
export function computeRouting(a, b, cargoType = "normal") {
  const base = getDistance(a, b);
  if (base == null) return null;

  const traditionalSpeed = 45;
  let aiSpeed = 52;

  const template = getRouteTemplate(a, b);
  let aiHubs = template.ai;
  let aiKmFactor = 0.91;

  // Loại hàng ảnh hưởng tới cách chọn tuyến AI (mục 5.8).
  let cargoNote = null;
  if (cargoType === "fragile") {
    // Ưu tiên ít điểm trung chuyển nhất, chấp nhận thời gian nhỉnh hơn.
    aiHubs = aiHubs.slice(0, Math.max(0, aiHubs.length - 1));
    aiSpeed = 49;
    cargoNote = "Ưu tiên giảm số lần bốc dỡ để hạn chế hư hỏng";
  } else if (cargoType === "valuable") {
    const secureNames = HUBS.filter((h) => h.secure).map((h) => h.name);
    const hasSecure = aiHubs.some((h) => secureNames.includes(h));
    if (!hasSecure && secureNames.length) {
      aiHubs = [secureNames[0]];
    }
    cargoNote = "Ưu tiên tuyến qua hub có kiểm soát an ninh chặt chẽ";
  }

  const aiKm = Math.round(base * aiKmFactor);
  const tradHours = base / traditionalSpeed;
  const aiHours = aiKm / aiSpeed;
  const savePct = Math.round(((tradHours - aiHours) / tradHours) * 100);

  const tradCost =
    base * COST_PARAMS.pricePerKm + template.traditional.length * COST_PARAMS.transshipFee;
  const aiCost = aiKm * COST_PARAMS.pricePerKm + aiHubs.length * COST_PARAMS.transshipFee;

  const tradPath = [a, ...template.traditional, b];
  const aiPath = [a, ...aiHubs, b];

  const benefits = QUALITATIVE_BENEFITS.slice(0, 3 + Math.floor(Math.random() * 2));

  return {
    traditional: {
      km: base,
      hours: tradHours.toFixed(1),
      hubs: template.traditional.length,
      path: tradPath,
      cost: Math.round(tradCost),
      timeline: buildTimeline(tradPath, base, traditionalSpeed),
    },
    ai: {
      km: aiKm,
      hours: aiHours.toFixed(1),
      hubs: aiHubs.length,
      path: aiPath,
      cost: Math.round(aiCost),
      timeline: buildTimeline(aiPath, aiKm, aiSpeed),
      benefits,
    },
    savePct,
    cargoNote,
  };
}

// Tính khoảng cách thật cho từng đoạn liền kề trong lộ trình; đoạn nào không
// có sẵn trong bảng tra cứu thì chia đều phần km còn lại cho các đoạn đó.
function segmentDistances(path, totalKm) {
  const segments = Math.max(path.length - 1, 1);
  const known = [];
  let knownSum = 0;
  let unknownCount = 0;
  for (let i = 0; i < segments; i++) {
    const d = getDistance(path[i], path[i + 1]);
    known.push(d);
    if (d != null) knownSum += d;
    else unknownCount++;
  }
  const remaining = Math.max(totalKm - knownSum, 0);
  const fallback = unknownCount > 0 ? remaining / unknownCount : 0;
  return known.map((d) => d ?? fallback);
}

function buildTimeline(path, totalKm, speed) {
  const dists = segmentDistances(path, totalKm);
  const stopMinutes = 30;

  let cursor = new Date();
  cursor.setMinutes(Math.round(cursor.getMinutes() / 10) * 10, 0, 0);

  const stops = [{ label: `Xuất phát từ ${path[0]}`, time: new Date(cursor) }];

  for (let i = 1; i < path.length; i++) {
    const travelMin = (dists[i - 1] / speed) * 60;
    cursor = new Date(cursor.getTime() + travelMin * 60000);
    const isLast = i === path.length - 1;
    stops.push({
      label: isLast
        ? `Đến ${path[i]} (hoàn tất)`
        : `Đến ${path[i]} (trung chuyển, dừng ~${stopMinutes} phút)`,
      time: new Date(cursor),
    });
    if (!isLast) cursor = new Date(cursor.getTime() + stopMinutes * 60000);
  }

  return stops.map((s) => ({
    label: s.label,
    time: s.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  }));
}

// =====================================================================
// SO SÁNH TRƯỚC / SAU CHUYỂN ĐỔI SỐ (mục 5B) — SỐ THẬT, quy ước Trước = 100%
// =====================================================================
export const BEFORE_AFTER = [
  {
    metric: "Chi phí logistics toàn trình",
    before: 100,
    after: 70,
    note: "Tiết kiệm ~30%",
    source: "9.3",
  },
  {
    metric: "Thời gian giao hàng toàn trình",
    before: 100,
    after: 60,
    note: "Rút ngắn ~40%",
    source: "9.3",
  },
  {
    metric: "Chi phí khâu chia chọn",
    before: 100,
    after: 60,
    note: "Giảm 40% nhờ robot AGV",
    source: "9.2",
  },
  {
    metric: "Doanh thu (giai đoạn số hóa 2019-2020)",
    before: 100,
    after: 350,
    note: "Tăng 350%",
    source: "9.5",
  },
];

export const EXTRA_METRIC = {
  metric: "Thời gian khai thác tại tổ hợp chia chọn",
  value: "7-8 tiếng/lô",
  note: "Trước đó không công bố số tuyệt đối",
  source: "9.2",
};

export const SOURCES = {
  "9.1": "https://ictvietnam.vn/viettel-post-dat-muc-tieu-tang-truong-33-4-dich-vu-loi-trong-nam-2025-69520.html",
  "9.2": "https://rtc.edu.vn/viettel-post-dan-dau-xu-huong-tu-dong-hoa-trong-nganh-logistics/",
  "9.3": "https://viettelfamily.com/news/thoi-su/viettel-post-ra-mat-giai-phap-logistics-toan-trinh-toi-uu-toan-dien",
  "9.5": "https://www.quanlynhanuoc.vn/2025/04/22/doi-moi-trong-ap-dung-mo-hinh-kinh-doanh-so-doi-voi-hoat-dong-logistic-o-viettel-post/",
};
