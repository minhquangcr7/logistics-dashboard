# Project Context — Dashboard Chuyển đổi số Logistics (Viettel Post Case Study)

> File này tổng hợp **toàn bộ ngữ cảnh** của project để bất kỳ ai (kể cả AI khác) đọc
> vào là hiểu ngay project đang ở đâu, vì sao được xây như vậy, và cần làm gì tiếp.
> Đây là đồ án môn **E-Logistics**, case study Viettel Post.

---

## 1. Tổng quan nhanh

| | |
|---|---|
| **Loại project** | Dashboard web mô phỏng vận hành logistics — 1 SPA, 3 tab |
| **Đề tài** | Case study chuyển đổi số Viettel Post (không dùng logo/thương hiệu thật) |
| **Stack** | Next.js 15 (App Router) + React 19 + Supabase (auth+DB) + Leaflet (bản đồ) |
| **Live** | https://logistics-dashboard-pearl.vercel.app |
| **Repo** | https://github.com/minhquangcr7/logistics-dashboard |
| **Chủ tài khoản** | GitHub/Vercel/Supabase đều dưới tên `minhquangcr7` |

**Nguyên tắc xuyên suốt cả đồ án:** dữ liệu vận hành (đơn hàng, khách hàng, vị trí)
là **giả lập** — không có quyền truy cập hệ thống thật của Viettel Post. Nhưng mọi
thứ **có thể tra cứu công khai được thì dùng số thật**: khoảng cách giữa thành phố,
toạ độ hub, tuyến đường bộ (OSRM), địa chỉ tìm kiếm (Nominatim), thông số 1 hub thật
(TP.HCM), số liệu chuyển đổi số Viettel Post có trích nguồn. "AI" trong toàn bộ
project là **rule-based** (luật cố định dựa trên dữ liệu), không phải mô hình máy học
đã huấn luyện — ghi rõ điều này ở nhiều chỗ trên UI để không gây hiểu nhầm với giảng
viên.

---

## 2. Kiến trúc & luồng hoạt động

```
Người dùng
   │
   ▼
/login  ──(OTP email thật qua Brevo SMTP, hoặc Google OAuth)──▶  Supabase Auth
   │                                                                  │
   ▼                                                                  ▼
/dashboard (Next.js Server Component, kiểm tra session)      bảng `profiles`
   │                                                          (lưu tên/công ty/vai trò)
   ▼
Dashboard.jsx (client) — sinh dữ liệu đơn hàng giả lập, đồng hồ real-time,
                          tick mỗi 4s để mô phỏng vận hành
   │
   ├── Tab "Tổng quan"     → OverviewView.jsx
   ├── Tab "Đơn hàng"      → OrdersView.jsx
   └── Tab "Định tuyến AI" → RoutingView.jsx (gọi OSRM + Nominatim thật)
```

**Không có backend riêng ngoài Supabase.** Toàn bộ logic nghiệp vụ (sinh đơn, tính
deadline, AI alerts, định tuyến) chạy ở client (`src/lib/data.js`, `src/lib/routing.js`).
Supabase chỉ lo auth + lưu profile.

---

## 3. Cấu trúc thư mục

