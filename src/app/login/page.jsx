"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROLES = ["Nhân viên vận hành", "Quản lý", "Admin"];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState("login"); // "login" | "register"
  const [step, setStep] = useState("form"); // "form" | "otp"

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState(null); // {type, text}
  const [countdown, setCountdown] = useState(0);

  // Đồng hồ đếm ngược cho nút "Gửi lại mã".
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  function show(type, text) {
    setMessage({ type, text });
  }

  // --- Gửi OTP tới email ---
  async function sendOtp(e) {
    e?.preventDefault();
    setMessage(null);

    if (!email) {
      show("error", "Vui lòng nhập email.");
      return;
    }
    if (tab === "register" && !fullName) {
      show("error", "Vui lòng nhập họ và tên.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Lưu vào user metadata -> trigger sẽ đẩy sang bảng profiles.
        data:
          tab === "register"
            ? { full_name: fullName, company, role }
            : undefined,
      },
    });
    setLoading(false);

    if (error) {
      show("error", "Không gửi được mã: " + error.message);
      return;
    }

    setStep("otp");
    setCountdown(30);
    setOtp(["", "", "", "", "", ""]);
    show("info", `Mã OTP 6 số đã được gửi tới ${email}. Kiểm tra hộp thư (cả mục Spam).`);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  // --- Xác nhận OTP ---
  async function verifyOtp(e) {
    e?.preventDefault();
    setMessage(null);
    const token = otp.join("");
    if (token.length !== 6) {
      show("error", "Vui lòng nhập đủ 6 số.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    setLoading(false);

    if (error) {
      show("error", "Mã không đúng hoặc đã hết hạn. " + error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // --- Đăng nhập Google ---
  async function signInGoogle() {
    setMessage(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setGoogleLoading(false);
      show("error", "Không kết nối được Google: " + error.message);
    }
    // Nếu thành công, trình duyệt tự chuyển sang trang đăng nhập Google.
  }

  function handleOtpChange(i, val) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <div className="auth-logo" aria-hidden>◈</div>
        <div>
          <div className="auth-kicker">Case Study · E-Logistics</div>
          <div className="auth-title-brand">Chuyển đổi số Logistics — Viettel Post</div>
        </div>
      </div>

      <div className="auth-card">
        {step === "form" && (
          <>
            <div className="auth-tabs">
              <button
                className={tab === "login" ? "active" : ""}
                onClick={() => {
                  setTab("login");
                  setMessage(null);
                }}
              >
                Đăng nhập
              </button>
              <button
                className={tab === "register" ? "active" : ""}
                onClick={() => {
                  setTab("register");
                  setMessage(null);
                }}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={sendOtp} className="auth-form">
              {tab === "register" && (
                <>
                  <label>
                    Họ và tên
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </label>
                  <label>
                    Công ty
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Tên công ty / đơn vị"
                    />
                  </label>
                </>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@vidu.com"
                  autoComplete="email"
                />
              </label>

              {tab === "register" && (
                <label>
                  Vai trò
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Đang gửi mã..."
                  : tab === "register"
                  ? "Tạo tài khoản"
                  : "Đăng nhập"}
              </button>
            </form>

            <div className="auth-divider">— hoặc đăng nhập nhanh —</div>

            <button
              className="btn-google"
              onClick={signInGoogle}
              disabled={googleLoading}
            >
              <GoogleIcon />
              {googleLoading ? "Đang chuyển tới Google..." : "Đăng nhập với Google"}
            </button>
          </>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="auth-form">
            <h2 className="otp-title">Nhập mã OTP</h2>
            <p className="otp-sub">
              Mã 6 số đã gửi tới <strong>{email}</strong>
            </p>

            <div className="otp-boxes" onPaste={handleOtpPaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                />
              ))}
            </div>

            <div className="otp-resend">
              {countdown > 0 ? (
                <span>
                  Gửi lại mã sau 00:{String(countdown).padStart(2, "0")}
                </span>
              ) : (
                <button type="button" className="link-btn" onClick={sendOtp}>
                  Gửi lại mã
                </button>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>

            <button
              type="button"
              className="link-btn back-btn"
              onClick={() => {
                setStep("form");
                setMessage(null);
              }}
            >
              ← Quay lại
            </button>
          </form>
        )}

        {message && <div className={`auth-msg ${message.type}`}>{message.text}</div>}
      </div>

      <p className="auth-disclaimer">
        Demo minh họa — dữ liệu vận hành là giả lập, phục vụ đồ án môn E-Logistics.
        Không thuộc hệ thống chính thức của Viettel Post.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.4 2 8 6.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 46c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 36.5 26.9 37.5 24 37.5c-5.2 0-9.6-3.3-11.2-8l-6.5 5C8 41 15.4 46 24 46z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.6 5.6C41.4 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
