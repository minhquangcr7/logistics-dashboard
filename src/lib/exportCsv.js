import { STATUS_META, CARGO_TYPE_META, slaStatus } from "@/lib/data";

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Xuất danh sách đơn hàng đang lọc ra file CSV (mở được bằng Excel, giữ
// đúng dấu tiếng Việt nhờ BOM UTF-8) — mô phỏng đúng workflow báo cáo/đối
// soát thực tế của nhân viên vận hành.
export function exportOrdersCsv(orders, filename = "don-hang.csv") {
  const headers = [
    "Mã đơn",
    "Khách hàng",
    "Tuyến",
    "Trạng thái",
    "Cam kết giao",
    "Vị trí hiện tại",
    "Cập nhật lúc",
    "Loại hàng",
    "Lý do trễ",
  ];

  const rows = orders.map((o) => {
    const sla = slaStatus(o);
    return [
      o.id,
      o.customer,
      o.route,
      STATUS_META[o.status]?.label ?? o.status,
      sla.deadlineText ?? "",
      o.location,
      o.updated,
      CARGO_TYPE_META[o.cargoType]?.label ?? o.cargoType,
      o.delayReason ?? "",
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