```
src/
  app/
    layout.jsx              Root layout, font Inter (next/font/google)
    page.jsx                Redirect: có session → /dashboard, chưa → /login
    login/page.jsx           Form đăng nhập/đăng ký + OTP 6 số + nút Google
    dashboard/page.jsx       Server component: check session, lấy profile, render <Dashboard>
    auth/callback/route.js   Nhận redirect từ Google OAuth, đổi code lấy session
    auth/signout/route.js    Đăng xuất
    globals.css              TOÀN BỘ CSS của site (~1200 dòng, không dùng Tailwind)

  components/
    Dashboard.jsx            Khung chính: sidebar, topbar, đồng hồ, tick 4s, chuyển tab
    icons.jsx                Bộ icon SVG line-art tự vẽ (KHÔNG dùng emoji, KHÔNG thư viện icon)
    StatusPill.jsx           Badge màu trạng thái đơn hàng
    LeafletMap.jsx           Bản đồ Leaflet dùng chung (3 chế độ: tổng quan / chọn điểm / kết quả tuyến)
    PlaceSearch.jsx          Thanh tìm kiếm địa điểm tự do (debounce + Nominatim)
    CapacityPanel.jsx        Panel "Quản lý nguồn lực": % lấp đầy hub + trạng thái đội xe
    AiDecisionCard.jsx       Panel "Cảnh báo & gợi ý điều phối" (3 nhóm rule-based)
    ForecastChart.jsx        Biểu đồ đường SVG tự vẽ: dự báo lưu lượng 7 ngày
    views/
      OverviewView.jsx       Tab Tổng quan: KPI, Capacity, Forecast, AI alerts, bảng đơn, bản đồ
      OrdersView.jsx         Tab Đơn hàng: filter/search/sort, SLA, xử lý đơn trễ, xuất CSV
      RoutingView.jsx        Tab Định tuyến AI: tìm điểm, gọi OSRM, so sánh 2 tuyến

  lib/
    data.js                  "Nguồn sự thật" — mock data generator, mọi hàm tính toán nghiệp vụ
    geo.js                   Gọi Nominatim (tìm địa điểm) + OSRM (tuyến đường bộ thật), có fallback
    routing.js               Ghép data.js + geo.js thành 1 hàm async planRoute() cho RoutingView
    exportCsv.js              Xuất bảng đơn hàng ra file CSV (Excel mở được, UTF-8 BOM)
    supabase/
      client.js               Supabase client phía browser
      server.js                Supabase client phía server (Server Component)
      middleware.js            Refresh session + chặn truy cập /dashboard khi chưa đăng nhập

  middleware.js               Next.js middleware, gọi supabase/middleware.js

supabase/
  schema.sql                 SQL setup: bảng `profiles` + trigger tự tạo profile khi có user mới
  migrations/                 Bản sao schema.sql dạng migration (dùng khi `supabase db push`)
```

---

## 4. Tính năng theo từng tab

### 4.1 Đăng nhập / Đăng ký (`/login`)
- Form: Họ tên, Công ty, Email, Vai trò (Nhân viên vận hành / Quản lý / Admin).
- **OTP 6 số THẬT** gửi qua email (Supabase Auth + SMTP Brevo) — không phải mô phỏng.
  Có đếm ngược 30s trước khi cho gửi lại.
- **Đăng nhập Google THẬT** (OAuth qua Supabase), không có nút Microsoft (bỏ theo
  yêu cầu, spec gốc có nhưng người dùng chỉ cần Google).
- Sau khi xác thực → tạo `profiles` row (qua Postgres trigger) → vào dashboard.

### 4.2 Tab Tổng quan
- **KPI**: tổng đơn, đang vận chuyển, trễ hạn, tỷ lệ giao đúng hạn.
- **Quản lý nguồn lực** (`CapacityPanel`): % lấp đầy từng hub (so với ngưỡng
  `demoCapacity` minh hoạ, KHÁC với `dailyCapacity` là số thật/ngày hiển thị riêng
  trong popup hub) + trạng thái đội xe (24 xe mô phỏng, đang chạy/đang rảnh suy ra
  từ số đơn đang active).
- **Dự báo lưu lượng 7 ngày** (`ForecastChart`): biểu đồ đường SVG tự vẽ, có xu
  hướng tăng nhẹ + hệ số theo ngày trong tuần (cuối tuần thấp hơn), KHÔNG phải
  ML thật.
- **Cảnh báo & gợi ý điều phối** (`AiDecisionCard`): 3 nhóm rule-based cố định —
  - **Cân bằng tải hub** (⚖️→icon Scale): hub vượt >20% mức TB → cảnh báo, >30% → mức Cao.
  - **Cảnh báo trễ hàng** (🔔→icon Bell): tuyến có ≥2 đơn trễ, ≥3 → mức Cao.
  - **Tối ưu tuyến** (🧭→icon Compass): luôn có 1 gợi ý cải thiện ngẫu nhiên, mức Thấp.
  - Mỗi card có nhãn ưu tiên Cao/Trung bình/Thấp, nút hành động mô phỏng (không lưu
    lại sau reload).
- **Bảng đơn gần đây** + **Bản đồ tuyến vận chuyển** (Leaflet):
  - Nền dark tile (CartoDB Dark Matter qua CDN, KHÔNG cần API key).
  - Mỗi **tuyến** (cặp hub) có **1 màu cố định** (nét đứt mảnh) — KHÔNG dùng độ rộng
    theo lưu lượng nữa (đã đổi vì gây rối mắt khi nhiều tuyến chồng nhau).
  - **Chấm động** (3-4 cái) di chuyển dọc tuyến, màu theo **loại hàng** (tách biệt
    hoàn toàn với màu đường — 2 lớp thông tin khác nhau).
  - Click hub → popup thông số kỹ thuật (diện tích, cổng chia, công suất/ngày, có
    ghi "(số liệu thật)" cho TP.HCM) + % lấp đầy.

