export {};
declare global {
  interface Window {
    jeffAI: {
      sendMessage(message: string, imageDataUrl?: string): Promise<string>;
      getSettings(): Promise<{ plan: string; selectedModel: string; hasApiKey: boolean; secureStorageAvailable: boolean }>;
      saveSettings(settings: { apiKey?: string; plan?: string; selectedModel?: string }): Promise<{ plan: string; selectedModel: string; hasApiKey: boolean; secureStorageAvailable: boolean }>;
      listModels(): Promise<Array<{ id: string; name: string; context_length?: number }>>;
      testProvider(): Promise<{ ok: boolean; provider: string; models: Array<{ id: string; name: string }> }>;
    };
  }
}
