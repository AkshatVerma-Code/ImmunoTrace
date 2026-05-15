import { redirect } from "next/navigation";
import { getSessionUserFromCookie } from "@/lib/auth";
import DietPlanClient from "./diet-plan-client";

export default async function DietPlanPage() {
  const session = await getSessionUserFromCookie();
  if (!session) {
    redirect("/");
  }
  return <DietPlanClient />;
}