### 4.3 Tab Đơn hàng
- Bộ lọc trạng thái (pill) + ô tìm kiếm (mã đơn/tên khách, cộng dồn với filter).
- Bảng sắp xếp được theo mọi cột (click tiêu đề, click lần 2 đảo chiều).
- Cột **Cam kết giao**: mốc giờ tính CÓ CĂN CỨ = `createdAt + khoảng_cách/tốc_độ +
  số_điểm_trung_chuyển × 1h` (không random). Có đếm ngược 3 mức (bình thường / sắp
  tới hạn <6h / đã quá hạn), dùng icon cảnh báo phù hợp.
- Trạng thái **"Trễ hạn" tự động và luôn nhất quán** với cột Cam kết giao — mỗi tick
  4 giây hệ thống tự kiểm tra đơn nào đã quá deadline mà chưa giao thì chuyển sang
  trễ (không còn random dice như bản đầu).
- Click dòng đơn trễ → mở rộng xem lý do trễ + ETA giao lại.
- **Thống kê nguyên nhân trễ hạn**: bar chart nhỏ theo `delayCategory` (5 nhóm cố định).
- Cột **Loại**: icon loại hàng CỐ ĐỊNH theo `cargoType` (fast/ecommerce/cod), gán 1
  lần lúc tạo đơn, KHÔNG đổi theo trạng thái (khác bản đầu dùng icon theo giai đoạn
  vận chuyển — đã sửa vì không có giá trị phân biệt).
- Cột **Xử lý** (chỉ với đơn trễ): 3 nút mô phỏng — Đổi shipper / Gọi lại khách /
  Ưu tiên giao. Chỉ lưu tại chỗ (state React), mất khi tải lại trang, đúng tinh
  thần demo.
- **Nút "Xuất báo cáo (Excel)"**: xuất đúng danh sách đang lọc ra file `.csv` thật
  (không phải mô phỏng), UTF-8 BOM để Excel đọc đúng dấu tiếng Việt.
- **Cơ chế thay mới đơn**: mỗi khi 1 đơn chuyển "Đã giao", tự động thêm 1 đơn mới
  "Đã tiếp nhận" + xoá đơn đã giao lâu nhất — giữ tổng luôn ~15 đơn, tránh danh
  sách hội tụ dần về toàn "Đã giao".

### 4.4 Tab Định tuyến AI
- **Không còn giới hạn 5 hub** — 2 thanh tìm kiếm địa điểm tự do (`PlaceSearch`,
  gọi Nominatim/OpenStreetMap thật, debounce 400ms), hoặc bấm nhanh 1 hub trên bản
  đồ làm lối tắt.
- Bấm "Tìm tuyến tối ưu" → `planRoute()` (async):
  1. Tìm hub gần nhất cho mỗi đầu (`nearestHub`).
  2. Dựng chuỗi hub trung gian (tái dùng `ROUTE_TEMPLATES`), điều chỉnh theo loại
     hàng (hàng dễ vỡ giảm 1 điểm trung chuyển, hàng giá trị cao ưu tiên hub
     "an ninh cao").
  3. Gọi **OSRM thật** (router.project-osrm.org) cho từng chặng, chạy song song
     (`Promise.all`), **fallback đường thẳng có hệ số đường vòng** nếu OSRM lỗi/timeout
     6s — không bao giờ trắng màn hình.
  4. Trả về km/giờ/toạ độ THẬT, chi phí ước tính (VNĐ), timeline theo giờ thật.
- Kết quả: 2 thẻ so sánh (Truyền thống vs AI) + timeline dạng dòng thời gian + bản
  đồ vẽ 2 tuyến chồng lên nhau theo hình học đường bộ thật.
- Có banner cảnh báo nếu phải dùng fallback (mất kết nối OSRM).

---

## 5. Mô hình dữ liệu (đơn hàng) — `src/lib/data.js`

