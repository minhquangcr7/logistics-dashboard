import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Dashboard Chuyển đổi số Logistics — Case study Viettel Post",
  description:
    "Demo minh họa đồ án E-Logistics. Dữ liệu vận hành là giả lập; số liệu phân tích có trích nguồn công khai.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
