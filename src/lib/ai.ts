type ChatMessage = { role: "system" | "user" | "assistant"; content: string | unknown[] };

const AI_BASE_URL = process.env.OPENROUTER_API_KEY
  ? "https://openrouter.ai/api/v1"
  : "https://api.groq.com/openai/v1";
const AI_KEY = process.env.OPENROUTER_API_KEY ?? process.env.GROQ_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export function hasAI() {
  return Boolean(AI_KEY);
}

export async function chatText(messages: ChatMessage[], options: { json?: boolean } = {}) {
  if (!AI_KEY) throw new Error("AI key not configured");
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${AI_KEY}`,
      ...(process.env.OPENROUTER_API_KEY ? { "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000", "X-Title": "CoalTrade OS" } : {}),
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.2,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? "").trim();
}

export function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    try { return JSON.parse(match[0]) as T; } catch { return fallback; }
  }
}
