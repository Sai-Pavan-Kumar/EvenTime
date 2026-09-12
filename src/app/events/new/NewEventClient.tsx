"use client";

import { useAuth } from "@/context/AuthContext";
import { CreateEventForm } from "@/features/create-event/CreateEventForm";

interface NewEventClientProps {
  featuredEnabled: boolean;
}

export function NewEventClient({ featuredEnabled }: NewEventClientProps) {
  const { isAdmin } = useAuth();

  return (
    <CreateEventForm
      isAdminFeatureEnabled={featuredEnabled}
      isCurrentUserAdmin={isAdmin}
    />
  );
}
