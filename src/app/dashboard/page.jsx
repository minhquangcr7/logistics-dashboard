import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Lấy profile đã lưu trong database (bảng profiles).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, role")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email;
  const role = profile?.role || "Người dùng";

  return <Dashboard displayName={displayName} role={role} email={user.email} />;
}
