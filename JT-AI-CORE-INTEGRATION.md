# Jeff AI — JT AI Core Integration Contract

## Goal

Jeff AI is the user-facing assistant experience. Provider implementations are internal adapters. JT apps should request AI capabilities through a shared, permission-aware interface instead of embedding provider-specific calls in each UI.

## Suggested TypeScript boundary

```ts
export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiRequest = {
  appId: string;
  conversationId: string;
  messages: AiMessage[];
  signal?: AbortSignal;
};

export type AiResult = {
  text: string;
  providerId: string;
  modelId: string;
};

export interface AiProvider {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  generate(request: AiRequest): Promise<AiResult>;
}
```

This is a proposed contract, not a claim that the shared service is already implemented or connected.

## Required controls

- Keep provider calls in the Electron main process or a trusted service, never directly in renderer code.
- Validate IPC payload size, message roles, app identity and request shape.
- Apply per-app tool permissions outside the language model; model output must never grant itself permissions.
- Require explicit user approval before any tool performs a consequential action.
- Support cancellation with `AbortSignal` and show clear busy/error states.
- Do not write prompts, private documents, tokens or credentials to routine logs.
- Keep endpoint and model configuration in validated settings; never commit credentials.
- Clearly disclose whether a configured provider is local or remote and what data leaves the device.

## Integration stages

1. Extract a stable interface and provider configuration schema.
2. Add mocked-provider tests for success, timeout, malformed response, cancellation and unavailable backend.
3. Add the local provider adapter behind the interface.
4. Add app-specific tool registration with explicit permission scopes.
5. Connect other JT apps only after the interface and policy tests pass.

## Current status

The existing app is an early Electron/TypeScript scaffold with a local Ollama-compatible provider adapter. This document defines a path toward JT AI Core integration; it does not imply that other JT applications are already connected.
