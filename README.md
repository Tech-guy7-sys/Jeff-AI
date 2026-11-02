# Jeff AI

Jeff AI is the user-facing AI workspace in the JT ecosystem. It is an Electron + TypeScript desktop app.

## AI provider

Jeff AI supports local Ollama and OpenRouter through the JT AI Core provider abstraction. Choose the provider in Settings, test the connection, and discover its installed/available models. Ollama uses the local OpenAI-compatible endpoint at `http://127.0.0.1:11434` by default; prompts stay on the local machine when Ollama is selected. OpenRouter sends prompts to its cloud API. It can discover the current OpenRouter catalogue of free models and filter it by zero input/output token price. The catalogue is dynamic; model availability, provider capacity, and free limits can change.

### JT AI Core tiers (routing profiles)

- **Free — JT AI Core v1:** NVIDIA Nemotron 3 Ultra (free), with Google Gemma 4 26B A4B (free) as fallback.
- **Student — JT AI Core v2:** Core v1 plus NVIDIA Nemotron 3.5 Super VL (free), intended for vision-capable tasks when an image input flow is enabled.
- **Pro — proposed profile:** Core v2 plus OpenRouter Free Router.
- **Enterprise — proposed profile:** Core v1 + v2 + OpenRouter Free Router + Cohere North Mini Code (free). The 200-worker account limit is a product target, not an enforced multi-user entitlement yet.

The profile router uses ordered fallback models; it does not combine multiple model outputs into one answer. A manually selected free model in Settings overrides automatic routing.

## Configure OpenRouter

1. Start Jeff AI and open **Settings**.
2. Paste your OpenRouter API key into the password field and choose a profile.
3. Optionally refresh the free model catalogue and choose a model, or leave automatic routing selected.
4. Save settings.

The API key is encrypted with Electron safeStorage in the app's user-data directory. It is not stored in renderer local storage, embedded in the installer, or committed to source control. If the operating system cannot provide secure storage, the app refuses to save the key.

## Develop

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run build
npm start
```

## Package

```bash
npm run dist
```

Electron Builder targets Windows x64 and x86/ia32 where supported, macOS Intel x64 and Apple Silicon arm64, and Linux x64/arm64. Platform packaging is most reliable when run on the corresponding operating system; macOS signing/notarization requires Apple credentials. The output is written to release/ locally and is not automatically published as a GitHub Release.

## Architecture

- src/main.ts — Electron main process, encrypted settings, IPC
- src/preload.ts — restricted renderer bridge
- src/core/ai-provider.ts — OpenRouter adapter, free-model discovery, JT Core routing
- src/renderer/ — compact Jeff AI chat and settings UI

## Important limitations

OpenRouter free model endpoints are rate-limited and availability can change. A free model does not mean unlimited usage or a guaranteed service level. The current plan selector is a local development profile switch; it is not subscription billing, account entitlement enforcement, or a verified 200-seat enterprise service. No payment processing is implemented.

Remote prompts are sent to OpenRouter. Do not submit passwords, access tokens, or sensitive personal information. Keep the API key private.