```js
{
  id: "VTP-xxxxxx",
  customer: "Tên khách hàng",          // giả lập
  route: "Thành phố A → Thành phố B",  // giả lập
  status: "received|pickup|transit|delivering|done|late",
  location: "Mô tả vị trí",             // giả lập
  updated: "HH:MM:SS",
  createdAt: <epoch ms>,                // random lùi 1-48h trước khi mở trang
  deadline: <epoch ms>,                  // TÍNH từ createdAt + công thức, KHÔNG random
  doneAt: <epoch ms> | null,             // dùng để tìm đơn "đã giao lâu nhất" khi replenish
  cargoType: "fast|ecommerce|cod",       // cố định lúc tạo đơn
  delayReason, delayCategory, delayEta,  // chỉ có giá trị khi status = late
}
```

- **`generateOrders()`**: tạo 15 đơn, retry cả lô (tối đa 300 lần) đến khi số đơn
  trễ hạn ban đầu rơi vào khoảng 4-6 — vẫn luôn rút `createdAt` ngẫu nhiên thật sự
  trong 1-48h, không nắn phân phối.
- **`advanceOneOrder()`**: chạy mỗi 4s — (1) tự động chuyển "late" cho đơn quá hạn,
  (2) 60% cơ hội tiến 1 đơn ngẫu nhiên sang trạng thái kế, (3) nếu vừa "Đã giao" →
  gọi `replenish()`.
- **5 HUB** (`HUBS`): toạ độ thật + thông số kỹ thuật. TP.HCM dùng số liệu THẬT đã
  research (tổ hợp chia chọn miền Nam — 20.000m², 1000 cổng chia, 2 triệu bưu
  phẩm/ngày, robot 2m/s). 4 hub còn lại là quy mô khu vực giả lập hợp lý.
- **`AI_ALERT_GROUPS` / `generateAiAlerts()`**: logic 3 nhóm cảnh báo đã mô tả ở mục 4.2.
- **`computeHubCapacity()` / `computeFleetStatus()` / `generateForecast()`**: các
  hàm phục vụ Capacity Panel + Forecast Chart.

---

## 6. Dịch vụ ngoài đang dùng (đều miễn phí)

| Dịch vụ | Vai trò | Cần API key? |
|---|---|---|
| **Supabase** | Auth (OTP email + Google OAuth) + Postgres (bảng `profiles`) | Có (anon key, public-safe) |
| **Brevo** | SMTP gửi email OTP thật (300 email/ngày free) | Có (SMTP key, ĐÃ cấu hình trong Supabase, không nằm trong code) |
| **Google Cloud Console** | OAuth Client cho "Đăng nhập với Google" | Có (Client ID/Secret, ĐÃ cấu hình trong Supabase) |
| **Nominatim (OpenStreetMap)** | Tìm kiếm địa điểm tự do | Không |
| **OSRM demo server** | Tính tuyến đường bộ thật | Không |
| **CartoDB Dark Matter tiles** | Nền bản đồ tối màu | Không |
| **Vercel** | Hosting + deploy | Không (chỉ cần tài khoản) |

### Supabase — thông tin project
- Project ref: `enxegfgnnefyitpukxex` (org "minhquangcr7's Org", region Singapore).
- Đã cấu hình: SMTP Brevo (sender `minhquang141997@gmail.com`), Google OAuth
  provider, độ dài OTP = 6 số, `Site URL` + redirect URLs trỏ về domain Vercel.
- Bảng `profiles` + trigger `handle_new_user` tạo tự động khi có user mới trong
  `auth.users` (xem `supabase/schema.sql`).

### Deploy
- Deploy **thủ công qua Vercel CLI** (`vercel deploy --prod`), KHÔNG tự động deploy
  khi push GitHub — lúc setup ban đầu, việc kết nối GitHub App của Vercel với repo
  bị lỗi, nên mọi lần đổi code cần deploy tay 1 lệnh nữa sau khi push.
- Biến môi trường trên Vercel: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (2 biến này an toàn public, dùng ở client).

---

## 7. Chạy project ở máy khác

```bash
git clone https://github.com/minhquangcr7/logistics-dashboard.git
cd logistics-dashboard
npm install
cp .env.local.example .env.local   # rồi điền NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
npm run dev
```

Xem hướng dẫn setup Supabase/Vercel/Google/Brevo từ đầu chi tiết từng bước trong
file **`HUONG-DAN-TOAN-TAP.md`** hoặc **`HUONG-DAN-TOAN-TAP.html`** (cùng thư mục) —
viết cho người chưa biết gì về lập trình.

---

