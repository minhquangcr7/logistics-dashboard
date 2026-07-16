"use client";

import { useMemo } from "react";
import { generateForecast } from "@/lib/data";
import { IconTrendUp } from "@/components/icons";

const W = 640;
const H = 180;
const PAD_X = 24;
const PAD_Y = 20;

// Dự báo lưu lượng 7 ngày tới — mô phỏng có xu hướng + chu kỳ tuần, KHÔNG
// phải kết quả từ mô hình đã huấn luyện (nhất quán với các module AI khác).
export default function ForecastChart({ baseVolume }) {
  const points = useMemo(() => generateForecast(baseVolume), [baseVolume]);

  const max = Math.max(...points.map((p) => p.value)) * 1.15;
  const min = Math.min(...points.map((p) => p.value)) * 0.85;
  const range = Math.max(max - min, 1);

  const stepX = (W - PAD_X * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_Y + (H - PAD_Y * 2) * (1 - (p.value - min) / range);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x},${H - PAD_Y} L${coords[0].x},${H - PAD_Y} Z`;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>
            <IconTrendUp size={17} className="heading-icon" />
            Dự báo lưu lượng 7 ngày tới
          </h3>
          <p className="ai-sub">
            Ước tính theo xu hướng vận hành gần đây — hỗ trợ chủ động sắp xếp xe và
            nhân lực.
          </p>
        </div>
      </div>

      <div className="forecast-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="forecast-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#forecastFill)" stroke="none" />
          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="var(--accent)" />
          ))}
        </svg>
        <div className="forecast-labels">
          {points.map((p, i) => (
            <div className="forecast-label" key={i}>
              <div className="forecast-label-day">{p.label}</div>
              <div className="forecast-label-date">{p.date}</div>
              <div className="forecast-label-value">{p.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
