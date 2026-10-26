export interface AIProvider {
  chat(message: string): Promise<string>;
}

/**
 * Local provider adapter. The UI is branded Jeff AI; implementation/provider
 * details stay behind this interface so providers can be changed safely.
 */
export class LocalAIProvider implements AIProvider {
  private readonly baseUrl = (process.env.JEFF_AI_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  private readonly model = process.env.JEFF_AI_MODEL || "deepseek-r1:1.5b";

  async chat(message: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages: [{ role: "user", content: message }]
        }),
        signal: AbortSignal.timeout(120000)
      });
    } catch {
      throw new Error("Jeff AI could not reach the local AI service. Start your local provider, then try again.");
    }

    if (!response.ok) {
      throw new Error(`The local AI service returned HTTP ${response.status}. Check that the selected model is installed.`);
    }

    const payload: unknown = await response.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("message" in payload) ||
      typeof payload.message !== "object" ||
      payload.message === null ||
      !("content" in payload.message) ||
      typeof payload.message.content !== "string"
    ) {
      throw new Error("The AI service returned an unexpected response.");
    }
    return payload.message.content.trim() || "The model returned an empty response.";
  }
}
