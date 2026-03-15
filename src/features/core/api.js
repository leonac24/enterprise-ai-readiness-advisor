import { SYSTEM_PROMPT } from "../config/constants";

// Centralized Gemini call used by both single and compare assessment flows.
export async function callGemini(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  // The prompt enforces JSON-only output, so we parse directly.
  const data = await response.json();
  const raw = data.candidates[0].content.parts[0].text;
  return JSON.parse(raw);
}
