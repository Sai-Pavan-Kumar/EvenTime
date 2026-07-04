import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#F5F5F7]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}