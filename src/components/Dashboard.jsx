"use client";

import { useState, useEffect } from "react";
import { generateOrders, advanceOneOrder } from "@/lib/data";
import OverviewView from "@/components/views/OverviewView";
import OrdersView from "@/components/views/OrdersView";
import RoutingView from "@/components/views/RoutingView";
import { IconGrid, IconList, IconCompass, IconMenu, IconLogout } from "@/components/icons";

const TABS = [
  {
    key: "overview",
    label: "Tổng quan",
    Icon: IconGrid,
    title: "Tổng quan vận hành",
    subtitle: "Bức tranh toàn cảnh tình trạng vận hành trong hôm nay",
  },
  {
    key: "orders",
    label: "Đơn hàng",
    Icon: IconList,
    title: "Theo dõi đơn hàng",
    subtitle: "Theo dõi chi tiết từng đơn hàng, cập nhật liên tục theo thời gian thực",
  },
  {
    key: "routing",
    label: "Định tuyến AI",
    Icon: IconCompass,
    title: "Định tuyến AI",
    subtitle: "So sánh tuyến truyền thống và tuyến tối ưu bởi AI",
  },
];

export default function Dashboard({ displayName, role, email }) {
  const [active, setActive] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [clock, setClock] = useState("");
  const [today, setToday] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Khởi tạo dữ liệu đơn hàng (chỉ ở client để tránh lệch server/client).
  useEffect(() => {
    setOrders(generateOrders());
  }, []);

  // Đồng hồ real-time (đặc tả mục 2).
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString("vi-VN", { hour12: false }));
      setToday(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Cơ chế real-time giả lập: mỗi 4 giây đẩy 1 đơn sang trạng thái kế (mục 4.3).
  useEffect(() => {
    const t = setInterval(() => {
      setOrders((prev) => advanceOneOrder(prev));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const current = TABS.find((t) => t.key === active);

  return (
    <div className="shell">
      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon" aria-hidden>◈</div>
          <div>
            <div className="brand-kicker">Case Study</div>
            <div className="brand-name">Logistics · Viettel Post</div>
          </div>
        </div>

        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${active === t.key ? "active" : ""}`}
              onClick={() => {
                setActive(t.key);
                setMenuOpen(false);
              }}
            >
              <span className="nav-icon" aria-hidden><t.Icon size={16} /></span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="user-avatar" aria-hidden>
              {(displayName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name" title={displayName}>{displayName}</div>
              <div className="user-role">{role}</div>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="signout-btn">
              <IconLogout size={14} />
              Đăng xuất
            </button>
          </form>
          <p className="disclaimer">
            Demo minh họa — dữ liệu giả lập phục vụ đồ án môn E-Logistics. Không
            thuộc hệ thống chính thức của Viettel Post.
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main">
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Mở menu"
          >
            <IconMenu size={18} />
          </button>
          <div className="topbar-title">
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </div>
          <div className="topbar-clock">
            <div className="clock-time">{clock}</div>
            <div className="clock-date">{today}</div>
          </div>
        </header>

        <main className="content">
          {active === "overview" && <OverviewView orders={orders} />}
          {active === "orders" && <OrdersView orders={orders} />}
          {active === "routing" && <RoutingView />}
        </main>
      </div>

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
