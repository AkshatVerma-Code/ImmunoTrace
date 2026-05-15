import { redirect } from "next/navigation";
import { getSessionUserFromCookie } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getSessionUserFromCookie();
  if (!session) {
    redirect("/");
  }
  return <DashboardClient />;
}
