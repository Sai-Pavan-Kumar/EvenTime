export type FieldStatus = "idle" | "success" | "warning";
import type { EventRow } from "@/types";

export interface CreateEventFormProps {
  initialData?: Partial<EventRow> & {
    college_branch?: string | null;
    college_year?: string | null;
    college_only?: boolean | null;
  };
  isEditing?: boolean;
}

export interface Duplicate {
  id: string;
  title: string;
  date_string: string;
}

export interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address: { city?: string; town?: string; village?: string; country?: string; state?: string; };
}