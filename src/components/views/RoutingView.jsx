"use client";

import { useState, memo } from "react";
import dynamic from "next/dynamic";
import { HUBS, CARGO_TYPES } from "@/lib/data";
import { planRoute } from "@/lib/routing";
import PlaceSearch from "@/components/PlaceSearch";
import { IconSparkle, IconCheck } from "@/components/icons";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton">Đang tải bản đồ…</div>,
});

function formatVnd(n) {
  return n.toLocaleString("vi-VN") + "đ";
}

function RoutingView() {
  const [from, setFrom] = useState(null); // { name, lat, lng, isHub }
  const [to, setTo] = useState(null);
  const [cargo, setCargo] = useState("normal");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Click hub trên bản đồ = lối tắt chọn điểm (thay vì phải gõ tìm kiếm).
  function handleHubClick(hub) {
    setError(null);
    const point = { name: hub.name, lat: hub.lat, lng: hub.lng, isHub: true };
    if (!from) {
      setFrom(point);
      setResult(null);
      return;
    }
    if (from.name === hub.name) {
      setFrom(null);
      setTo(null);
      setResult(null);
      return;
    }
    if (!to) {
      setTo(point);
      return;
    }
    setFrom(point);
    setTo(null);
    setResult(null);
  }

  function pickFrom(place) {
    setFrom({ ...place, isHub: false });
    setResult(null);
    setError(null);
  }

  function pickTo(place) {
    setTo({ ...place, isHub: false });
    setResult(null);
    setError(null);
  }

  async function findRoute() {
    setError(null);
    if (!from || !to) {
      setError("Vui lòng chọn cả điểm lấy hàng và điểm giao hàng.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await planRoute(from, to, cargo);
      setResult(r);
    } catch {
      setError("Không tính được tuyến, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const freeMarkers = [
    from && !from.isHub ? { ...from, role: "from" } : null,
    to && !to.isHub ? { ...to, role: "to" } : null,
  ].filter(Boolean);

  const selected = {
    from: from?.isHub ? from.name : undefined,
    to: to?.isHub ? to.name : undefined,
  };

  return (
    <div className="view">
      <div className="panel">
        <div className="panel-head">
          <h3>Chọn điểm lấy hàng &amp; giao hàng</h3>
        </div>

        <div className="place-search-row">
          <PlaceSearch
            label="Điểm lấy hàng"
            placeholder="Nhập địa chỉ, tên đường, thành phố…"
            value={from}
            onSelect={pickFrom}
            accentColor="var(--accent)"
          />
          <PlaceSearch
            label="Điểm giao hàng"
            placeholder="Nhập địa chỉ, tên đường, thành phố…"
            value={to}
            onSelect={pickTo}
            accentColor="var(--blue)"
          />
        </div>

        <p className="footnote" style={{ marginTop: 0 }}>
          Có thể gõ bất kỳ địa chỉ nào ở Việt Nam, hoặc bấm nhanh vào 1 hub trên bản đồ
          bên dưới. Click vào hub để xem thông số kỹ thuật.
        </p>

        <LeafletMap
          hubs={HUBS}
          onHubClick={handleHubClick}
          selected={selected}
          freeMarkers={freeMarkers}
          height={300}
          tileStyle="voyager"
          fitMaxZoom={15}
          scrollZoom
        />

        <div className="routing-form">
          <label>
            Loại hàng
            <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
              {CARGO_TYPES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <button className="btn-primary routing-btn" onClick={findRoute} disabled={loading}>
            {loading ? "Đang tính tuyến đường thật…" : "Tìm tuyến tối ưu"}
          </button>
        </div>
        {error && <div className="auth-msg error inline-msg">{error}</div>}
      </div>

      {result && (
        <>
          {!result.usedRealRoads && (
            <div className="auth-msg error inline-msg">
              Không kết nối được dịch vụ bản đồ đường thật lúc này — đang hiển thị ước
              tính theo đường thẳng.
            </div>
          )}

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
                  <li key={b}>
                    <IconCheck size={13} className="benefit-check" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="save-banner">
            <IconSparkle size={15} />
            Tiết kiệm khoảng <strong>{result.savePct}%</strong> thời gian nhờ chọn hub
            tối ưu và giảm điểm trung chuyển.
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
              <span className="live-dot">
                {result.usedRealRoads ? "● đường bộ thật (OSM)" : "● ước tính"}
              </span>
            </div>
            <LeafletMap
              hubs={HUBS}
              resultPaths={{
                traditional: { coords: result.traditional.coords, real: result.traditional.real },
                ai: { coords: result.ai.coords, real: result.ai.real },
              }}
              height={320}
              tileStyle="voyager"
              fitMaxZoom={15}
              scrollZoom
            />
          </div>
        </>
      )}

      <p className="footnote">
        Km/giờ lấy theo đường bộ thật qua OpenStreetMap (OSRM) khi có mạng; nếu dịch vụ
        lỗi sẽ tự chuyển sang ước tính đường thẳng, có ghi chú rõ. Mô hình lựa chọn hub
        trung chuyển và % tiết kiệm thời gian vẫn là minh họa dựa trên logic hợp lý,
        không phải kết quả từ mô hình AI đã huấn luyện. Chi phí ước tính mang tính minh
        họa, dựa trên đơn giá vận tải phổ biến, không phải bảng giá chính thức của
        Viettel Post.
      </p>
    </div>
  );
}

// Không nhận prop nào từ Dashboard — memo để tránh bị render lại theo đồng hồ
// real-time (tick mỗi giây) và tick đơn hàng (mỗi 4 giây) ở component cha,
// vốn trước đây khiến bản đồ tự canh khung lại liên tục, đè mất thao tác
// zoom tay của người dùng.
export default memo(RoutingView);

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
