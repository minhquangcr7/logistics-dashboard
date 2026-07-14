"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { HUBS, computeRouting, CARGO_TYPES } from "@/lib/data";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Đang tải bản đồ…</div>,
});

function formatVnd(n) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function RoutingView() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [cargo, setCargo] = useState("normal");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleHubClick(hub) {
    setError(null);
    if (!from || (to && hub.name !== from)) {
      // Bắt đầu lựa chọn mới hoặc chọn điểm đến.
      if (!from) {
        setFrom(hub.name);
        setTo(null);
        setResult(null);
        return;
      }
    }
    if (hub.name === from) {
      // Click lại điểm đã chọn làm điểm đi -> reset.
      setFrom(null);
      setTo(null);
      setResult(null);
      return;
    }
    if (!to) {
      setTo(hub.name);
      return;
    }
    // Cả 2 đã chọn, click hub mới -> coi như chọn lại điểm đi.
    setFrom(hub.name);
    setTo(null);
    setResult(null);
  }

  function findRoute() {
    setError(null);
    if (!from || !to) {
      setError("Vui lòng chọn cả điểm lấy hàng và điểm giao hàng trên bản đồ.");
      return;
    }
    const r = computeRouting(from, to, cargo);
    if (!r) {
      setResult(null);
      setError("Chưa có dữ liệu khoảng cách cho cặp thành phố này.");
      return;
    }
    setResult(r);
  }

  return (
    <div className="view">
      <div className="panel">
        <div className="panel-head">
          <h3>Chọn điểm trên bản đồ</h3>
        </div>
        <LeafletMap
          hubs={HUBS}
          onHubClick={handleHubClick}
          selected={{ from, to }}
          height={300}
        />
        <div className="routing-picked">
          <span>
            Điểm lấy hàng: <strong className="accent-text">{from || "— chưa chọn —"}</strong>
          </span>
          <span>
            Điểm giao hàng: <strong style={{ color: "var(--blue)" }}>{to || "— chưa chọn —"}</strong>
          </span>
        </div>

        <div className="routing-form">
          <label>
            Loại hàng
            <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
              {CARGO_TYPES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <button className="btn-primary routing-btn" onClick={findRoute}>
            Tìm tuyến tối ưu
          </button>
        </div>
        {error && <div className="auth-msg error inline-msg">{error}</div>}
      </div>

      {result && (
        <>
          <div className="grid-2">
            <div className="route-card">
              <div className="route-tag route-tag-gray">Tuyến truyền thống</div>
              <div className="route-big">{result.traditional.km} km</div>
              <div className="route-line">
                <span>{result.traditional.hours} giờ</span>
                <span>{result.traditional.hubs} điểm trung chuyển</span>
              </div>
              <div className="route-cost">{formatVnd(result.traditional.cost)}</div>
              <div className="route-path">Lộ trình: {result.traditional.path.join(" → ")}</div>
            </div>
            <div className="route-card route-card-ai">
              <div className="route-tag route-tag-amber">◈ Gợi ý bởi AI</div>
              <div className="route-big accent-text">{result.ai.km} km</div>
              <div className="route-line">
                <span>{result.ai.hours} giờ</span>
                <span>{result.ai.hubs} điểm trung chuyển</span>
              </div>
              <div className="route-cost accent-text">{formatVnd(result.ai.cost)}</div>
              <div className="route-path">Lộ trình: {result.ai.path.join(" → ")}</div>
              {result.cargoNote && <div className="cargo-note">{result.cargoNote}</div>}
              <ul className="benefit-list">
                {result.ai.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="save-banner">
            💬 Tiết kiệm khoảng <strong>{result.savePct}%</strong> thời gian nhờ
            chọn hub tối ưu và giảm điểm trung chuyển.
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Lộ trình chi tiết</h3>
            </div>
            <div className="grid-2">
              <div>
                <div className="timeline-title muted">Tuyến truyền thống</div>
                <Timeline stops={result.traditional.timeline} color="#8b98a9" />
              </div>
              <div>
                <div className="timeline-title accent-text">Tuyến AI</div>
                <Timeline stops={result.ai.timeline} color="var(--accent)" />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Bản đồ minh họa tuyến kết quả</h3>
            </div>
            <LeafletMap
              hubs={HUBS}
              resultPaths={{ traditional: result.traditional.path, ai: result.ai.path }}
              height={320}
            />
          </div>
        </>
      )}

      <p className="footnote">
        Mô hình minh họa dựa trên logic hợp lý (tối ưu hub trung chuyển, giảm
        quãng đường ~9%), <strong>không phải</strong> kết quả từ mô hình AI đã
        huấn luyện. Khoảng cách giữa các thành phố dùng số thật (gần đúng). Chi phí
        ước tính mang tính minh họa, dựa trên đơn giá vận tải phổ biến, không phải
        bảng giá chính thức của Viettel Post.
      </p>
    </div>
  );
}

function Timeline({ stops, color }) {
  return (
    <div className="timeline">
      {stops.map((s, i) => (
        <div className="timeline-item" key={i}>
          <div className="timeline-dot" style={{ background: color }} />
          {i < stops.length - 1 && <div className="timeline-line" />}
          <div className="timeline-content">
            <span className="timeline-time">{s.time}</span> — {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
