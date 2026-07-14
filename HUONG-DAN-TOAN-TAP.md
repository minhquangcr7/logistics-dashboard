# Hướng dẫn toàn tập — Dashboard Chuyển đổi số Logistics

Viết cho người **chưa biết gì về lập trình/web**. Đọc từ trên xuống, làm theo thứ tự,
đừng nhảy bước. Mỗi bước đều nói rõ: làm ở đâu, bấm gì, dán gì.

> Project này **đã được dựng và deploy xong 1 lần** rồi (xem mục "Trạng thái hiện tại"
> ở cuối file). File này để bạn hiểu **toàn bộ** hệ thống hoạt động ra sao, và để làm
> lại từ đầu nếu cần (ví dụ mất quyền truy cập, muốn tạo bản mới, hoặc đổi sang tài
> khoản khác).

---

## 0. Bức tranh tổng thể — hệ thống gồm những mảnh nào?

Một website hiện đại không nằm gọn trong 1 chỗ. Project này dùng **4 dịch vụ**, mỗi
cái một vai trò:

| Dịch vụ | Vai trò | Miễn phí? |
|---|---|---|
| **GitHub** | Kho lưu trữ code (như Google Drive nhưng cho code, có lịch sử thay đổi) | Có |
| **Supabase** | "Bộ não" phía sau: database lưu tài khoản người dùng, xử lý đăng nhập (OTP + Google) | Có (gói Free) |
| **Vercel** | Nơi website thực sự "sống" — biến code thành trang web ai cũng truy cập được | Có (gói Hobby) |
| **Brevo** | Dịch vụ gửi email thật (để gửi mã OTP 6 số) | Có (300 email/ngày) |
| **Google Cloud Console** | Nơi đăng ký "Đăng nhập bằng Google" cho website | Có |

Luồng hoạt động: **Code nằm trên GitHub → Vercel lấy code đó dựng thành website →
Website gọi tới Supabase mỗi khi cần đăng nhập/lưu dữ liệu → Supabase gọi Brevo để gửi
email OTP, và gọi Google để xác thực khi người dùng bấm "Đăng nhập với Google".**

---

## 1. Chuẩn bị máy tính

1. Cài **Node.js** (bản LTS): https://nodejs.org — cứ Next, Next, Install, không cần
   tick gì đặc biệt.
2. Cài **Git**: https://git-scm.com/downloads — cứ Next mặc định.
3. Kiểm tra cài xong chưa: mở **PowerShell**, gõ:
   ```powershell
   node -v
   git --version
   ```
   Thấy hiện số phiên bản (không phải lỗi "not recognized") là được.

---

## 2. Tài khoản cần tạo (làm theo đúng thứ tự)

Nguyên tắc quan trọng: **dùng 1 email của chính bạn xuyên suốt** cho tất cả (GitHub,
Supabase, Vercel, Brevo, Google) để dễ quản lý và không bị lẫn với tài khoản người khác.

### 2.1 Tạo tài khoản GitHub
1. Vào https://github.com/signup
2. Nhập email, đặt mật khẩu, đặt **username** (tên hiển thị, vd `nguyenvana123`) — nhớ kỹ
   username này vì sẽ dùng lại nhiều lần.
3. Xác nhận email nếu được yêu cầu.

### 2.2 Tạo tài khoản Supabase
1. Vào https://supabase.com → **Start your project**.
2. Chọn **Continue with GitHub** (dùng luôn tài khoản GitHub vừa tạo cho đồng bộ) →
   bấm Authorize.
3. Nếu đây là lần đầu, Supabase sẽ hỏi tạo **Organization** — đặt tên tuỳ ý (vd tên
   bạn), chọn plan **Free**, bấm tạo.

### 2.3 Tạo tài khoản Vercel
1. Vào https://vercel.com/signup
2. Chọn **Continue with GitHub** → Authorize.

### 2.4 Tạo tài khoản Brevo (để gửi email OTP thật)
1. Vào https://www.brevo.com → **Sign up free**.
2. Đăng ký bằng email, đặt mật khẩu, xác nhận email.
3. Brevo có thể hỏi vài câu về mục đích dùng — chọn đại loại "Transactional emails".

