export {};

declare global {
  interface Window {
    jeffAI: {
      sendMessage(message: string): Promise<string>;
    };
  }
}
