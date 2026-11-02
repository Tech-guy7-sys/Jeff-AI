# Jeff AI

Jeff AI is the user-facing AI workspace in the JT ecosystem. It is an Electron + TypeScript desktop app.

## AI provider

Jeff AI uses **OpenRouter free models only**. It does not require Ollama or a locally installed model. The default automatic route is OpenRouter's `openrouter/free` router, which selects an available free model. Users can also refresh the live catalogue and select a specific model marked free. OpenRouter's catalogue and free-model capacity can change.

An OpenRouter account and API key are required. Each installation stores its own key encrypted with Electron safeStorage; do not share or bundle one person's API key in the installer.

## Configure OpenRouter

1. Create an OpenRouter account and generate an API key.
2. Start Jeff AI and open **Settings**.
3. Paste the key into the password field and choose the Free plan profile.
4. Optionally refresh the free-model catalogue and choose a model, or leave automatic routing selected.
5. Save settings and use **Test connection**.

The API key is encrypted with Electron safeStorage in the app's user-data directory. It is not stored in renderer local storage, embedded in the installer, or committed to source control. If the operating system cannot provide secure storage, the app refuses to save the key.

## J Tech AI Core model tiers

Automatic routing follows the JT model profiles rather than sending every Free user to the generic router:

- **Free — J Tech AI Core v1:** `nvidia/nemotron-3-ultra-550b-a55b:free` first, then `google/gemma-4-26b-a4b-it:free` as fallback.
- **Student — J Tech AI Core v2:** v1 for text; `nvidia/nemotron-3.5-super-vl:free` is tried first for image requests, then v1 fallbacks.
- **Pro:** OpenRouter Free Router, with the curated free models as fallback; vision-capable requests try the v2 vision model first.
- **Enterprise:** adds `cohere/north-mini-code:free` for coding tasks, the v2 vision model for image requests, and OpenRouter Free Router with v1 fallbacks.

The router tries candidates in order and returns the first successful response; it does not merge multiple model outputs. A manually selected model overrides automatic routing. The tier selector is currently a local development profile, not subscription billing or server-enforced entitlement. The proposed Enterprise 200-worker ceiling is not implemented as a concurrency limit.

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
- src/renderer/ — Jeff AI chat and settings UI

## Important limitations

OpenRouter free models are rate-limited and availability can change. Free does not mean unlimited usage or a guaranteed service level. Users need their own OpenRouter API key; Jeff AI does not include a shared key. Remote prompts are sent to OpenRouter. Do not submit passwords, access tokens, or sensitive personal information.
