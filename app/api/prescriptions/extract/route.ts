import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromCookie } from "@/lib/auth";
import { extractPrescriptionWithMistral } from "@/lib/mistral";
import { generatePrescriptionSummaryWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
  const symptoms = Array.isArray(body?.symptoms)
    ? body.symptoms.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 30)
    : [];
  const doctorAdvice = typeof body?.doctorAdvice === "string" ? body.doctorAdvice.trim() : "";
  if (!imageBase64) {
    return NextResponse.json({ message: "Missing imageBase64" }, { status: 400 });
  }

  try {
    const extracted = await extractPrescriptionWithMistral(imageBase64);
    const medicines = Array.isArray(extracted?.medicines)
      ? extracted.medicines.map((med) => ({
          name: String(med?.name || "").trim(),
          dosage: med?.dosage ? String(med.dosage).trim() : undefined,
          frequency: med?.frequency ? String(med.frequency).trim() : undefined,
          duration: med?.duration ? String(med.duration).trim() : undefined,
        }))
      : [];

    const ai_summary = await generatePrescriptionSummaryWithGemini({
      symptoms,
      doctorAdvice,
      doctorName: String(extracted?.doctor_name || "").trim(),
      diagnosis: String(extracted?.diagnosis || "").trim(),
      medicines,
    });

    const enrichedExtracted = { ...extracted, ai_summary };
    return NextResponse.json({ extracted: enrichedExtracted });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Extraction failed" },
      { status: 500 }
    );
  }
}
