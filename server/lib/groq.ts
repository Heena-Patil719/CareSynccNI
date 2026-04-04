export interface GroqChatResponse {
  id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

type MessageContent = GroqChatResponse["choices"] extends Array<infer T>
  ? T extends { message?: { content?: infer C } }
    ? C
    : never
  : never;

function getMessageText(content: MessageContent): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text?.trim())
      .filter((part): part is string => Boolean(part))
      .join("\n")
      .trim();
  }

  return "";
}

export function getGroqApiKey(): string | null {
  const apiKey =
    process.env.GROQ_API_KEY?.trim() ||
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    null;

  if (!apiKey) {
    return null;
  }

  const normalized = apiKey.toLowerCase();
  const placeholderValues = new Set([
    "your_groq_api_key",
    "your_xai_api_key",
    "your_grok_api_key",
    "replace_with_real_groq_api_key",
  ]);

  return placeholderValues.has(normalized) ? null : apiKey;
}

export function getGroqModel(): string {
  return (
    process.env.GROQ_MODEL?.trim() ||
    process.env.XAI_MODEL?.trim() ||
    process.env.GROK_MODEL?.trim() ||
    "llama-3.1-8b-instant"
  );
}

export async function createGroqChatCompletion(prompt: string, temperature = 0.2): Promise<GroqChatResponse> {
  const apiKey = getGroqApiKey();
  const model = getGroqModel();

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY. Add your real Groq API key in .env.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  const rawText = await response.text();
  let data: GroqChatResponse = {};

  try {
    data = rawText ? (JSON.parse(rawText) as GroqChatResponse) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const apiMessage = data.error?.message?.trim();
    const rawMessage = rawText.trim();
    const fallbackMessage = rawMessage ? rawMessage.slice(0, 300) : `Groq request failed with status ${response.status}`;
    throw new Error(apiMessage || fallbackMessage);
  }

  return data;
}

export function extractGroqText(data: GroqChatResponse): string | null {
  const content = data.choices?.[0]?.message?.content;
  const text = getMessageText(content);
  return text || null;
}
