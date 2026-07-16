"use client";

import { useState } from "react";
import { AI_ALERT_GROUPS } from "@/lib/data";
import { IconBell, IconCompass, IconScale, IconCheck, IconRadar } from "@/components/icons";

const GROUP_ICONS = { bell: IconBell, compass: IconCompass, scale: IconScale };

const PRIORITY_META = {
  high: { label: "Cao", cls: "prio-high" },
  medium: { label: "Trung bình", cls: "prio-medium" },
  low: { label: "Thấp", cls: "prio-low" },
};

// Cảnh báo & gợi ý điều phối — 3 nhóm rule-based chính thức (mục 3.4):
// Cảnh báo trễ hàng · Tối ưu tuyến · Cân bằng tải hub.
export default function AiDecisionCard({ alerts }) {
  const [expanded, setExpanded] = useState({});
  const [applied, setApplied] = useState({});

  return (
    <div className="panel ai-card">
      <div className="panel-head">
        <div>
          <h3>
            <IconRadar size={17} className="heading-icon" />
            Cảnh báo &amp; gợi ý điều phối
          </h3>
          <p className="ai-sub">
            Cập nhật theo dữ liệu vận hành thời gian thực — khác với tra cứu thủ công ở
            tab Định tuyến AI.
          </p>
        </div>
        <span className="live-dot">● theo dõi liên tục</span>
      </div>

      {alerts.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          Hiện chưa phát hiện bất thường nào cần chú ý.
        </p>
      ) : (
        <div className="ai-alerts">
          {alerts.map((a) => {
            const group = AI_ALERT_GROUPS[a.group];
            const GroupIcon = GROUP_ICONS[group.icon];
            const prio = PRIORITY_META[a.priority];
            const isApplied = applied[a.id];
            return (
              <div key={a.id} className={`ai-alert prio-${a.priority} ${isApplied ? "applied" : ""}`}>
                <div className="ai-alert-icon">
                  {isApplied ? <IconCheck size={17} /> : <GroupIcon size={17} />}
                </div>
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
                    <strong>{a.suggestionLabel}:</strong> <span>{a.suggestion}</span>
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
                      disabled={isApplied}
                      onClick={() => setApplied((e) => ({ ...e, [a.id]: true }))}
                    >
                      {isApplied ? "Đã áp dụng" : group.actionLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="footnote">
        Cảnh báo được sinh theo bộ quy tắc cố định dựa trên dữ liệu đơn hàng hiện có —
        chưa phải kết quả từ mô hình máy học đã huấn luyện.
      </p>
    </div>
  );
}
