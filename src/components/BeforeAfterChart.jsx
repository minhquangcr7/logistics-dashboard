import { BEFORE_AFTER } from "@/lib/data";

// Biểu đồ cột đôi Trước/Sau (đặc tả mục 5B). Tự vẽ bằng div để không cần thư viện.
export default function BeforeAfterChart() {
  const max = Math.max(...BEFORE_AFTER.flatMap((d) => [d.before, d.after]));

  return (
    <div className="chart">
      <div className="chart-legend">
        <span><i className="swatch swatch-gray" /> Trước chuyển đổi số</span>
        <span><i className="swatch swatch-amber" /> Sau chuyển đổi số</span>
      </div>

      <div className="chart-grid">
        {BEFORE_AFTER.map((d) => (
          <div className="chart-group" key={d.metric}>
            <div className="chart-bars">
              <div className="bar-wrap">
                <span className="bar-val">{d.before}%</span>
                <div
                  className="bar bar-before"
                  style={{ height: `${(d.before / max) * 160}px` }}
                />
              </div>
              <div className="bar-wrap">
                <span className="bar-val bar-val-accent">{d.after}%</span>
                <div
                  className="bar bar-after"
                  style={{ height: `${(d.after / max) * 160}px` }}
                />
              </div>
            </div>
            <div className="chart-label">{d.metric}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
