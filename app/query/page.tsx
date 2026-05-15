import { redirect } from "next/navigation";
import { getSessionUserFromCookie } from "@/lib/auth";
import QueryClient from "./query-client";

export default async function QueryPage() {
  const session = await getSessionUserFromCookie();
  if (!session) {
    redirect("/");
  }
  return <QueryClient />;
}
