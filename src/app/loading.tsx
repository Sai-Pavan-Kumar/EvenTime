// File: src/app/loading.tsx
// Root loading fallback returns null to prevent flashing fake home page skeletons across routes.
// Navigation progress is cleanly handled by NextTopLoader in layout.tsx.
export default function Loading() {
  return null;
}