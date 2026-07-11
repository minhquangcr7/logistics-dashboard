import { computeKpis, BEFORE_AFTER, EXTRA_METRIC, SOURCES } from "@/lib/data";
import StatusPill from "@/components/StatusPill";
import MiniMap from "@/components/MiniMap";
import BeforeAfterChart from "@/components/BeforeAfterChart";

export default function OverviewView({ orders }) {
  const kpi = computeKpis(orders);
  const recent = orders.slice(0, 6);

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

      {/* Bảng đơn gần đây + mini map */}
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
            <h3>Sơ đồ tuyến vận chuyển</h3>
          </div>
          <MiniMap />
        </div>
      </div>

      {/* So sánh trước / sau chuyển đổi số */}
      <div className="panel">
        <div className="panel-head">
          <h3>So sánh hiệu quả trước và sau chuyển đổi số</h3>
        </div>

        <BeforeAfterChart />

        <div className="extra-card">
          <div>
            <div className="extra-label">{EXTRA_METRIC.metric}</div>
            <div className="extra-note">{EXTRA_METRIC.note}</div>
          </div>
          <div className="extra-value">{EXTRA_METRIC.value}</div>
        </div>

        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Chỉ tiêu</th>
                <th>Trước (=100%)</th>
                <th>Sau</th>
                <th>Ghi chú</th>
                <th>Nguồn</th>
              </tr>
            </thead>
            <tbody>
              {BEFORE_AFTER.map((d) => (
                <tr key={d.metric}>
                  <td>{d.metric}</td>
                  <td>{d.before}%</td>
                  <td className="accent-text">{d.after}%</td>
                  <td className="muted">{d.note}</td>
                  <td>
                    <a href={SOURCES[d.source]} target="_blank" rel="noreferrer" className="src-link">
                      Mục {d.source}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="footnote">
          Số liệu % do Viettel Post công bố; mốc &quot;Trước&quot; được quy ước là
          100% để thể hiện tỷ lệ thay đổi, không phải số liệu tuyệt đối do Viettel
          Post cung cấp.
        </p>
      </div>
    </div>
  );
}