### 2.5 Tạo tài khoản Google Cloud (để làm nút "Đăng nhập với Google")
Chỉ cần 1 tài khoản Gmail bình thường, không cần tạo gì thêm ở bước này — sẽ tạo
"OAuth Client" ở mục 5.

---

## 3. Lấy code project về máy

Nếu code đã có sẵn trên GitHub (ví dụ do người khác tạo hộ), bạn **clone** về:
```powershell
git clone https://github.com/<username>/logistics-dashboard.git
cd logistics-dashboard
npm install
```

Nếu làm từ đầu hoàn toàn (chưa có code), cần nhờ AI/lập trình viên viết code trước —
phần này nằm ngoài phạm vi 1 file hướng dẫn setup.

---

## 4. Dựng Supabase (database + đăng nhập)

### 4.1 Tạo project
1. Vào https://supabase.com/dashboard → **New project**.
2. Chọn Organization vừa tạo → đặt tên project (vd `logistics-dashboard`).
3. Đặt 1 **Database Password** mạnh — **lưu lại chỗ an toàn** (vd Notes trên điện
   thoại), sẽ cần dùng lại nếu muốn kết nối trực tiếp vào database sau này.
4. Region chọn **Southeast Asia (Singapore)** — gần Việt Nam nhất, tốc độ tốt nhất.
5. Bấm **Create new project**, đợi khoảng 1-2 phút.

### 4.2 Tạo bảng lưu thông tin người dùng
1. Trong project vừa tạo, vào menu trái → **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql` trong code project (dùng Notepad hoặc VS Code) →
   copy toàn bộ nội dung → dán vào ô SQL Editor.
3. Bấm **Run** (hoặc Ctrl+Enter). Thấy chữ "Success" là xong.
4. Kiểm tra: vào **Table Editor** ở menu trái, sẽ thấy bảng tên `profiles`.

### 4.3 Lấy URL và anon key (để website kết nối vào)
1. Vào **Project Settings** (icon bánh răng, góc dưới trái) → **API**.
2. Copy 2 giá trị:
   - **Project URL** (dạng `https://xxxxx.supabase.co`)
   - **anon public** key (chuỗi dài bắt đầu `eyJ...`)
3. Trong code project, mở file `.env.local` (nếu chưa có thì copy từ
   `.env.local.example` rồi đổi tên thành `.env.local`), điền:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

> ⚠️ **Không chia sẻ** `service_role` key (key thứ 2, khác với anon key) cho bất kỳ
> ai — key đó có toàn quyền trên database. Chỉ dùng **anon** key cho website.

---

## 5. Bật đăng nhập Google thật

### 5.1 Tạo OAuth Client trên Google Cloud
1. Vào https://console.cloud.google.com
2. Góc trên, bấm chọn project → **New Project** → đặt tên tuỳ ý → Create.
3. Vào menu trái (hoặc thanh tìm kiếm) → gõ **"OAuth consent screen"** → mở nó.
4. Nếu là lần đầu, chọn **External** → điền **App name** (tên hiển thị khi người dùng
   đăng nhập), **User support email** (email của bạn) → Save and Continue qua các
   bước còn lại (không cần điền gì thêm, cứ Save and Continue tới cuối).
5. Vào **Credentials** (menu trái) → **Create Credentials** → **OAuth client ID**.
6. **Application type**: chọn **Web application**.
7. Mục **Authorized JavaScript origins** → **+ Add URI** → dán URL website của bạn
   (vd `https://ten-app-cua-ban.vercel.app`). Nếu website chưa deploy, tạm thời dùng
   `http://localhost:3000`.
8. Mục **Authorized redirect URIs** → **+ Add URI** → dán:
   ```
   https://<project-ref-supabase>.supabase.co/auth/v1/callback
   ```
   (`<project-ref-supabase>` là phần trong Project URL ở bước 4.3, ví dụ nếu URL là
   `https://enxegfgnnefyitpukxex.supabase.co` thì ref là `enxegfgnnefyitpukxex`.)
9. Bấm **Create**. Một popup hiện ra với **Client ID** và **Client secret** — copy lại
   2 giá trị này (Client secret chỉ hiện 1 lần, nhớ lưu lại).

