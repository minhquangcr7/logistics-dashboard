"use client";

import { useState } from "react";
import { ROUTING_CITIES, computeRouting } from "@/lib/data";

export default function RoutingView() {
  const [from, setFrom] = useState("Hà Nội");
  const [to, setTo] = useState("TP.HCM");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function findRoute() {
    setError(null);
    if (from === to) {
      setResult(null);
      setError("Điểm đi và điểm đến phải khác nhau.");
      return;
    }
    const r = computeRouting(from, to);
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
        <div className="routing-form">
          <label>
            Điểm lấy hàng
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {ROUTING_CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Điểm giao hàng
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {ROUTING_CITIES.map((c) => (
                <option key={c}>{c}</option>
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
            </div>
            <div className="route-card route-card-ai">
              <div className="route-tag route-tag-amber">◈ Gợi ý bởi AI</div>
              <div className="route-big accent-text">{result.ai.km} km</div>
              <div className="route-line">
                <span>{result.ai.hours} giờ</span>
                <span>{result.ai.hubs} điểm trung chuyển</span>
              </div>
            </div>
          </div>

          <div className="save-banner">
            💬 Tiết kiệm khoảng <strong>{result.savePct}%</strong> thời gian nhờ
            chọn hub tối ưu và giảm điểm trung chuyển.
          </div>
        </>
      )}

      <p className="footnote">
        Mô hình minh họa dựa trên logic hợp lý (tối ưu hub trung chuyển, giảm
        quãng đường ~9%), <strong>không phải</strong> kết quả từ mô hình AI đã
        huấn luyện. Khoảng cách giữa các thành phố dùng số thật (gần đúng), tra
        cứu công khai.
      </p>
    </div>
  );
}
