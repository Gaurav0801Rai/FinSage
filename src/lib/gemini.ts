import "server-only";

export async function callGemini(
  endpointPath: string, // e.g. "models/gemini-2.5-flash:generateContent"
  payload: any,
  apiVersion: "v1" | "v1beta" = "v1"
): Promise<any> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKeysStr = process.env.GEMINI_API_KEYS || "";

  // Combine all keys, filtering out empty strings and duplicates
  const keys = Array.from(
    new Set(
      [primaryKey, ...secondaryKeysStr.split(",").map((k) => k.trim())]
        .filter(Boolean)
    )
  );

  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured. Set GEMINI_API_KEY or GEMINI_API_KEYS.");
  }

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/${endpointPath}?key=${key}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        const errText = await res.text();
        console.warn(`[Gemini Client] Key ${i + 1}/${keys.length} rate limited/quota exceeded:`, errText.slice(0, 150));
        lastError = new Error(`Gemini rate limit (429): ${errText}`);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini Client] Key ${i + 1}/${keys.length} returned error ${res.status}:`, errText.slice(0, 300));
        lastError = new Error(`Gemini HTTP error ${res.status}: ${errText}`);
        
        // If it's a validation error (400) or missing model (404), do not retry other keys
        // UNLESS it's an invalid API key error, which we should retry.
        if (res.status === 400 || res.status === 404) {
          if (errText.includes("API_KEY_INVALID") || errText.includes("API key not valid")) {
            console.warn(`[Gemini Client] Key ${i + 1}/${keys.length} is invalid/expired. Retrying with next key...`);
            continue;
          }
          throw lastError;
        }
        continue;
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error(`[Gemini Client] Exception on key ${i + 1}/${keys.length}:`, err.message);
      lastError = err;
      
      if (err.message?.includes("HTTP error 400") || err.message?.includes("HTTP error 404")) {
        if (err.message.includes("API_KEY_INVALID") || err.message.includes("API key not valid")) {
          console.warn(`[Gemini Client] Key ${i + 1}/${keys.length} is invalid/expired. Retrying with next key...`);
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini API keys failed.");
}
