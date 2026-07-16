"use client";

import { useMemo } from "react";
import { computeHubCapacity, computeFleetStatus } from "@/lib/data";
import { IconTruck, IconLock } from "@/components/icons";

function levelOf(pct) {
  if (pct >= 85) return "high";
  if (pct >= 50) return "mid";
  return "low";
}

// Quản lý nguồn lực (Capacity & Fleet Management) — bổ sung theo góp ý:
// không chỉ thấy hàng hóa đi đâu, mà còn thấy khả năng đáp ứng của hệ thống.
export default function CapacityPanel({ orders }) {
  const capacity = useMemo(() => computeHubCapacity(orders), [orders]);
  const fleet = useMemo(() => computeFleetStatus(orders), [orders]);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>
            <IconTruck size={17} className="heading-icon" />
            Quản lý nguồn lực
          </h3>
          <p className="ai-sub">Tỷ lệ lấp đầy hub và trạng thái đội xe — minh họa từ số đơn đang xử lý.</p>
        </div>
      </div>

      <div className="capacity-grid">
        <div className="capacity-hubs">
          {capacity.map((c) => (
            <div className="capacity-row" key={c.hub}>
              <span className="capacity-hub-name">
                {c.hub}
                {c.secure && (
                  <span className="capacity-secure" title="Hub an ninh cao">
                    <IconLock size={11} />
                  </span>
                )}
              </span>
              <div className="capacity-bar-wrap">
                <div
                  className={`capacity-bar capacity-${levelOf(c.pct)}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="capacity-pct">{c.pct}%</span>
            </div>
          ))}
        </div>

        <div className="fleet-card">
          <div className="fleet-title">Trạng thái đội xe</div>
          <div className="fleet-total">{fleet.total} xe</div>
          <div className="fleet-split">
            <div className="fleet-item">
              <span className="fleet-dot fleet-dot-running" />
              Đang chạy: <strong>{fleet.running}</strong>
            </div>
            <div className="fleet-item">
              <span className="fleet-dot fleet-dot-idle" />
              Đang rảnh: <strong>{fleet.idle}</strong>
            </div>
          </div>
          <div className="fleet-bar-wrap">
            <div className="fleet-bar" style={{ width: `${fleet.pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
