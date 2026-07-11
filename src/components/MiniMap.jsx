// Sơ đồ tuyến minh họa (KHÔNG phải bản đồ địa lý thật) — đặc tả mục 3.3.
export default function MiniMap() {
  const hubs = [
    { name: "Hà Nội", x: 90, y: 45 },
    { name: "Đà Nẵng", x: 195, y: 130 },
    { name: "TP.HCM", x: 110, y: 220 },
  ];

  return (
    <div className="map-card">
      <svg viewBox="0 0 300 260" className="map-svg" role="img" aria-label="Sơ đồ tuyến minh họa">
        {/* Đường nối các hub */}
        <path
          id="route1"
          d="M90 45 L195 130 L110 220"
          fill="none"
          stroke="var(--line)"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />

        {/* Chấm di chuyển mô phỏng xe đang chạy */}
        <circle r="5" fill="var(--accent)">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#route1" />
          </animateMotion>
        </circle>
        <circle r="4" fill="var(--blue)">
          <animateMotion dur="6s" begin="3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#route1" />
          </animateMotion>
        </circle>

        {/* Các hub */}
        {hubs.map((h) => (
          <g key={h.name}>
            <circle cx={h.x} cy={h.y} r="8" fill="var(--accent)" opacity="0.25" />
            <circle cx={h.x} cy={h.y} r="4" fill="var(--accent)" />
            <text
              x={h.x + 12}
              y={h.y + 4}
              fill="var(--text)"
              fontSize="12"
              fontWeight="600"
            >
              {h.name}
            </text>
          </g>
        ))}
      </svg>
      <p className="map-note">Vị trí hub và tuyến đường mang tính minh họa.</p>
    </div>
  );
}
