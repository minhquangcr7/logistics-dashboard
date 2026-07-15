"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { routeColor } from "@/lib/data";

// Bản đồ Leaflet dark-theme dùng chung:
// - Tổng quan (mục 3.3): mỗi tuyến 1 màu cố định (nét đứt, weight nhỏ) +
//   chấm động màu theo loại hàng (tách biệt 2 lớp thông tin).
// - Định tuyến AI (mục 5.5): chọn hub bằng click.
// - Định tuyến AI (mục 5.9): vẽ 2 tuyến so sánh kết quả.
export default function LeafletMap({
  hubs,
  hubCounts = {},
  routes = null, // [{ from, to }] — vẽ đường màu cố định theo tuyến (mục 3.3)
  flowDots = null, // [{ from, to, color }] — chấm động theo loại hàng
  onHubClick,
  selected = {},
  resultPaths = null, // { traditional: [name,...], ai: [name,...] }
  height = 320,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const animCleanupRef = useRef(null);

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
    });

    return () => {
      cancelled = true;
      animCleanupRef.current?.();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vẽ hub, đường tuyến (màu cố định) và kết quả định tuyến.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || !layerRef.current) return;
      const layer = layerRef.current;
      layer.clearLayers();

      const byName = {};
      hubs.forEach((h) => (byName[h.name] = h));

      // Mỗi tuyến 1 màu cố định, nét đứt mảnh — KHÔNG dùng độ rộng theo lưu
      // lượng nữa (dễ chồng lấn, khó phân biệt tuyến — theo phản hồi thực tế).
      if (routes) {
        routes.forEach((r) => {
          const h1 = byName[r.from];
          const h2 = byName[r.to];
          if (!h1 || !h2) return;
          L.polyline(
            [
              [h1.lat, h1.lng],
              [h2.lat, h2.lng],
            ],
            {
              color: routeColor(r.from, r.to),
              weight: 2,
              dashArray: "4 8",
              opacity: 0.75,
            }
          ).addTo(layer);
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
  }, [hubs, hubCounts, routes, onHubClick, selected, resultPaths]);

  // Chấm động màu theo loại hàng (3-4 chấm, tách biệt hoàn toàn với màu tuyến).
  useEffect(() => {
    animCleanupRef.current?.();
    animCleanupRef.current = null;
    if (!flowDots || flowDots.length === 0) return;

    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || !layerRef.current) return;
      const byName = {};
      hubs.forEach((h) => (byName[h.name] = h));

      const dots = flowDots
        .map((f) => {
          const from = byName[f.from];
          const to = byName[f.to];
          if (!from || !to) return null;
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:9px;height:9px;border-radius:50%;background:${f.color};box-shadow:0 0 6px ${f.color}"></div>`,
            iconSize: [9, 9],
            iconAnchor: [4, 4],
          });
          const marker = L.marker([from.lat, from.lng], {
            icon,
            interactive: false,
          }).addTo(layerRef.current);
          return { marker, from, to, offset: Math.random() };
        })
        .filter(Boolean);

      if (dots.length === 0) return;

      let rafId;
      let last = performance.now();
      function tick(now) {
        const dt = now - last;
        last = now;
        dots.forEach((d) => {
          d.offset = (d.offset + dt * 0.00005) % 1;
          const lat = d.from.lat + (d.to.lat - d.from.lat) * d.offset;
          const lng = d.from.lng + (d.to.lng - d.from.lng) * d.offset;
          d.marker.setLatLng([lat, lng]);
        });
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

      animCleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        dots.forEach((d) => d.marker.remove());
      };
    });

    return () => {
      cancelled = true;
      animCleanupRef.current?.();
      animCleanupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowDots, hubs]);

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: 12, overflow: "hidden" }}
      className="leaflet-map-el"
    />
  );
}
