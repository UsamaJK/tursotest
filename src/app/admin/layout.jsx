import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import MobileSidebar from "@/components/admin/MobileSidebar";

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const user = { name: session.name, role: "Administrator" };

  // NOTE: no <html> or <body> here – only root layout should render them.
  return (
    <div className="min-h-dvh flex bg-[#F4F6FA]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar user={user} />
      </div>

      {/* Mobile top bar + sheet */}
      <div className="md:hidden w-full">
        <MobileSidebar user={user} />
        <div className="pt-14" /> {/* reserve space for mobile topbar */}
        <main className="px-3 pb-6">{children}</main>
      </div>

      {/* Desktop content */}
      <main className="hidden md:block flex-1">
        <div className="mx-auto max-w-[1400px] p-6">{children}</div>
      </main>
    </div>
  );
}
