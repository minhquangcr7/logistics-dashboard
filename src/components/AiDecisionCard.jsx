"use client";

import { useState } from "react";
import { AI_ALERT_GROUPS } from "@/lib/data";

const PRIORITY_META = {
  high: { label: "🔴 Cao", cls: "prio-high" },
  medium: { label: "🟡 Trung bình", cls: "prio-medium" },
  low: { label: "🟢 Thấp", cls: "prio-low" },
};

// AI Decision Support — 3 nhóm cảnh báo/gợi ý rule-based chính thức (mục 3.4):
// 🔔 Cảnh báo trễ hàng · 🧭 Tối ưu tuyến · ⚖️ Cân bằng tải hub.
export default function AiDecisionCard({ alerts }) {
  const [expanded, setExpanded] = useState({});
  const [applied, setApplied] = useState({});

  return (
    <div className="panel ai-card">
      <div className="panel-head">
        <div>
          <h3>🤖 AI Decision Support — Cảnh báo &amp; gợi ý điều phối</h3>
          <p className="ai-sub">
            Gợi ý tự động dựa trên dữ liệu đang vận hành — khác với tra cứu thủ công ở
            tab Định tuyến AI.
          </p>
        </div>
        <span className="live-dot">● giám sát liên tục</span>
      </div>

      {alerts.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          Hiện chưa phát hiện bất thường nào cần chú ý.
        </p>
      ) : (
        <div className="ai-alerts">
          {alerts.map((a) => {
            const group = AI_ALERT_GROUPS[a.group];
            const prio = PRIORITY_META[a.priority];
            return (
              <div key={a.id} className={`ai-alert ${applied[a.id] ? "applied" : ""}`}>
                <div className="ai-alert-icon">{applied[a.id] ? "✅" : group.icon}</div>
                <div className="ai-alert-body">
                  <div className="ai-alert-top">
                    <span className="ai-group-label">{group.label}</span>
                    <span className={`prio-badge ${prio.cls}`}>{prio.label}</span>
                  </div>
                  <div className="ai-alert-title">{a.title}</div>
                  <div
                    className="ai-alert-summary"
                    dangerouslySetInnerHTML={{ __html: a.summary }}
                  />
                  <div className="ai-alert-suggestion">
                    🤖 <strong>{a.suggestionLabel}:</strong> <em>{a.suggestion}</em>
                  </div>
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
                      {applied[a.id] ? "Đã áp dụng" : group.actionLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="footnote">
        Mô phỏng luồng ra quyết định dựa trên luật (rule-based) áp dụng lên dữ liệu có
        sẵn — thể hiện ý tưởng &quot;AI hỗ trợ ra quyết định&quot;, không phải mô hình
        máy học đã huấn luyện.
      </p>
    </div>
  );
}
