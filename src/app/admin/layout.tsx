import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <AdminHeader />
      <div className="flex flex-1 w-full mx-auto relative">
        <AdminSidebar />
        <div className="flex-1 w-full min-w-0 bg-[#F5F5F7]">
          {children}
        </div>
      </div>
    </div>
  );
}