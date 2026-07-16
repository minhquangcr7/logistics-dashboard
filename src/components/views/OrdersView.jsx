"use client";

import { useState, useMemo, Fragment } from "react";
import { FILTERS, slaStatus, CARGO_TYPE_META, computeDelayStats } from "@/lib/data";
import { exportOrdersCsv } from "@/lib/exportCsv";
import StatusPill from "@/components/StatusPill";

const COLUMNS = [
  { key: "id", label: "Mã đơn" },
  { key: "customer", label: "Khách hàng" },
  { key: "route", label: "Tuyến" },
  { key: "status", label: "Trạng thái" },
  { key: "deadline", label: "Cam kết giao" },
  { key: "location", label: "Vị trí hiện tại" },
  { key: "updated", label: "Cập nhật" },
];

export default function OrdersView({ orders }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("updated");
  const [sortDir, setSortDir] = useState("desc");
  const [openRow, setOpenRow] = useState(null);

  // Xử lý vận hành (mục 4.9) — chỉ giữ trạng thái tại chỗ, mô phỏng, mất khi tải lại trang.
  const [actions, setActions] = useState({}); // { [orderId]: { shipperChanged, calledAt, priority } }

  function markAction(id, patch) {
    setActions((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const delayStats = useMemo(() => computeDelayStats(orders), [orders]);

  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "updated") {
        av = a.deadline;
        bv = b.deadline;
      }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [orders, filter, search, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="view">
      {delayStats.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <h3>
              Thống kê nguyên nhân trễ hạn (
              {delayStats.reduce((s, d) => s + d.count, 0)} đơn)
            </h3>
          </div>
          <div className="delay-stats">
            {delayStats.map((d) => (
              <div className="delay-stat-row" key={d.category}>
                <span className="delay-stat-label">{d.label}</span>
                <div className="delay-stat-bar-wrap">
                  <div
                    className="delay-stat-bar"
                    style={{ width: `${d.pct}%`, background: d.color }}
                  />
                </div>
                <span className="delay-stat-pct">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <input
          className="search-box"
          type="text"
          placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="filter-count">{filtered.length} đơn</span>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Danh sách đơn hàng</h3>
          <div className="panel-head-actions">
            <span className="live-dot">● cập nhật mỗi 4s</span>
            <button
              className="chip export-btn"
              onClick={() =>
                exportOrdersCsv(
                  filtered,
                  `don-hang-${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
            >
              ⬇ Xuất báo cáo (Excel)
            </button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="sortable-th"
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}{" "}
                    {sortKey === c.key && (sortDir === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th>Loại</th>
                <th>Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const sla = slaStatus(o);
                const isOpen = openRow === o.id;
                const clickable = o.status === "late";
                const cargo = CARGO_TYPE_META[o.cargoType];
                const act = actions[o.id] || {};
                return (
                  <Fragment key={o.id}>
                    <tr
                      className={`${clickable ? "row-clickable" : ""} ${act.priority ? "row-priority" : ""}`}
                      onClick={() => clickable && setOpenRow(isOpen ? null : o.id)}
                    >
                      <td className="expand-cell">{clickable ? (isOpen ? "▾" : "▸") : ""}</td>
                      <td className="mono">
                        {act.priority && <span title="Ưu tiên giao">⚡</span>} {o.id}
                      </td>
                      <td>{o.customer}</td>
                      <td>{o.route}</td>
                      <td>
                        <StatusPill status={o.status} />
                        {clickable && <span className="info-dot">ⓘ</span>}
                      </td>
                      <td>
                        {sla.deadlineText}
                        {sla.level !== "none" && (
                          <div className={`sla-text sla-${sla.level}`}>{sla.text}</div>
                        )}
                      </td>
                      <td>{o.location}</td>
                      <td className="muted">{o.updated}</td>
                      <td className="cargo-cell" title={cargo.label}>
                        {cargo.icon}
                      </td>
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        {o.status === "late" ? (
                          <div className="action-group">
                            <button
                              className="action-btn"
                              title="Đổi shipper"
                              disabled={act.shipperChanged}
                              onClick={() => markAction(o.id, { shipperChanged: true })}
                            >
                              🔄
                            </button>
                            <button
                              className="action-btn"
                              title="Gọi lại khách"
                              disabled={!!act.calledAt}
                              onClick={() =>
                                markAction(o.id, {
                                  calledAt: new Date().toLocaleTimeString("vi-VN", {
                                    hour12: false,
                                  }),
                                })
                              }
                            >
                              📞
                            </button>
                            <button
                              className="action-btn"
                              title="Ưu tiên giao"
                              disabled={act.priority}
                              onClick={() => markAction(o.id, { priority: true })}
                            >
                              ⚡
                            </button>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                        {(act.shipperChanged || act.calledAt || act.priority) && (
                          <div className="action-badges">
                            {act.shipperChanged && <span className="badge">Đã đổi shipper</span>}
                            {act.calledAt && (
                              <span className="badge">Đã gọi khách lúc {act.calledAt}</span>
                            )}
                            {act.priority && <span className="badge badge-priority">Ưu tiên</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="detail-row">
                        <td colSpan={10}>
                          <div className="delay-detail">
                            <strong>Lý do trễ:</strong> {o.delayReason}
                            <br />
                            <strong>Dự kiến giao lại:</strong> {o.delayEta}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="muted center">
                    Không có đơn nào khớp bộ lọc/tìm kiếm.
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
