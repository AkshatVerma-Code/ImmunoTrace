"use client";

import dynamic from "next/dynamic";
import { DemoProvider } from "@/src/app/context/DemoContext";
import { Sidebar } from "@/src/app/components/Sidebar";
import { TraceBot } from "@/src/app/components/TraceBot";

const DietPlan = dynamic(
  () => import("@/src/app/pages/DietPlan").then((mod) => mod.DietPlan),
  { ssr: false }
);

export default function DietPlanClient() {
  return (
    <DemoProvider>
      <div className="relative min-h-screen bg-[#F4F7F6] font-sans overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#2EC4B6]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0F3D3E]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <Sidebar />
        <div className="relative z-10">
          <DietPlan />
        </div>
        <TraceBot />
      </div>
    </DemoProvider>
  );
}
