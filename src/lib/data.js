// =====================================================================
// DỮ LIỆU DÙNG CHUNG CHO DASHBOARD
// - Đơn hàng, tên khách, vị trí: GIẢ LẬP (không có quyền truy cập dữ liệu
//   vận hành thật của doanh nghiệp).
// - Khoảng cách giữa các thành phố: SỐ THẬT (gần đúng), tra cứu công khai.
// - Số liệu chuyển đổi số (before/after): SỐ THẬT do Viettel Post công bố,
//   có trích nguồn (xem mảng SOURCES bên dưới).
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

// --- Bộ lọc trạng thái (mục 4.1) ---
export const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "transit", label: "Đang vận chuyển" },
  { key: "delivering", label: "Đang giao" },
  { key: "done", label: "Đã giao" },
  { key: "late", label: "Trễ hạn" },
];

const CITIES_FOR_ROUTE = [
  "Hà Nội",
  "Đà Nẵng",
  "TP.HCM",
  "Hải Phòng",
  "Cần Thơ",
  "Nha Trang",
];

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
    orders.push({
      id: randomOrderId(),
      customer: randomFrom(CUSTOMER_NAMES),
      route: randomRoute(),
      status: randomFrom(statuses),
      location: randomFrom(LOCATIONS),
      updated: nowTime(),
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
  // 60% tiến trạng thái, một tỉ lệ nhỏ chuyển "trễ hạn".
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

// =====================================================================
// ĐỊNH TUYẾN AI (mục 5) — bảng khoảng cách THẬT (gần đúng), km
// =====================================================================
export const ROUTING_CITIES = [
  "Hà Nội",
  "Hải Phòng",
  "Đà Nẵng",
  "Nha Trang",
  "TP.HCM",
  "Cần Thơ",
];

// Khoảng cách đường bộ gần đúng giữa các thành phố (km), tra cứu công khai.
export const DISTANCE_KM = {
  "Hà Nội-Hải Phòng": 120,
  "Hà Nội-Đà Nẵng": 770,
  "Hà Nội-Nha Trang": 1280,
  "Hà Nội-TP.HCM": 1710,
  "Hà Nội-Cần Thơ": 1880,
  "Hải Phòng-Đà Nẵng": 850,
  "Hải Phòng-Nha Trang": 1360,
  "Hải Phòng-TP.HCM": 1790,
  "Hải Phòng-Cần Thơ": 1960,
  "Đà Nẵng-Nha Trang": 530,
  "Đà Nẵng-TP.HCM": 960,
  "Đà Nẵng-Cần Thơ": 1130,
  "Nha Trang-TP.HCM": 430,
  "Nha Trang-Cần Thơ": 600,
  "TP.HCM-Cần Thơ": 170,
};

export function getDistance(a, b) {
  if (a === b) return 0;
  return DISTANCE_KM[`${a}-${b}`] ?? DISTANCE_KM[`${b}-${a}`] ?? null;
}

// Mô phỏng có căn cứ: tuyến AI giảm ~9% quãng đường + tốc độ TB nhỉnh hơn do
// ít điểm dừng -> tiết kiệm thời gian rơi vào ~10-20% (đặc tả mục 5.3).
export function computeRouting(a, b) {
  const base = getDistance(a, b);
  if (base == null) return null;

  const traditionalSpeed = 45; // km/h trung bình (nhiều điểm dừng)
  const aiSpeed = 52; // km/h (ít điểm trung chuyển hơn)

  const aiKm = Math.round(base * 0.91);
  const tradHours = base / traditionalSpeed;
  const aiHours = aiKm / aiSpeed;
  const savePct = Math.round(((tradHours - aiHours) / tradHours) * 100);

  return {
    traditional: {
      km: base,
      hours: tradHours.toFixed(1),
      hubs: 2,
    },
    ai: {
      km: aiKm,
      hours: aiHours.toFixed(1),
      hubs: 1,
    },
    savePct,
  };
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

// Chỉ tiêu thứ 5 không đủ dữ liệu 2 chiều -> hiển thị riêng dạng thẻ.
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
