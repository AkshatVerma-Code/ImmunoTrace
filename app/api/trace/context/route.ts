import { NextResponse } from "next/server";
import { getSessionUserFromCookie } from "@/lib/auth";
import { buildTraceContextForUser } from "@/lib/health-context";
import { generateAiHealthSummaryWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const context = await buildTraceContextForUser(session.id);
    const aiHealthSummary = await generateAiHealthSummaryWithGemini({
      profile: context.profile,
      medicalRecordsSummary: context.medical_records_summary,
      quickPatternSummary: context.quick_pattern_summary,
    });

    return NextResponse.json({
      profile: context.profile,
      records_count: context.records.length,
      medical_records_summary: context.medical_records_summary,
      quick_pattern_summary: context.quick_pattern_summary,
      ai_health_summary: aiHealthSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to generate health context." },
      { status: 500 }
    );
  }
}
