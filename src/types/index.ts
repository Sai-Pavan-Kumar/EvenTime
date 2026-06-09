import type { Database } from './database';

// Helper aliases for your database rows
export type EventRow = Database['public']['Tables']['events']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ReportRow = Database['public']['Tables']['event_reports']['Row'];
export type SavedEventRow = Database['public']['Tables']['saved_events']['Row'];
export type CollegeRow = Database['public']['Tables']['colleges']['Row'];

// For Auth User
import { User } from '@supabase/supabase-js';
export type AuthUser = User;