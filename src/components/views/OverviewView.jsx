"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  computeKpis,
  countByHub,
  computeHubCapacity,
  distinctRoutes,
  generateAiAlerts,
  CARGO_TYPE_META,
  HUBS,
} from "@/lib/data";
import StatusPill from "@/components/StatusPill";
import AiDecisionCard from "@/components/AiDecisionCard";
import CapacityPanel from "@/components/CapacityPanel";
import ForecastChart from "@/components/ForecastChart";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Đang tải bản đồ…</div>,
});

export default function OverviewView({ orders }) {
  const kpi = computeKpis(orders);
  const recent = orders.slice(0, 6);
  const hubCounts = useMemo(() => countByHub(orders), [orders]);
  const hubCapacity = useMemo(() => computeHubCapacity(orders), [orders]);
  const routes = useMemo(() => distinctRoutes(orders), [orders]);
  const alerts = useMemo(() => generateAiAlerts(orders), [orders]);

  // 3-4 chấm động minh họa loại hàng đang di chuyển (mục 3.3).
  const flowDots = useMemo(() => {
    const seen = new Set();
    const dots = [];
    for (const o of orders) {
      if (o.status === "done") continue;
      const key = o.route + "|" + o.cargoType;
      if (seen.has(key)) continue;
      seen.add(key);
      const [from, to] = o.route.split(" → ");
      dots.push({ from, to, color: CARGO_TYPE_META[o.cargoType].color });
      if (dots.length >= 4) break;
    }
    return dots;
  }, [orders]);

  const cards = [
    { label: "Tổng đơn hôm nay", value: kpi.total, sub: "+12% so với hôm qua", tone: "blue" },
    { label: "Đang vận chuyển", value: kpi.shipping, sub: "Cập nhật liên tục", tone: "amber" },
    { label: "Đơn trễ hạn", value: kpi.late, sub: "Cần theo dõi", tone: "red" },
    { label: "Tỷ lệ giao đúng hạn", value: `${kpi.onTimeRate}%`, sub: "Mục tiêu ≥ 95%", tone: "green" },
  ];

  return (
    <div className="view">
      {/* KPI */}
      <div className="kpi-row">
        {cards.map((c) => (
          <div className={`kpi-card kpi-${c.tone}`} key={c.label}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{c.value}</div>
            <div className="kpi-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Quản lý nguồn lực */}
      <CapacityPanel orders={orders} />

      {/* Dự báo lưu lượng 7 ngày */}
      <ForecastChart baseVolume={kpi.total} />

      {/* Cảnh báo & gợi ý điều phối */}
      <AiDecisionCard alerts={alerts} />

      {/* Bảng đơn gần đây + bản đồ */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Đơn hàng gần đây</h3>
            <span className="live-dot">● live</span>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Trạng thái</th>
                  <th>Vị trí hiện tại</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td>{o.location}</td>
                    <td className="muted">{o.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Bản đồ tuyến vận chuyển</h3>
          </div>
          <LeafletMap
            hubs={HUBS}
            hubCounts={hubCounts}
            hubCapacity={hubCapacity}
            routes={routes}
            flowDots={flowDots}
            height={280}
          />
          <div className="map-legend">
            <div className="map-legend-row">
              <span className="legend-dash" />
              Màu đường = tuyến khác nhau (mỗi cặp hub 1 màu cố định)
            </div>
            <div className="map-legend-row">
              {Object.values(CARGO_TYPE_META).map((c) => (
                <span key={c.label} className="legend-dot-item">
                  <span className="legend-dot" style={{ background: c.color }} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <p className="map-note">
            Vị trí hub là tọa độ thật; màu tuyến và lưu lượng mang tính minh họa.
          </p>
        </div>
      </div>
    </div>
  );
}
