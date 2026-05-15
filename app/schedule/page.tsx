import { redirect } from "next/navigation";
import { getSessionUserFromCookie } from "@/lib/auth";
import ScheduleClient from "./schedule-client";

export default async function SchedulePage() {
  const session = await getSessionUserFromCookie();
  if (!session) {
    redirect("/");
  }
  return <ScheduleClient />;
}