### 5.2 Dán vào Supabase
1. Trong Supabase Dashboard → **Authentication** (menu trái) → **Providers**.
2. Tìm **Google** → bật **Enable Sign in with Google**.
3. Dán **Client ID** và **Client Secret** vừa copy → **Save**.

---

## 6. Bật OTP 6 số qua email thật (dùng Brevo)

Mặc định Supabase chỉ cho gửi khoảng 2-3 email/giờ bằng dịch vụ test có sẵn, và
**không cho sửa nội dung email** trừ khi bạn tự kết nối dịch vụ gửi email riêng (SMTP).
Vì vậy cần Brevo.

### 6.1 Lấy thông tin SMTP từ Brevo
1. Đăng nhập https://app.brevo.com
2. Vào **SMTP & API** (thường ở Settings → SMTP & API, hoặc tìm ở menu Senders,
   Domains & Dedicated IPs).
3. Tab **SMTP**: ghi lại:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: dạng `xxxxxxxxx@smtp-brevo.com`
4. Mục **SMTP Keys**: bấm **Generate a new SMTP key** nếu chưa có, đặt tên tuỳ ý →
   copy giá trị key (dạng `xsmtpsib-...`) — **chỉ hiện 1 lần**, lưu lại ngay.

### 6.2 Cấu hình SMTP trong Supabase
1. Supabase Dashboard → **Project Settings** → **Authentication** → kéo xuống mục
   **SMTP Settings**.
2. Bật **Enable Custom SMTP**.
3. Điền:
   - **Sender email**: email bạn dùng đăng ký Brevo (phải đã xác minh trong Brevo)
   - **Sender name**: tên hiển thị, vd `Logistics Dashboard`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Login lấy ở bước 6.1
   - **Password**: SMTP key lấy ở bước 6.1
4. **Save**.

### 6.3 Sửa email template để hiện mã 6 số (bắt buộc, nếu không sẽ chỉ gửi link)
Vào **Authentication → Emails** (hoặc **Email Templates**), sửa **2 template** sau
(cả 2 đều cần sửa vì Supabase dùng template khác nhau cho "đăng ký lần đầu" và
"đăng nhập lần sau"):

**Template "Confirm signup"** (dùng khi đăng ký tài khoản mới):
```html
<h2>Mã đăng nhập của bạn</h2>
<p>Nhập mã 6 số sau để đăng nhập:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Mã có hiệu lực trong ít phút.</p>
```

**Template "Magic Link"** (dùng khi đăng nhập lại lần sau):
```html
<h2>Mã đăng nhập của bạn</h2>
<p>Nhập mã 6 số sau để đăng nhập:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Mã có hiệu lực trong ít phút.</p>
```
→ **Save** cả 2.

### 6.4 Chỉnh độ dài mã OTP về 6 số
Vào **Authentication → Settings** (hoặc **Auth → Providers → Email**), tìm mục
**Email OTP Length** (hoặc tương tự) → đặt thành **6** (mặc định có thể là 8, sẽ lệch
với giao diện web chỉ có 6 ô nhập).

---

## 7. Khai báo URL cho Supabase biết web ở đâu

Supabase → **Authentication → URL Configuration**:
- **Site URL**: URL Vercel của bạn (vd `https://ten-app.vercel.app`)
- **Redirect URLs** → thêm các dòng:
  ```
  https://ten-app.vercel.app/**
  http://localhost:3000/**
  ```

> Nếu bỏ qua bước này, đăng nhập Google sẽ bị lỗi redirect, và verify OTP có thể
> không hoạt động đúng.

---

## 8. Đưa code lên GitHub

Mở PowerShell trong thư mục project:
```powershell
git init
git add .
git commit -m "Initial commit"
```

Tạo repo trên GitHub:
1. Vào https://github.com/new
2. Đặt tên repo (vd `logistics-dashboard`), chọn **Public** hoặc **Private** tuỳ ý,
   **không** tick "Add README" (vì code đã có sẵn) → **Create repository**.
3. GitHub sẽ hiện sẵn 2-3 dòng lệnh, copy đoạn có dạng:
   ```powershell
   git remote add origin https://github.com/<username>/logistics-dashboard.git
   git branch -M main
   git push -u origin main
   ```
   Dán vào PowerShell, Enter. Nếu được hỏi đăng nhập, đăng nhập bằng tài khoản GitHub
   của bạn qua trình duyệt hiện ra.

