const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export type Subtask = { title: string; description: string };

export async function fetchSubtasks(title: string, description: string): Promise<Subtask[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            'You are a task decomposition assistant for a software team. Break the given task into 3-5 concrete, actionable subtasks. Return ONLY valid JSON — an array of objects with "title" (max 60 chars) and "description" (one clear sentence) fields. No markdown fences, no explanations.',
        },
        {
          role: "user",
          content: `Task: "${title}"\nContext: "${description || "No additional context"}"`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status} ${res.statusText}`);

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const sanitized = json.replace(/[\x00-\x1F\x7F]/g, (c) => {
    if (c === "\n") return "\\n";
    if (c === "\r") return "\\r";
    if (c === "\t") return "\\t";
    return "";
  });
  return JSON.parse(sanitized) as Subtask[];
}
