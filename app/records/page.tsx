import { redirect } from "next/navigation";
import { getSessionUserFromCookie } from "@/lib/auth";
import RecordsClient from "./records-client";

export default async function RecordsPage() {
  const session = await getSessionUserFromCookie();
  if (!session) redirect("/");
  return <RecordsClient />;
}
