"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Bản đồ Leaflet dark-theme dùng chung: hiển thị 5 hub thật + đường nối có
// độ rộng tỷ lệ lưu lượng (mục 3.3), hỗ trợ chọn hub bằng click (mục 5.5),
// và vẽ 2 tuyến so sánh (mục 5.9).
export default function LeafletMap({
  hubs,
  hubCounts = {},
  onHubClick,
  selected = {},
  resultPaths = null, // { traditional: [name,...], ai: [name,...] }
  height = 320,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // React Strict Mode chạy effect 2 lần trong dev — nếu container còn
      // dấu vết từ lần mount trước, Leaflet sẽ báo "already initialized".
      if (containerRef.current._leaflet_id) {
        containerRef.current._leaflet_id = null;
      }

      const map = L.map(containerRef.current, {
        center: [16.5, 107.5],
        zoom: 5,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      map.__redraw?.();
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || !layerRef.current) return;
      const layer = layerRef.current;
      layer.clearLayers();

      const byName = {};
      hubs.forEach((h) => (byName[h.name] = h));

      const maxCount = Math.max(1, ...Object.values(hubCounts));

      // Đường nối lưu lượng (mặc định, khi không có resultPaths).
      if (!resultPaths) {
        const drawn = new Set();
        hubs.forEach((h1) => {
          hubs.forEach((h2) => {
            if (h1.id >= h2.id) return;
            const key = `${h1.name}-${h2.name}`;
            if (drawn.has(key)) return;
            drawn.add(key);
            const count =
              (hubCounts[h1.name] || 0) + (hubCounts[h2.name] || 0);
            if (count === 0) return;
            const weight = 1.5 + (count / maxCount) * 5;
            L.polyline(
              [
                [h1.lat, h1.lng],
                [h2.lat, h2.lng],
              ],
              { color: "#f5a524", weight, opacity: 0.35 }
            ).addTo(layer);
          });
        });
      }

      // Kết quả định tuyến: 2 đường so sánh (mục 5.9).
      if (resultPaths) {
        const toLatLng = (name) => {
          const h = byName[name];
          return h ? [h.lat, h.lng] : null;
        };
        if (resultPaths.traditional) {
          const pts = resultPaths.traditional.map(toLatLng).filter(Boolean);
          if (pts.length > 1) {
            L.polyline(pts, {
              color: "#8b98a9",
              weight: 3,
              dashArray: "6 6",
              opacity: 0.85,
            }).addTo(layer);
          }
        }
        if (resultPaths.ai) {
          const pts = resultPaths.ai.map(toLatLng).filter(Boolean);
          if (pts.length > 1) {
            L.polyline(pts, { color: "#f5a524", weight: 4, opacity: 0.95 }).addTo(
              layer
            );
          }
        }
      }

      // Marker cho từng hub.
      hubs.forEach((h) => {
        const isFrom = selected.from === h.name;
        const isTo = selected.to === h.name;
        const color = isFrom ? "#f5a524" : isTo ? "#388bfd" : "#e6edf3";
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${color};border:2px solid #0d1117;
            box-shadow:0 0 0 3px ${color}33;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([h.lat, h.lng], { icon }).addTo(layer);
        const count = hubCounts[h.name] ?? 0;
        marker.bindPopup(
          `<b>${h.name}</b><br/>${count} đơn đang xử lý${
            h.secure ? "<br/><i>Hub an ninh cao</i>" : ""
          }`
        );
        if (onHubClick) {
          marker.on("click", () => onHubClick(h));
        }
      });

      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    });
    return () => {
      cancelled = true;
    };
  }, [hubs, hubCounts, onHubClick, selected, resultPaths]);

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: 12, overflow: "hidden" }}
      className="leaflet-map-el"
    />
  );
}
