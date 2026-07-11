import "./globals.css";

export const metadata = {
  title: "Dashboard Chuyển đổi số Logistics — Case study Viettel Post",
  description:
    "Demo minh họa đồ án E-Logistics. Dữ liệu vận hành là giả lập; số liệu phân tích có trích nguồn công khai.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
