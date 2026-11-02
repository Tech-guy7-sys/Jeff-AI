import type { JTPlan } from "./ai-provider";

export type ProviderId = "ollama" | "openrouter";
export type ProviderModel = { id: string; name: string; context_length?: number };

export class OllamaProvider {
  constructor(private readonly getBaseUrl: () => string) {}

  private baseUrl(): string {
    const value = this.getBaseUrl().trim().replace(/\/+$/, "");
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Ollama URL must use HTTP or HTTPS.");
    if (url.username || url.password) throw new Error("Do not put credentials in the Ollama URL.");
    return value;
  }

  async listModels(): Promise<ProviderModel[]> {
    const response = await fetch(`${this.baseUrl()}/api/tags`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}. Is Ollama running?`);
    const payload = await response.json() as { models?: Array<{ name: string; details?: { parameter_size?: string } }> };
    return (payload.models || []).map(m => ({ id: m.name, name: m.details?.parameter_size ? `${m.name} · ${m.details.parameter_size}` : m.name }));
  }

  async chat(message: string, model: string, imageDataUrl?: string): Promise<string> {
    if (!model) throw new Error("Choose an installed Ollama model in Settings.");
    const content: string | Array<Record<string, unknown>> = imageDataUrl
      ? [{ type: "text", text: message }, { type: "image_url", image_url: { url: imageDataUrl } }]
      : message;
    const response = await fetch(`${this.baseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content }], stream: false }),
      signal: AbortSignal.timeout(180000)
    });
    if (!response.ok) throw new Error(`Ollama model request failed (HTTP ${response.status}). Check that the model is installed and supports the requested input.`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = payload.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("Ollama returned an empty response.");
    return answer.trim();
  }
}
