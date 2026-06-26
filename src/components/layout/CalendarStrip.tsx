"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { format,isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth,parseISO, differenceInCalendarDays} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NProgress from "nprogress";


export function CalendarStrip({ eventDates = [], onDateSelect }: { eventDates?: string[], onDateSelect?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDateParam = searchParams.get("date");
  
  // Hydration Fix: Stabilize 'today' so the client safely overrides the server timezone
  const [today, setToday] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    setToday(new Date());
  }, []);
  
  // Initialize view to the selected date's month, or current month
  const [currentMonth, setCurrentMonth] = useState(
    selectedDateParam && !isNaN(Date.parse(selectedDateParam)) ? parseISO(selectedDateParam) : today
  );

  const handleDateClick = (date: Date) => {
    NProgress.start();
    const standardDateStr = format(date, "yyyy-MM-dd");
    const queryDateStr = standardDateStr;

    const currentQ = searchParams.get("q");
    const currentBranch = searchParams.get("branch");

    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (currentBranch) params.set("branch", currentBranch);
    
    if (selectedDateParam === queryDateStr || selectedDateParam === standardDateStr) {
      // Deselect if clicked again (Goes back to default future events)
      window.history.pushState(null, "", `/?${params.toString()}`);
    } else {
      params.set("date", queryDateStr);
      window.history.pushState(null, "", `/?${params.toString()}`);
    }

    // Close calendar on selection automatically
    if (onDateSelect) {
      onDateSelect();
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div className="w-full bg-white px-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2 pt-2">
        <h2 className="text-lg font-heading font-black text-slate-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          
          // Match selected date carefully accommodating DB format strings
          const isSelected = selectedDateParam === dateStr;
             
          const isToday = isSameDay(date, today);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          
          // Robust check that parses the DB date to local time to prevent UTC offset duplicate dots
          const hasEvent = eventDates.some(ds => {
            if (!ds) return false;
            
            // Extract YYYY-MM-DD from the timestamp
            const dbDateOnly = ds.substring(0, 10);
            if (dbDateOnly === dateStr) return true;
            
            try {
              // Clean the string to handle rogue formats (e.g. "7th Jun")
              const cleanDs = ds.replace(/st|nd|rd|th/gi, ''); 
              
              // Standard Date parse
              const d = new Date(cleanDs);
              if (!isNaN(d.getTime()) && isSameDay(d, date)) return true;

              // Force-append current year for floating dates like "7 JUN"
              const currentYearDate = new Date(`${cleanDs} ${today.getFullYear()}`);
              if (!isNaN(currentYearDate.getTime()) && isSameDay(currentYearDate, date)) return true;

              return false;
            } catch {
              return false;
            }
          });

          return (
            <button
              key={dateStr}
              suppressHydrationWarning
              onClick={() => handleDateClick(date)}
              className={`
                relative flex flex-col items-center justify-center h-10 w-full rounded-xl text-sm transition-all
                ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                ${isSelected 
                  ? "bg-[#6C47FF] text-white shadow-md shadow-[#6C47FF]/30 font-bold scale-105 z-10" 
                  : "hover:bg-slate-100 font-medium"}
                ${isToday && !isSelected ? "border border-[#6C47FF]/30 text-[#6C47FF]" : "border border-transparent"}
              `}
            >
              {format(date, "d")}
              
              {/* Event Indicator Dot */}
              {hasEvent && (() => {
                // Hydration Matcher: Render the default amber dot during Server-Side Rendering
                // This perfectly matches your Next.js server cache so React doesn't crash.
                if (!isMounted) {
                  const ssrColor = isSelected ? "bg-white" : "bg-amber-500";
                  return <div className={`absolute bottom-1 w-1 h-1 rounded-full ${ssrColor}`} />;
                }

                const diff = differenceInCalendarDays(date, today);
                let dotColor = "bg-green-500";

                if (isSelected) {
                  dotColor = "bg-white";
                } else if (diff < 0) {
                  dotColor = "bg-black";
                } else if (diff >= 0 && diff <= 3) {
                  dotColor = "bg-orange-500";
                } else {
                  dotColor = "bg-green-500";
                }

                return (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${dotColor}`} />
                );
              })()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