## 8. Lịch sử quyết định quan trọng (để hiểu "vì sao lại làm vậy")

1. **OTP + Google là thật, không mô phỏng** — dù đặc tả gốc đề xuất "Phương án A
   (mô phỏng)" cho dễ, người dùng chọn làm thật vì Supabase free tier đủ khả năng.
2. **Bỏ nút Microsoft** — chỉ cần Google, đỡ phải đăng ký Azure AD.
3. **Bỏ tab Báo cáo và khối So sánh trước/sau khỏi web** (v2, v3 của đặc tả) —
   người dùng tự làm phần báo cáo/đánh giá ở tài liệu Word/PowerPoint riêng.
4. **Bản đồ nâng cấp 2 lần**: SVG trừu tượng → Leaflet với line-width theo lưu
   lượng → Leaflet với màu cố định theo tuyến (line-width gây chồng lấn khó phân
   biệt tuyến, theo phản hồi thực tế lúc dùng thử).
5. **Cột "Loại" đổi ý nghĩa**: ban đầu là icon theo giai đoạn vận chuyển (hầu hết
   đơn cùng icon khi đã giao/trễ → vô nghĩa) → đổi thành loại hàng cố định.
6. **Deadline đổi từ random sang có công thức** — random không trả lời được "vì sao
   lại là mốc đó", nên đổi sang tính từ khoảng cách + tốc độ + phụ trội trung
   chuyển, và status "Trễ hạn" bắt buộc nhất quán với deadline.
7. **Định tuyến AI đổi từ 5 hub cố định sang tìm kiếm tự do + OSRM thật** — người
   dùng muốn "giống Google Maps hơn", chấp nhận đánh đổi phụ thuộc mạng/API công
   khai (có fallback đường thẳng khi lỗi).
8. **Bỏ toàn bộ emoji, thay bằng bộ icon SVG tự vẽ** (`icons.jsx`) + đổi giọng văn
   bớt "kiểu AI" (bỏ "AI Decision Support", "🤖 Đề xuất:"...) + thêm font Inter —
   theo phản hồi giao diện "nhìn chưa sang".
9. **Bổ sung 3 tính năng theo góp ý phản biện đồ án**: Quản lý nguồn lực
   (Capacity & Fleet), Dự báo lưu lượng 7 ngày, Xuất báo cáo Excel — để thể hiện tư
   duy quản trị vận hành toàn diện, không chỉ theo dõi luồng hàng.

---

## 9. Vấn đề đã biết / cần lưu ý khi tiếp tục

- **Deploy không tự động theo git push** — nhớ chạy `vercel deploy --prod` sau mỗi
  lần push code muốn lên live.
- **OSRM demo server công khai** (router.project-osrm.org) — miễn phí nhưng không
  có SLA, nếu quá tải có thể chậm/lỗi (đã có fallback, không vỡ trang nhưng UX kém
  hơn). Nếu cần ổn định hơn cho buổi thuyết trình, cân nhắc tự host OSRM hoặc dùng
  dịch vụ trả phí.
- **Nominatim có giới hạn tốc độ** (~1 request/giây) — đã debounce 400ms ở
  `PlaceSearch`, đủ dùng cho demo nhưng đừng test gõ quá nhanh liên tục.
- **Nhiều người từng thao tác chung 1 phiên** trong lúc build project (nhầm lẫn
  tài khoản GitHub/Vercel giữa vài người) — hiện tại mọi thứ đã ổn định dưới tên
  `minhquangcr7`, nhưng nếu clone máy khác cần `gh auth login` + `vercel login`
  đúng tài khoản đó (hoặc tài khoản có quyền collaborator) mới push/deploy được.
- **`.env.local` không commit lên Git** (đã gitignore) — máy mới phải tự điền lại
  từ Supabase Dashboard → Project Settings → API.

---

## 10. Việc còn có thể làm tiếp (nếu muốn mở rộng thêm)

- Test responsive mobile kỹ hơn (đã có CSS mobile breakpoint nhưng chưa test sâu
  trên thiết bị thật).
- Cân nhắc host OSRM riêng nếu lo ngại demo server công khai chậm lúc bảo vệ đồ án.
- Viết phần Báo cáo/đánh giá (Word/PPT) dùng số liệu thật đã research sẵn trong
  lịch sử hội thoại (doanh thu, quy mô mạng lưới, hiệu quả tự động hoá... của
  Viettel Post, đều có trích nguồn).
