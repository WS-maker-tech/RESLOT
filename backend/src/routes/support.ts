import { Hono } from "hono";
import { env } from "../env";

export const supportRouter = new Hono();

const SYSTEM_PROMPT = `Du är Reslots kundsupportagent. Reslot är en app där användare kan dela och ta över restaurangbokningar som de inte längre kan använda — en andrahandsmarknad för bordbokningar på exklusiva restauranger i Sverige.

Du hjälper användare med:
- Hur Reslot fungerar (credits-systemet, hur man lägger upp och tar bokningar)
- Problem med betalning och credits
- Frågor om specifika bokningar
- Tekniska problem med appen

Viktiga fakta:
- Credits kostar inget — man tjänar dem genom att dela bokningar
- Varje delad bokning ger 2 credits, att ta en bokning kostar 2 credits
- Reslot garanterar inte att restaurangen accepterar överlåtelsen
- Vid problem hänvisa till: support@reslot.se

Ton: Varm, hjälpsam och professionell. Tala svenska. Håll svaren korta och konkreta.`;

supportRouter.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: string; content: string }[] }>();
  const { messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: "Invalid messages" }, 400);
  }

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Support not configured" }, 503);
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://reslot.se",
      "X-Title": "Reslot Support",
    },
    body: JSON.stringify({
      model: "openai/gpt-4.1-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    return c.json({ error: "AI error" }, 502);
  }

  const data = await res.json() as any;
  const reply = data.choices?.[0]?.message?.content ?? "Jag förstår inte riktigt, kan du förtydliga?";

  return c.json({ reply });
});