> File `.env.local` (chứa key Supabase) đã được cấu hình để **không** bị đẩy lên
> GitHub (xem file `.gitignore`) — đây là chủ đích, giữ key riêng tư.

---

## 9. Deploy lên Vercel

1. Vào https://vercel.com/new
2. Chọn **Import** ngay cạnh repo `logistics-dashboard` (Vercel tự thấy vì đã đăng
   nhập bằng GitHub).
3. Vercel tự nhận diện **Next.js**, không cần đổi Build Settings.
4. Mở rộng mục **Environment Variables**, thêm đúng 2 biến (copy y hệt trong
   `.env.local` ở máy bạn):
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (URL Supabase của bạn) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key của bạn) |
5. Bấm **Deploy**, đợi 1-2 phút.
6. Xong sẽ có link dạng `https://logistics-dashboard-xxxx.vercel.app`.

**Quay lại bước 5.1 và bước 7**: cập nhật URL Vercel thật vào Google Console
(Authorized JavaScript origins) và Supabase (Site URL, Redirect URLs) — vì lúc đầu có
thể bạn chưa có URL thật.

---

## 10. Kiểm tra hoạt động

1. Mở link Vercel → thấy trang **Đăng nhập / Đăng ký**.
2. Thử tab **Đăng ký**: điền Họ tên, Email, Vai trò → bấm **Tạo tài khoản**.
3. Kiểm tra hộp thư email (cả mục Spam) → sẽ có email chứa **mã 6 số**.
4. Nhập mã vào 6 ô trên web → bấm **Xác nhận** → vào được Dashboard.
5. Thử nút **Đăng nhập với Google** → chọn tài khoản Google → tự động vào Dashboard.
6. Kiểm tra dữ liệu đã lưu: Supabase → **Table Editor** → bảng `profiles` → thấy dòng
   mới với tên/email/vai trò vừa đăng ký.

---

## 11. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| "email rate limit exceeded" | Gửi lại quá nhanh (giới hạn chống spam) | Đợi vài giây rồi thử lại; hoặc vào Supabase → Auth → Rate Limits tăng giới hạn |
| Email chỉ có link, không có mã 6 số | Chưa sửa hết **cả 2** template (Confirm signup **và** Magic Link) | Làm lại bước 6.3, sửa đủ cả 2 |
| Nhập mã báo sai dù đúng | Độ dài OTP đang là 8 số nhưng web chỉ nhận 6 ô | Làm lại bước 6.4 |
| Google báo "redirect_uri_mismatch" | URL trong Google Console sai | Kiểm tra lại bước 5.1, phải đúng y hệt `https://<ref>.supabase.co/auth/v1/callback` |
| Đăng nhập xong bị đá về lại trang login | Site URL/Redirect URLs ở Supabase chưa khớp domain thật | Làm lại bước 7 |
| Bảng `profiles` trống sau khi đăng ký | Chưa chạy `schema.sql` | Làm lại bước 4.2 |
| Google báo "app chưa xác minh" | OAuth consent screen đang ở chế độ Testing | Vào Google Console → OAuth consent screen → Audience → Test users → thêm email đang test vào danh sách |

---

## 12. Trạng thái hiện tại của project này (đã setup thật, tham khảo)

- **GitHub**: repo đã tạo, code đã push.
- **Supabase**: project đã tạo, bảng `profiles` + trigger tự động lưu thông tin khi
  đăng ký đã chạy.
- **Brevo SMTP**: đã kết nối, email OTP gửi thật, độ dài mã đã chỉnh về 6 số.
- **Google OAuth**: đã bật, Client ID/Secret đã cấu hình.
- **Vercel**: đã deploy, biến môi trường đã set.

Nếu cần lấy lại các thông tin (Project URL, Client ID...) để cấu hình máy mới, vào lại
đúng dashboard tương ứng (Supabase Project Settings, Google Cloud Credentials, Vercel
Project Settings) — không lưu lại các key/secret dạng chữ ở bất kỳ đâu ngoài các
dashboard chính chủ đó.
