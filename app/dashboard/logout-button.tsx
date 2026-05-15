"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <button className="px-4 py-2 rounded-xl bg-[#0F3D3E] text-white font-semibold hover:bg-[#114748] transition-colors" onClick={logout} type="button">
      Log Out
    </button>
  );
}
