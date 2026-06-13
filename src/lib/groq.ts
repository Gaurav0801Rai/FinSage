import "server-only";

export async function callGroq(payload: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: "json_object" };
}): Promise<any> {
  const primaryKey = process.env.GROQ_API_KEY;
  const secondaryKeysStr = process.env.GROQ_API_KEYS || "";
  
  // Combine all keys, filtering out empty strings and duplicates
  const keys = Array.from(
    new Set(
      [primaryKey, ...secondaryKeysStr.split(",").map((k) => k.trim())]
        .filter(Boolean)
    )
  );

  if (keys.length === 0) {
    throw new Error("No Groq API keys configured. Set GROQ_API_KEY or GROQ_API_KEYS.");
  }

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        console.warn(`[Groq Client] Key ${i + 1}/${keys.length} rate limited (429). Retrying with next key...`);
        lastError = new Error(`Groq rate limit: ${await res.text()}`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Groq Client] Key ${i + 1}/${keys.length} returned error ${res.status}:`, errText);
        lastError = new Error(`Groq HTTP error ${res.status}: ${errText}`);
        
        // If it's a validation error (400), don't retry other keys as payload is invalid
        if (res.status === 400) {
          throw lastError;
        }
        continue;
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error(`[Groq Client] Exception on key ${i + 1}/${keys.length}:`, err.message);
      lastError = err;
      
      if (err.message?.includes("HTTP error 400")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Groq API keys failed.");
}
