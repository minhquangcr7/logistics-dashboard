"use client";

import { useState } from "react";
import { FILTERS } from "@/lib/data";
import StatusPill from "@/components/StatusPill";

export default function OrdersView({ orders }) {
  const [filter, setFilter] = useState("all");

  const shipping = ["pickup", "transit", "delivering"];
  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "transit") return o.status === "transit";
    if (filter === "delivering") return o.status === "delivering";
    if (filter === "done") return o.status === "done";
    if (filter === "late") return o.status === "late";
    return true;
  });

  return (
    <div className="view">
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span className="filter-count">{filtered.length} đơn</span>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Danh sách đơn hàng</h3>
          <span className="live-dot">● cập nhật mỗi 4s</span>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tuyến</th>
                <th>Trạng thái</th>
                <th>Vị trí hiện tại</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.route}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td>{o.location}</td>
                  <td className="muted">{o.updated}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted center">
                    Không có đơn nào ở trạng thái này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
