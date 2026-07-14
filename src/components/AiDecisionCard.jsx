"use client";

import { useState } from "react";

// AI Decision Support — cảnh báo & gợi ý điều phối rule-based (mục 3.4).
export default function AiDecisionCard({ alerts }) {
  const [expanded, setExpanded] = useState({});
  const [applied, setApplied] = useState({});

  if (alerts.length === 0) {
    return (
      <div className="panel ai-card">
        <div className="panel-head">
          <h3>🤖 AI Decision Support — Cảnh báo &amp; gợi ý điều phối</h3>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Hiện chưa phát hiện bất thường nào cần chú ý. Hệ thống đang giám sát liên tục.
        </p>
      </div>
    );
  }

  return (
    <div className="panel ai-card">
      <div className="panel-head">
        <h3>🤖 AI Decision Support — Cảnh báo &amp; gợi ý điều phối</h3>
        <span className="live-dot">● giám sát liên tục</span>
      </div>

      <div className="ai-alerts">
        {alerts.map((a) => (
          <div key={a.id} className={`ai-alert ${applied[a.id] ? "applied" : ""}`}>
            <div className="ai-alert-icon">{applied[a.id] ? "✅" : "⚠"}</div>
            <div className="ai-alert-body">
              <div className="ai-alert-title">{a.title}</div>
              <div className="ai-alert-suggestion">🤖 <em>{a.suggestion}</em></div>
              {expanded[a.id] && <div className="ai-alert-detail">{a.detail}</div>}
              <div className="ai-alert-actions">
                <button
                  className="link-btn"
                  onClick={() => setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))}
                >
                  {expanded[a.id] ? "Ẩn chi tiết" : "Xem chi tiết"}
                </button>
                <button
                  className="chip apply-btn"
                  disabled={applied[a.id]}
                  onClick={() => setApplied((e) => ({ ...e, [a.id]: true }))}
                >
                  {applied[a.id] ? "Đã áp dụng" : "Áp dụng gợi ý"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="footnote">
        Mô phỏng luồng ra quyết định dựa trên luật (rule-based) áp dụng lên dữ liệu có
        sẵn — thể hiện ý tưởng &quot;AI hỗ trợ ra quyết định&quot;, không phải mô hình
        máy học đã huấn luyện.
      </p>
    </div>
  );
}
