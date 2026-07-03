import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1600px] w-full mx-auto relative">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}