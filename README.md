# Dashboard Chuyển đổi số Logistics — Case study Viettel Post

Đồ án môn **E-Logistics**. Website dashboard 1 trang (Next.js) gồm: đăng nhập bằng
**OTP email thật** + **Google OAuth thật** (qua Supabase), và 4 module: Tổng quan,
Đơn hàng (tracking real-time giả lập), Định tuyến AI, Báo cáo.

> **Lưu ý học thuật:** Dữ liệu vận hành (đơn hàng, khách, vị trí) là **giả lập**.
> Khoảng cách thành phố và số liệu chuyển đổi số của Viettel Post trong phần Báo cáo
> là **số thật có trích nguồn**. Không dùng logo/nhận diện chính thức của Viettel Post.

---

## A. Chạy thử trên máy (localhost)

Cần cài **Node.js 18+** (tải tại https://nodejs.org — bản LTS).

1. Mở **PowerShell** trong thư mục project này (`logistics-dashboard`).
2. Cài thư viện:
   ```powershell
   npm install
   ```
3. Tạo file `.env.local` (xem **Bước 2** ở mục B để lấy 2 giá trị). Có thể copy từ mẫu:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```
   rồi mở `.env.local` điền URL và anon key của Supabase.
4. Chạy:
   ```powershell
   npm run dev
   ```
5. Mở trình duyệt vào **http://localhost:3000**.

> Chưa điền Supabase thì giao diện vẫn hiện, nhưng bấm đăng nhập sẽ báo lỗi — vì
> chưa có backend xác thực. Làm xong mục B là chạy được đầy đủ.

---

## B. Thiết lập Supabase (backend xác thực + database)

### Bước 1 — Tạo project Supabase
1. Vào https://supabase.com → **Sign in** (đăng nhập bằng GitHub cho nhanh).
2. **New project** → đặt tên (vd `logistics-dashboard`), chọn region **Southeast Asia (Singapore)**,
   đặt một **Database Password** (lưu lại phòng khi cần). Bấm **Create new project**, đợi ~1 phút.

### Bước 2 — Lấy URL và anon key
1. Vào **Project Settings** (icon bánh răng) → **API**.
2. Copy 2 giá trị vào file `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   > `anon` key là key công khai, an toàn để dùng ở trình duyệt. **Đừng** dùng `service_role`.

### Bước 3 — Tạo bảng profiles (database)
1. Trong Supabase, mở **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql` trong project, **copy toàn bộ** dán vào, bấm **Run**.
3. Thấy "Success" là xong. (Kiểm tra: **Table Editor** sẽ có bảng `profiles`.)

### Bước 4 — Bật OTP 6 số qua email  ⚠️ QUAN TRỌNG
Mặc định Supabase gửi **đường link đăng nhập**, không phải mã 6 số. Phải sửa template:
1. Vào **Authentication** → **Emails** (hoặc **Email Templates**) → chọn tab **Magic Link**.
2. Xóa nội dung mẫu, thay bằng (bắt buộc có `{{ .Token }}`):
   ```html
   <h2>Mã đăng nhập của bạn</h2>
   <p>Nhập mã 6 số sau để đăng nhập:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>Mã có hiệu lực trong ít phút.</p>
   ```
3. **Save**.
4. (Nên làm) Vào **Authentication → Providers → Email**, bật **Enable Email provider**,
   và có thể tắt **Confirm email** để demo mượt hơn.

> **Giới hạn email miễn phí:** Supabase chỉ gửi khoảng **2–3 email/giờ** bằng dịch vụ
> test có sẵn. Đủ để demo. Nếu cần gửi nhiều (lúc thuyết trình), vào
> **Project Settings → Authentication → SMTP** cấu hình SMTP riêng (vd Gmail/Brevo).

### Bước 5 — Bật đăng nhập Google
Cần lấy Client ID/Secret từ Google, rồi dán vào Supabase.

**5a. Tạo OAuth credential trên Google:**
1. Vào https://console.cloud.google.com → tạo 1 project mới (hoặc dùng project sẵn có).
2. **APIs & Services → OAuth consent screen**: chọn **External**, điền tên app + email,
   Save. (Ở chế độ Testing, thêm email của bạn vào **Test users**.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**: dán đúng URL callback của Supabase:
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
     (`<project-ref>` chính là phần trong Project URL ở Bước 2.)
   - Bấm **Create** → copy **Client ID** và **Client secret**.

**5b. Dán vào Supabase:**
1. Supabase → **Authentication → Providers → Google** → bật **Enable**.
2. Dán **Client ID** và **Client Secret** → **Save**.

### Bước 6 — Khai báo URL của web cho Supabase
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (khi chạy máy) — sau khi deploy Vercel thì đổi thành URL Vercel.
- **Redirect URLs**: thêm cả hai (mỗi dòng một URL):
  ```
  http://localhost:3000/**
  https://<ten-app-cua-ban>.vercel.app/**
  ```

Xong 6 bước → chạy lại `npm run dev`, thử đăng ký bằng email (nhận mã OTP) và thử nút Google.

---

## C. Đưa code lên GitHub (bạn tự làm thủ công)

File nhạy cảm `.env.local` đã được `.gitignore` bỏ qua — sẽ **không** bị đẩy lên (đúng như mong muốn).
Cách push: tạo repo mới trên GitHub rồi trong thư mục project chạy:
```powershell
git init
git add .
git commit -m "Logistics dashboard - do an E-Logistics"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

---

## D. Deploy lên Vercel

1. Vào https://vercel.com → **Sign up / Log in** bằng GitHub.
2. **Add New… → Project** → chọn repo vừa push → **Import**.
3. Vercel tự nhận diện **Next.js** — không cần đổi build settings.
4. Mở mục **Environment Variables**, thêm đúng 2 biến (giống `.env.local`):
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
5. Bấm **Deploy**, đợi ~1–2 phút → nhận link `https://<ten-app>.vercel.app`.
6. **Quay lại Supabase** cập nhật cho khớp domain thật:
   - **Authentication → URL Configuration → Site URL** = link Vercel.
   - Thêm link Vercel vào **Redirect URLs** (dạng `https://<ten-app>.vercel.app/**`).
   > Bỏ qua bước này thì đăng nhập trên bản deploy sẽ lỗi redirect.

Mỗi lần bạn `git push` lên `main`, Vercel tự build lại và cập nhật web.

---

## E. Cấu trúc thư mục (tham khảo)
```
src/
  app/
    login/page.jsx        Màn hình đăng nhập/đăng ký + OTP
    dashboard/page.jsx    Kiểm tra đăng nhập rồi render dashboard
    auth/callback/route   Xử lý Google OAuth quay về
    auth/signout/route    Đăng xuất
    layout.jsx, page.jsx, globals.css
  components/
    Dashboard.jsx         Khung sidebar + topbar + chuyển tab
    views/                OverviewView, OrdersView, RoutingView, ReportView
    StatusPill, MiniMap, BeforeAfterChart
  lib/
    data.js               Dữ liệu mẫu, khoảng cách, số liệu báo cáo
    supabase/             client / server / middleware
  middleware.js           Bảo vệ route /dashboard
supabase/schema.sql       Chạy trong Supabase SQL Editor
```

## Xử lý sự cố nhanh
- **Không nhận được email OTP:** kiểm tra Spam; nhớ đã sửa template có `{{ .Token }}` (Bước 4);
  có thể đã chạm giới hạn email/giờ → đợi hoặc cấu hình SMTP.
- **Google báo redirect_uri_mismatch:** URL trong Google Console phải đúng
  `https://<project-ref>.supabase.co/auth/v1/callback`.
- **Đăng nhập xong bị đá về /login:** kiểm tra **Redirect URLs** và **Site URL** trong Supabase.
- **Bảng profiles trống sau khi đăng ký:** chạy lại `supabase/schema.sql` (Bước 3).
