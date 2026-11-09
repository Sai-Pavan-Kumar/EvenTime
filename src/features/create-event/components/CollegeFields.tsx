"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "@/components/icons";
import { toast } from "sonner";
import type { CollegeRow } from "@/types";
import { INDIAN_COLLEGE_BRANCHES } from "@/lib/constants/branches";
import { useCollegeSearch } from "@/features/create-event/hooks/useCollegeSearch";
import { COLLEGE_YEAR_OPTIONS } from "../constants";
import { FIELD_CLASS, FieldLabel, Select, Switch } from "./FormControls";

const ALL_BRANCHES = "All Branches";
const ALL_YEARS = "All Years";
const BRANCH_OPTIONS = [ALL_BRANCHES, ...INDIAN_COLLEGE_BRANCHES];
const BLUR_CLOSE_DELAY_MS = 150;

export function CollegeFields({ data, updateData, profileCollege }: any) {
  const [query, setQuery] = useState(data.collegeName || "");
  const [isListOpen, setIsListOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { collegesList, setCollegesList, isSearchingColleges } = useCollegeSearch(query);
  const trimmedQuery = query.trim();

  // The college can arrive from the profile after this field has mounted.
  useEffect(() => {
    if (data.collegeName && data.collegeName !== query) setQuery(data.collegeName);
  }, [data.collegeName, query]);

  const handleCreateCollege = async () => {
    if (trimmedQuery.length < 3) {
      toast.error("Please enter the full official college name (at least 3 characters).");
      return;
    }
    setIsCreating(true);
    const { createCollegeAction } = await import("@/app/profile/action");
    const result = await createCollegeAction(trimmedQuery);
    setIsCreating(false);
    if (result?.data) {
      updateData({ collegeId: result.data.id, collegeName: result.data.name });
      setQuery(result.data.name);
      setIsListOpen(false);
      setCollegesList((prev) => [...prev, result.data as CollegeRow]);
      toast.success(`Added "${result.data.name}" to directory!`);
    } else if (result?.error) {
      toast.error(result.error || "Failed to add college.");
    }
  };

  const isFromProfile = Boolean(profileCollege?.name && data.collegeName?.trim().toLowerCase() === profileCollege.name.trim().toLowerCase());

  return (
    <div className="space-y-5 rounded-md bg-slate-50 p-4 sm:p-5">
      <Switch
        checked={!data.collegeOnly}
        onChange={() => updateData({ collegeOnly: !data.collegeOnly })}
        label="Open to all colleges"
        hint="Turn off to keep this to one college."
      />

      <div className="relative z-30">
        <FieldLabel htmlFor="event-college-input" optional={!data.collegeOnly}>College or institute{isFromProfile && <span className="ml-1.5 font-normal text-slate-400">From your profile</span>}</FieldLabel>
        <div className="relative">
          <input
            id="event-college-input"
            type="text"
            value={query}
            maxLength={100}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setIsListOpen(true);
              updateData({ collegeId: null, collegeName: "" });
            }}
            onFocus={() => setIsListOpen(true)}
            onBlur={() => setTimeout(() => setIsListOpen(false), BLUR_CLOSE_DELAY_MS)}
            placeholder="Search CBIT, IIT, BITS..."
            className={`${FIELD_CLASS} pr-10`}
          />
          {isSearchingColleges && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-primary" />}
        </div>

        {isListOpen && trimmedQuery.length > 0 && (
          <div className="absolute inset-x-0 top-full mt-1.5 max-h-60 overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white p-1 shadow-xl" onPointerDown={(e) => e.preventDefault()}>
            {trimmedQuery.length === 1 && <p className="px-3 py-3 text-sm text-slate-500">Type one more letter to search.</p>}
            {isSearchingColleges && collegesList.length === 0 && trimmedQuery.length >= 2 && <p className="px-3 py-3 text-sm text-slate-500">Searching colleges...</p>}
            {collegesList.map((college) => (
              <button
                key={college.id}
                type="button"
                onClick={() => {
                  updateData({ collegeId: college.id, collegeName: college.name });
                  setQuery(college.name);
                  setIsListOpen(false);
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>{college.name}</span>
                {college.state && <span className="shrink-0 text-xs text-slate-400">{college.state}</span>}
              </button>
            ))}
            {!isSearchingColleges && trimmedQuery.length >= 2 && collegesList.length === 0 && (
              <div className="p-2">
                <p className="mb-2 text-[13px] leading-snug text-slate-500">Not in our directory yet. Use the full official name so other students can find it.</p>
                <button
                  type="button"
                  onClick={handleCreateCollege}
                  disabled={isCreating}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-slate-100 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-60"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreating ? "Adding..." : `Add "${trimmedQuery}"`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel optional>Branch</FieldLabel>
          <Select
            label="Branch"
            value={data.collegeBranch || ALL_BRANCHES}
            options={BRANCH_OPTIONS}
            onChange={(branch) => updateData({ collegeBranch: branch === ALL_BRANCHES ? "" : branch })}
          />
        </div>
        <div>
          <FieldLabel optional>Graduation year</FieldLabel>
          <Select
            label="Graduation year"
            value={data.collegeYear || ALL_YEARS}
            options={COLLEGE_YEAR_OPTIONS}
            onChange={(year) => updateData({ collegeYear: year === ALL_YEARS ? "" : year })}
          />
        </div>
      </div>
    </div>
  );
}
