type UserProfile = {
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_group: string | null;
  allergies: string | null;
  health_score: number | null;
  location: string | null;
};

type PrescriptionSnapshot = {
  image_name: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
  ai_summary: string | null;
  prescription_date: string | null;
  treatment_start_date: string | null;
  treatment_end_date: string | null;
  is_active: boolean;
  recently_cured: boolean;
  created_at: string | null;
  medicines: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
};

type HealthInsights = {
  low_hemoglobin_trend: boolean;
  hemoglobin_values: number[];
  low_hemoglobin_values: number[];
  anemia_mentions: number;
  supporting_notes: string[];
};

export type DietPlan = {
  summary: string;
  daily_calories: number;
  hydration_liters: number;
  meals: Array<{
    name: string;
    time?: string;
    items: string[];
    notes?: string;
  }>;
  avoid: string[];
  tips: string[];
  kada_recipe: {
    name: string;
    purpose: string;
    ingredients: string[];
    preparation_steps: string[];
    when_to_take: string;
    cautions: string[];
  };
};

type GenerateDietPlanInput = {
  goal: string;
  preferences: string[];
  notes: string;
  userProfile: UserProfile;
  healthRecords: PrescriptionSnapshot[];
  healthInsights: HealthInsights;
};

type PrescriptionSummaryInput = {
  symptoms: string[];
  doctorAdvice: string;
  doctorName: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
};

type TraceProfileInput = {
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_group: string | null;
  allergies: string | null;
  location: string | null;
  health_score: number | null;
};

type GenerateAiHealthSummaryInput = {
  profile: TraceProfileInput;
  medicalRecordsSummary: string;
  quickPatternSummary: string;
};

type TraceConversationTurn = {
  role: "user" | "trace";
  text: string;
};

type GenerateTraceReplyInput = {
  message: string;
  profile: TraceProfileInput;
  medicalRecordsSummary: string;
  aiHealthSummary: string;
  quickPatternSummary: string;
  attachmentContext?: string;
  conversation: TraceConversationTurn[];
};

function parseJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini returned non-JSON output.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeSummaryText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•]+|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function generatePlainTextFromGemini(prompt: string, temperature = 0.3): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured yet.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("Gemini returned empty response.");
  }
  return normalizeSummaryText(text);
}

function normalizePlan(raw: any): DietPlan {
  const meals = Array.isArray(raw?.meals) ? raw.meals : [];
  const normalizedMeals = meals
    .map((meal: any) => ({
      name: String(meal?.name || "Meal"),
      time: meal?.time ? String(meal.time) : undefined,
      items: Array.isArray(meal?.items) ? meal.items.map((item: unknown) => String(item)) : [],
      notes: meal?.notes ? String(meal.notes) : undefined,
    }))
    .filter((meal: { items: string[] }) => meal.items.length > 0);

  const kadaRecipe = raw?.kada_recipe || {};

  return {
    summary: String(raw?.summary || "Personalized meal guidance based on your profile and records."),
    daily_calories: Number(raw?.daily_calories || 2000),
    hydration_liters: Number(raw?.hydration_liters || 2.5),
    meals:
      normalizedMeals.length > 0
        ? normalizedMeals
        : [{ name: "Balanced meals", items: ["Lean protein", "Whole grains", "Vegetables"] }],
    avoid: Array.isArray(raw?.avoid) ? raw.avoid.map((item: unknown) => String(item)) : [],
    tips: Array.isArray(raw?.tips) ? raw.tips.map((item: unknown) => String(item)) : [],
    kada_recipe: {
      name: String(kadaRecipe?.name || "Iron Support Kada"),
      purpose: String(kadaRecipe?.purpose || "Supports better nutrition and daily wellness."),
      ingredients: Array.isArray(kadaRecipe?.ingredients)
        ? kadaRecipe.ingredients.map((item: unknown) => String(item))
        : [],
      preparation_steps: Array.isArray(kadaRecipe?.preparation_steps)
        ? kadaRecipe.preparation_steps.map((item: unknown) => String(item))
        : [],
      when_to_take: String(kadaRecipe?.when_to_take || "Take once daily after breakfast."),
      cautions: Array.isArray(kadaRecipe?.cautions)
        ? kadaRecipe.cautions.map((item: unknown) => String(item))
        : [],
    },
  };
}

