"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { routeColor } from "@/lib/data";

// Bản đồ Leaflet dark-theme dùng chung:
// - Tổng quan (mục 3.3): mỗi tuyến 1 màu cố định (nét đứt, weight nhỏ) +
//   chấm động màu theo loại hàng. Click hub xem popup thông số kỹ thuật +
//   tỷ lệ lấp đầy.
// - Định tuyến AI: chọn hub bằng click (lối tắt) hoặc hiện điểm tuỳ ý đã
//   chọn qua thanh tìm kiếm (freeMarkers); vẽ tuyến theo toạ độ đường bộ
//   thật (resultPaths.coords) khi có kết quả.
export default function LeafletMap({
  hubs,
  hubCounts = {},
  hubCapacity = null, // [{ hub, pct }] — tỷ lệ lấp đầy minh hoạ
  routes = null, // [{ from, to }] — vẽ đường màu cố định theo tuyến (mục 3.3)
  flowDots = null, // [{ from, to, color }] — chấm động theo loại hàng
  onHubClick,
  selected = {},
  freeMarkers = null, // [{ name, lat, lng, role: 'from'|'to' }]
  resultPaths = null, // { traditional: {coords,real}, ai: {coords,real} }
  height = 320,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const animCleanupRef = useRef(null);
  // Hub vừa được click — chọn điểm (đổi `selected`) khiến effect vẽ lại
  // toàn bộ marker chạy lại và popup vừa mở bị xoá theo; lưu lại đây để tự
  // mở lại popup ngay sau khi vẽ xong, không mất thông số kỹ thuật vừa xem.
  const reopenPopupHubRef = useRef(null);

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

  // Vẽ hub, đường tuyến (màu cố định), marker tuỳ ý và kết quả định tuyến.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || !layerRef.current) return;
      const layer = layerRef.current;
      layer.clearLayers();

      const byName = {};
      hubs.forEach((h) => (byName[h.name] = h));
      const capByHub = {};
      (hubCapacity ?? []).forEach((c) => (capByHub[c.hub] = c.pct));

      const allBounds = [];

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

      // Kết quả định tuyến: 2 đường so sánh vẽ theo toạ độ đường bộ thật.
      if (resultPaths) {
        if (resultPaths.traditional?.coords?.length > 1) {
          const pts = resultPaths.traditional.coords;
          L.polyline(pts, {
            color: "#8b98a9",
            weight: 3,
            dashArray: resultPaths.traditional.real ? null : "6 6",
            opacity: 0.85,
          }).addTo(layer);
          allBounds.push(...pts);
        }
        if (resultPaths.ai?.coords?.length > 1) {
          const pts = resultPaths.ai.coords;
          L.polyline(pts, {
            color: "#f5a524",
            weight: 4,
            dashArray: resultPaths.ai.real ? null : "6 6",
            opacity: 0.95,
          }).addTo(layer);
          allBounds.push(...pts);
        }
      }

      // Marker điểm tuỳ ý (từ thanh tìm kiếm) — pin, không phải chấm hub.
      if (freeMarkers) {
        freeMarkers.forEach((m) => {
          const color = m.role === "from" ? "#f5a524" : "#388bfd";
          const icon = L.divIcon({
            className: "",
            html: `<div style="
              width:16px;height:16px;border-radius:50% 50% 50% 0;
              background:${color};border:2px solid #0d1117;
              transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,0.4);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 16],
          });
          L.marker([m.lat, m.lng], { icon, interactive: false })
            .addTo(layer)
            .bindTooltip(m.name, { direction: "top", offset: [0, -14] });
          allBounds.push([m.lat, m.lng]);
        });
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
        const pct = capByHub[h.name];
        marker.bindPopup(
          `<div style="font-size:13px;line-height:1.6;min-width:170px">
            <b>${h.name}</b>${h.secure ? ' <span style="color:#f5a524">🔒 An ninh cao</span>' : ""}
            <br/>Diện tích: ${h.area} · ${h.gates} cổng chia
            <br/>Công suất: ${h.dailyCapacity}${h.real ? ' <i style="color:#3fb950">(số liệu thật)</i>' : ""}
            ${h.robotSpeed ? `<br/>Robot phân loại: ${h.robotSpeed}` : ""}
            <br/>Đang xử lý: ${count} đơn
            ${pct != null ? `<br/>Lấp đầy (minh hoạ): <b>${pct}%</b>` : ""}
          </div>`
        );
        marker.on("click", () => {
          reopenPopupHubRef.current = h.name;
          onHubClick?.(h);
        });
        if (reopenPopupHubRef.current === h.name) {
          marker.openPopup();
          reopenPopupHubRef.current = null; // chỉ tự mở lại đúng 1 lần sau click
        }
      });

      if (allBounds.length > 1) {
        try {
          mapRef.current.fitBounds(allBounds, { padding: [24, 24], maxZoom: 8 });
        } catch {
          // bounds không hợp lệ (VD toàn trùng 1 điểm) — bỏ qua, giữ view mặc định
        }
      }

      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    });
    return () => {
      cancelled = true;
    };
  }, [hubs, hubCounts, hubCapacity, routes, onHubClick, selected, freeMarkers, resultPaths]);

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
