"use client";

import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { ampms, hours, mins } from "../constants";
import { MiniCalendar } from "./SharedUI";
import { FieldLabel, RequiredMark, Segmented, Select, Switch } from "./FormControls";

const AMPM_OPTIONS = ampms.map((value) => ({ value, label: value }));
const DATE_LABEL_FORMAT = "EEE, d MMM";

function TimeRow({ label, hour, minute, ampm, onChange, emptyHour }: { label: string; hour: string; minute: string; ampm: string; onChange: (time: { hour: string; minute: string; ampm: string }) => void; emptyHour?: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_6.5rem] gap-2">
      <Select
        label={`${label} hour`}
        placeholder="Hour"
        value={hour}
        options={hours}
        emptyLabel={emptyHour}
        // A time saves only with both parts, so picking an hour must never leave the minutes blank.
        onChange={(next) => onChange({ hour: next, minute: next ? minute || "00" : "", ampm })}
      />
      <Select label={`${label} minutes`} placeholder="Min" value={minute} options={mins} onChange={(next) => onChange({ hour, minute: next, ampm })} />
      <Segmented label={`${label} AM or PM`} value={ampm} options={AMPM_OPTIONS} onChange={(next) => onChange({ hour, minute, ampm: next })} />
    </div>
  );
}

function DateTab({ label, value, isActive, onClick }: { label: ReactNode; value: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={`min-h-14 w-full rounded-md border px-3 py-2 text-left transition-colors ${isActive ? "border-brand-primary bg-brand-primary/5" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="block truncate text-sm font-semibold text-slate-900">{value}</span>
    </button>
  );
}

export function WhenSection({ data, updateData }: any) {
  const [editing, setEditing] = useState<"start" | "end">("start");
  const isEditingEnd = editing === "end" && data.hasEndDate;

  const pickDate = (date: Date) => {
    if (isEditingEnd) {
      updateData({ endDate: date });
      return;
    }
    // An end date before the new start would publish an event that finishes before it begins.
    const endIsStale = data.endDate && data.endDate < date;
    updateData({ selectedDate: date, ...(endIsStale ? { endDate: undefined } : {}) });
  };

  const removeEndDate = () => {
    updateData({ hasEndDate: false, endDate: undefined });
    setEditing("start");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      <div id="event-date-section" className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <DateTab
            label={<>Starts<RequiredMark /></>}
            value={data.selectedDate ? format(data.selectedDate, DATE_LABEL_FORMAT) : "Pick a date"}
            isActive={!isEditingEnd}
            onClick={() => setEditing("start")}
          />
          {data.hasEndDate ? (
            <div className="relative">
              <DateTab label="Ends" value={data.endDate ? format(data.endDate, DATE_LABEL_FORMAT) : "Pick a date"} isActive={isEditingEnd} onClick={() => setEditing("end")} />
              <button type="button" aria-label="Remove end date" onClick={removeEndDate} className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                updateData({ hasEndDate: true });
                setEditing("end");
              }}
              className="flex min-h-14 items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" /> End date
            </button>
          )}
        </div>
        <MiniCalendar
          selectedDate={isEditingEnd ? data.endDate : data.selectedDate}
          onSelect={pickDate}
          minDate={isEditingEnd ? data.selectedDate : undefined}
        />
      </div>

      <div className="space-y-6">
        <div>
          <FieldLabel optional>Start time</FieldLabel>
          <TimeRow
            label="Start time"
            hour={data.selectedHour}
            minute={data.selectedMin}
            ampm={data.selectedAmPm}
            emptyHour="No set time"
            onChange={({ hour, minute, ampm }) => updateData({ selectedHour: hour, selectedMin: minute, selectedAmPm: ampm })}
          />
        </div>
        <div className="space-y-3">
          <Switch checked={data.hasEndTime} onChange={() => updateData({ hasEndTime: !data.hasEndTime })} label="Add an end time" />
          {data.hasEndTime && (
            <TimeRow
              label="End time"
              hour={data.endHour}
              minute={data.endMin}
              ampm={data.endAmPm}
              onChange={({ hour, minute, ampm }) => updateData({ endHour: hour, endMin: minute, endAmPm: ampm })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
