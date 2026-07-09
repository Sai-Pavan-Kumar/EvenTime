"use client";

import dynamic from "next/dynamic";
import type { CreateEventFormProps } from "./types";

const CreateEventForm = dynamic(
  () => import("./CreateEventForm").then((mod) => mod.CreateEventForm),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-2xl mx-auto animate-pulse space-y-6">
        <div className="h-8 w-1/3 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-[32px]" />
      </div>
    ),
  }
);

interface ExtendedFormProps extends CreateEventFormProps {
  isAdminFeatureEnabled?: boolean;
  isCurrentUserAdmin?: boolean;
}

export function CreateEventFormLazy(props: ExtendedFormProps) {
  return <CreateEventForm {...props} />;
}