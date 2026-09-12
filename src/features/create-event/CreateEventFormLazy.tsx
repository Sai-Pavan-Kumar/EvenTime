"use client";

import { CreateEventForm } from "./CreateEventForm";
import type { CreateEventFormProps } from "./types";

interface ExtendedFormProps extends CreateEventFormProps {
  isAdminFeatureEnabled?: boolean;
  isCurrentUserAdmin?: boolean;
}

export function CreateEventFormLazy(props: ExtendedFormProps) {
  return <CreateEventForm {...props} />;
}