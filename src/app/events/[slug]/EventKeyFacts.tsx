import { CalendarDays, Clock, MapPin, Ticket } from "@/components/icons";

// When, where and how much decide whether someone reads further, so they sit right under the title.
export function EventKeyFacts({ date, time, place, price }: { date: string; time: string; place?: string | null; price: string }) {
  const facts = [
    { icon: CalendarDays, value: date },
    { icon: Clock, value: time },
    { icon: MapPin, value: place },
    { icon: Ticket, value: price },
  ].filter((fact) => fact.value);

  return (
    <ul className="flex flex-wrap gap-2">
      {facts.map(({ icon: Icon, value }) => (
        <li key={value} className="flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-800">
          <Icon className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
          {value}
        </li>
      ))}
    </ul>
  );
}
