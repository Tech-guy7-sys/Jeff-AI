# Jeff AI

Jeff AI is the user-facing AI workspace in the JT ecosystem. It is a cross-platform desktop app scaffold built with Electron and TypeScript.

## Product identity

- **Display name:** Jeff AI
- **Repository:** `jeff-ai`
- **Role:** Conversational AI workspace and provider abstraction for JT apps
- **UI branding:** Jeff AI. Provider implementation details belong in technical/privacy documentation, not the product name.

## Current implementation

- Electron desktop window with a simple chat interface
- Context-isolated preload bridge; renderer does not receive Node.js access
- Main-process AI provider adapter for a local Ollama-compatible endpoint
- Configurable model and endpoint through environment variables
- Packaging configuration for Windows, macOS, and Linux
- Source code remains in this repository

This is a starter implementation, not a claim that production installers have already been built or tested.

## Requirements

- Node.js 20 or newer
- npm
- For local AI replies: a running Ollama-compatible service at `http://127.0.0.1:11434` and an available model (default: `deepseek-r1:1.5b`)

## Develop

```bash
npm install
npm run build
npm start
```

Set `JEFF_AI_BASE_URL` or `JEFF_AI_MODEL` to override the local provider endpoint or model.

## Package

```bash
npm run dist
```

Electron Builder targets Windows x64 and x86/ia32 where supported, macOS Intel x64 and Apple Silicon arm64, and Linux x64/arm64. Platform packaging is most reliable when run on the corresponding operating system; macOS signing/notarization requires Apple credentials. The output is written to `release/` locally and is not automatically published as a GitHub Release.

## Repository layout

- `src/main.ts` — Electron main process and IPC
- `src/preload.ts` — restricted renderer bridge
- `src/core/ai-provider.ts` — provider abstraction and local provider
- `src/renderer/` — chat UI
- `electron-builder.yml` — platform packaging configuration

## Privacy and safety

Messages sent through the default provider go to the configured local endpoint. If a remote provider is added later, the app must clearly disclose what data is sent and require the user's configuration/consent. Never store API keys in renderer code or commit secrets.
