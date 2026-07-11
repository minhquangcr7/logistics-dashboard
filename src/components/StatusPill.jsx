import { STATUS_META } from "@/lib/data";

export default function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, color: "blue" };
  return <span className={`pill pill-${meta.color}`}>{meta.label}</span>;
}
