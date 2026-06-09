import { Navbar } from "@/components/layout/Navbar";
import { CreateEventForm } from "@/features/create-event/CreateEventForm";
export default function NewEventPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <Navbar />
      <div className="py-12 px-4 sm:px-6">
        <CreateEventForm />
      </div>
    </main>
  );
}