export async function generateDietPlanWithGemini(input: GenerateDietPlanInput): Promise<DietPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured yet.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const prompt = `
You are a nutrition planning assistant for an Indian health app. Build a practical, safe plan using COMPLETE user context.

Goal: ${input.goal}
Preferences: ${input.preferences.join(", ") || "None provided"}
Additional user notes: ${input.notes || "None provided"}
Profile context (age, height, weight, city, allergies, blood group, health score): ${JSON.stringify(input.userProfile)}
Active/recent health records context (old cured records already excluded): ${JSON.stringify(input.healthRecords)}
Derived health insights: ${JSON.stringify(input.healthInsights)}

Return strict JSON with this exact shape only:
{
  "summary": "string",
  "daily_calories": number,
  "hydration_liters": number,
  "meals": [
    {
      "name": "Breakfast|Lunch|Dinner|Snack",
      "time": "optional string",
      "items": ["item 1", "item 2"],
      "notes": "optional string"
    }
  ],
  "avoid": ["string"],
  "tips": ["string"],
  "kada_recipe": {
    "name": "string",
    "purpose": "string",
    "ingredients": ["string"],
    "preparation_steps": ["string"],
    "when_to_take": "string",
    "cautions": ["string"]
  }
}

Rules:
- Personalize for age, height, weight, city, allergies, record history and recent medicines.
- Do NOT refer to old cured prescriptions. Use only the provided active/recent context.
- If low hemoglobin trend is true in health insights, the kada recipe MUST be an Indian homemade iron-support recipe and the tips MUST include hemoglobin-improvement diet actions.
- If low hemoglobin trend is false, still provide an Indian homemade kada recipe suitable for the user profile.
- Keep diet practical for one day, with foods common in Indian homes.
- Avoid medical diagnosis/treatment claims and avoid contradicted advice with allergies/records.
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${text}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("\n");
  if (!rawText) {
    throw new Error("Gemini returned empty response.");
  }

  return normalizePlan(parseJsonObject(rawText));
}

export async function generatePrescriptionSummaryWithGemini(input: PrescriptionSummaryInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured yet.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  const prompt = `
Generate a concise, patient-friendly prescription summary based on:
- Symptoms: ${input.symptoms.join(", ") || "Not provided"}
- Doctor advice: ${input.doctorAdvice || "Not provided"}
- Doctor name: ${input.doctorName || "Not provided"}
- Diagnosis: ${input.diagnosis || "Not provided"}
- Medicines: ${JSON.stringify(input.medicines)}

Requirements:
- 4 to 7 short points.
- Mention what condition this prescription likely addresses.
- Mention when to take medicines and for how long.
- Include a clear completion reminder for the course duration.
- Keep language simple and actionable.
- Do not give new medical diagnosis claims.
- Output plain text only (no markdown, no bullets, no asterisks).
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini summary request failed: ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned empty summary.");
  }

  return normalizeSummaryText(text);
}

export async function generateAiHealthSummaryWithGemini(
  input: GenerateAiHealthSummaryInput
): Promise<string> {
  const prompt = `
You are Trace, an AI health pattern analyst for an Indian healthcare app.
Create a long-form "AI Health Summary" from the user's profile and records.

Profile:
${JSON.stringify(input.profile)}

Medical records summary:
${input.medicalRecordsSummary}

Quick pattern summary:
${input.quickPatternSummary}

Rules:
- Focus on recurring patterns, likely lifestyle/seasonal triggers, and prevention opportunities.
- Mention Indian lifestyle context (food timing, hydration, sleep, hygiene, local weather changes, household routines).
- Include practical Indian homemade kada recommendations where useful.
- Do NOT prescribe medicines, dosages, or treatment plans.
- If risk appears high, mention to consult a doctor.
- Output plain text only without markdown symbols.
`.trim();

  return generatePlainTextFromGemini(prompt, 0.25);
}

export async function generateTraceReplyWithGemini(
  input: GenerateTraceReplyInput
): Promise<string> {
  const conversationText = input.conversation
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? "User" : "Trace"}: ${turn.text}`)
    .join("\n");

  const prompt = `
You are Trace, a prevention-focused AI chatbot for an Indian health app.

Current user message:
${input.message}

Recent conversation:
${conversationText || "No prior conversation."}

User profile:
${JSON.stringify(input.profile)}

Medical records summary:
${input.medicalRecordsSummary}

AI health summary:
${input.aiHealthSummary}

Pattern hints:
${input.quickPatternSummary}

Uploaded file/photo context:
${input.attachmentContext || "No uploaded file context provided."}

Strict rules:
- Never recommend medicines, dosages, or drug substitutions.
- Never say "take paracetamol" or any medicine name as advice.
- Provide prevention-first guidance only: hydration, rest, home hygiene, diet, sleep, monitoring, escalation signs.
- If user asks about an uploaded medicine image, explain what that medicine appears to be used for based on attachment context, then compare with the user's record patterns.
- For medicine-image suitability checks:
  - If medicine does NOT align with user record patterns, clearly say it does not appear suitable for their usual record context and advise doctor consultation.
  - If medicine MAY align with user record patterns, say it may be relevant but must be taken only after consulting a doctor.
  - Never give direct permission to self-medicate.
- Include Indian lifestyle practicals and at least one suitable Indian homemade kada suggestion when relevant.
- Keep answer grounded in user history patterns if available.
- If symptoms are serious or red-flag (severe breathing trouble, chest pain, fainting, confusion, persistent high fever, bleeding, dehydration signs), immediately tell the user to consult a doctor/hospital and do not provide normal home-prevention steps.
- Keep the response concise (typically 5-10 lines).
- Do not repeat previous advice from earlier turns unless user explicitly asks to recap.
- Use plain, calm language.
- Format response in simple markdown:
  - Use short bold headers (for example: **Likely pattern**, **What to do now**, **Kada option**, **When to see doctor**).
  - Use bullet points under headers.
`.trim();

  return generatePlainTextFromGemini(prompt, 0.35);
}
