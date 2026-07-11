import { SOURCES } from "@/lib/data";

export default function ReportView() {
  return (
    <div className="view">
      <article className="report">
        <section className="report-block">
          <h3>1. Thực trạng chuyển đổi số tại Viettel Post</h3>
          <p>
            Viettel Post đang chuyển dịch mạnh từ mô hình chuyển phát truyền thống
            sang doanh nghiệp logistics công nghệ. Doanh thu hợp nhất năm 2024 đạt
            <strong> 20.826 tỷ đồng</strong> (vượt 57,9% kế hoạch, tăng 5,6% so với
            2023), trong đó lĩnh vực chuyển phát tăng trưởng 45%. Mạng lưới hiện có
            hơn <strong>1.300 bưu cục</strong> và hơn 6.000 điểm giao dịch trên cả
            nước.
          </p>
          <p className="src-inline">
            Nguồn: <a href={SOURCES["9.1"]} target="_blank" rel="noreferrer">ictvietnam.vn</a>
          </p>
        </section>

        <section className="report-block">
          <h3>2. Đánh giá hiệu quả từng công nghệ (liên hệ với demo)</h3>
          <ul>
            <li>
              <strong>Tự động hóa &amp; robot AGV (tab Đơn hàng/Tracking):</strong>{" "}
              tổ hợp chia chọn thông minh miền Nam rộng ~20.000m², hơn 1.000 cổng
              chia, năng suất 2 triệu bưu phẩm/ngày (mở rộng tới 4 triệu), thời
              gian khai thác rút còn <strong>7-8 tiếng/lô</strong>; robot phân loại
              tốc độ 2m/s giúp giảm <strong>40% chi phí</strong> so với thủ công.
            </li>
            <li>
              <strong>Nền tảng điều phối tự động (tab Định tuyến AI):</strong> giải
              pháp logistics toàn trình giúp tiết kiệm đến <strong>30% chi phí</strong>{" "}
              và rút ngắn <strong>40% thời gian</strong> toàn trình so với cách tổ
              chức truyền thống.
            </li>
            <li>
              <strong>App logistics tích hợp AI:</strong> ghi nhớ thông tin đơn,
              phân tích nội dung sản phẩm, quản lý &amp; theo dõi giao hàng, tính
              cước — nền tảng cho trải nghiệm tracking như minh họa trong demo này.
            </li>
          </ul>
          <p className="src-inline">
            Nguồn: <a href={SOURCES["9.2"]} target="_blank" rel="noreferrer">rtc.edu.vn</a>
            {" · "}
            <a href={SOURCES["9.3"]} target="_blank" rel="noreferrer">viettelfamily.com</a>
          </p>
        </section>

        <section className="report-block">
          <h3>3. Hạn chế của mô hình hiện tại</h3>
          <ul>
            <li>Dữ liệu vận hành trong demo là <strong>giả lập</strong>, chưa kết nối hệ thống thật.</li>
            <li>Chưa có GPS thật; vị trí đơn hàng là mô tả mô phỏng.</li>
            <li>Chưa xử lý các ngoại lệ thực tế: thời tiết, tắc đường, hoàn hàng, sự cố kho.</li>
            <li>Cơ chế &quot;AI routing&quot; là mô hình minh họa theo logic, chưa phải thuật toán tối ưu đã huấn luyện.</li>
          </ul>
        </section>

        <section className="report-block">
          <h3>4. Đề xuất cải tiến</h3>
          <ul>
            <li>Tích hợp GPS/telematics thật để định vị phương tiện theo thời gian thực.</li>
            <li>Áp dụng thuật toán tối ưu tuyến (VRP) có tính đến giao thông và khung giờ giao.</li>
            <li>Bổ sung cảnh báo sớm đơn trễ hạn dựa trên dữ liệu lịch sử.</li>
            <li>Kết nối API bản đồ để tính quãng đường/thời gian chính xác thay cho bảng tra cứu tĩnh.</li>
          </ul>
        </section>

        <p className="footnote">
          Phần Báo cáo sử dụng số liệu thật do Viettel Post công bố, có trích nguồn
          để kiểm chứng. Phần demo tương tác (Tổng quan, Đơn hàng, Định tuyến) dùng
          dữ liệu giả lập vì không có quyền truy cập hệ thống vận hành nội bộ.
        </p>
      </article>
    </div>
  );
}
