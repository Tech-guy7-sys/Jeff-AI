export type JTPlan = "free" | "student" | "pro" | "enterprise";
export type FreeModel = { id: string; name: string; context_length?: number };
export const JT_CORE_MODELS = {
  v1: ["nvidia/nemotron-3-ultra-550b-a55b:free", "google/gemma-4-26b-a4b-it:free"],
  vision: "nvidia/nemotron-3.5-super-vl:free",
  router: "openrouter/free",
  code: "cohere/north-mini-code:free"
} as const;
export function modelsForPlan(plan: JTPlan, hasImage = false, coding = false): string[] {
  const v1 = [...JT_CORE_MODELS.v1];
  if (plan === "free") return v1;
  if (plan === "student") return hasImage ? [JT_CORE_MODELS.vision, ...v1] : v1;
  if (plan === "pro") return hasImage ? [JT_CORE_MODELS.vision, JT_CORE_MODELS.router, ...v1] : [JT_CORE_MODELS.router, ...v1];
  return coding ? [JT_CORE_MODELS.code, JT_CORE_MODELS.vision, JT_CORE_MODELS.router, ...v1] : hasImage ? [JT_CORE_MODELS.vision, JT_CORE_MODELS.router, ...v1] : [JT_CORE_MODELS.router, JT_CORE_MODELS.vision, ...v1];
}
export class OpenRouterProvider {
  constructor(private readonly getApiKey: () => string, private readonly getPlan: () => JTPlan) {}
  async listFreeModels(): Promise<FreeModel[]> {
    const key = this.getApiKey();
    const response = await fetch("https://openrouter.ai/api/v1/models", { headers: key ? { Authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`OpenRouter model catalogue returned HTTP ${response.status}.`);
    const payload = await response.json() as { data?: Array<{ id: string; name?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }> };
    return (payload.data || []).filter(m => (m.id.endsWith(":free") || m.id === "openrouter/free") && Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0).map(m => ({ id: m.id, name: m.name || m.id, context_length: m.context_length })).sort((a,b)=>a.name.localeCompare(b.name));
  }
  async chat(message: string, options: { model?: string; imageDataUrl?: string } = {}): Promise<string> {
    const key = this.getApiKey();
    if (!key) throw new Error("Add your OpenRouter API key in Jeff AI Settings before chatting.");
    const plan = this.getPlan();
    if (options.imageDataUrl && plan === "free" && !options.model) throw new Error("Image understanding is available in the Student plan and above. You can still choose a vision-capable free model manually in Settings.");
    const candidates = options.model ? [options.model] : [JT_CORE_MODELS.router, ...modelsForPlan(plan, Boolean(options.imageDataUrl), /\b(code|program|debug|typescript|javascript|python|build an app)\b/i.test(message))];
    let lastError = "No available free model answered the request.";
    for (const model of [...new Set(candidates)]) {
      let response: Response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://jtdigitalworld.com", "X-Title": "Jeff AI · J Tech Digital World" },
          body: JSON.stringify({ model, messages: [{ role: "user", content: options.imageDataUrl ? [{ type: "text", text: message }, { type: "image_url", image_url: { url: options.imageDataUrl } }] : message }], stream: false }),
          signal: AbortSignal.timeout(120000)
        });
      } catch { lastError = "Jeff AI could not reach OpenRouter. Check your internet connection and try again."; continue; }
      if (!response.ok) {
        lastError = response.status === 429 ? "OpenRouter's free-model rate limit was reached. Wait and try again, or choose another available free model." : `OpenRouter model ${model} returned HTTP ${response.status}.`;
        continue;
      }
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const answer = payload.choices?.[0]?.message?.content;
      if (typeof answer === "string" && answer.trim()) return answer.trim();
      lastError = `OpenRouter model ${model} returned an empty response.`;
    }
    throw new Error(lastError);
  }
}