type ExtractedPrescription = {
  doctor_name?: string;
  diagnosis?: string;
  prescription_date?: string;
  medicines?: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>;
  raw_text?: string;
};

type ExtractedImageContext = {
  extracted_text?: string;
  medicine_related?: boolean;
  item_name?: string;
  short_summary?: string;
};

async function callMistralVisionJson(imageBase64: string, prompt: string) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured yet.");
  }

  const model = process.env.MISTRAL_OCR_MODEL || "pixtral-12b-latest";
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mistral request failed: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Mistral returned empty response.");
  }
  return JSON.parse(content);
}

export async function extractPrescriptionWithMistral(imageBase64: string): Promise<ExtractedPrescription> {
  const prompt = `Extract prescription details from this image and return strict JSON with keys:
doctor_name, diagnosis, prescription_date (YYYY-MM-DD if possible), medicines (array of {name,dosage,frequency,duration}), raw_text.
If unknown, keep empty strings or empty array.`;

  return callMistralVisionJson(imageBase64, prompt);
}

export async function extractImageHealthContextWithMistral(
  imageBase64: string
): Promise<ExtractedImageContext> {
  const prompt = `Analyze this health-related photo (medicine strip, bottle, lab image, report image, or medical note) and return strict JSON:
{
  "extracted_text": "string with readable text from image",
  "medicine_related": true/false,
  "item_name": "main item name if identifiable",
  "short_summary": "short explanation in plain language"
}
If uncertain, keep fields empty/false but return valid JSON.`;

  return callMistralVisionJson(imageBase64, prompt);
}
