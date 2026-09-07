import { redirect } from "next/navigation";

export default function SavedPage() {
  redirect("/profile?tab=saved");
}
