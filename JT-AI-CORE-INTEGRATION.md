# JT AI Core — Integration Contract and Current Status

## Product identity
- User-facing assistant: **Jeff AI**
- Shared provider abstraction: **JT AI Core**
- Remote inference gateway: **OpenRouter**
- API keys stay in trusted main-process storage or server-side secrets; never in renderer code or source control.

## Implemented in Jeff AI desktop
- OpenRouter chat-completions adapter.
- Dynamic free-model catalogue discovery using OpenRouter's models endpoint; filters for zero input and output token pricing.
- JT Core profile routing and ordered fallback.
- Main-process IPC for chat, model catalogue, and settings.
- API key encryption through Electron safeStorage in the app's user-data directory.
- Compact settings UI for plan profile, key setup, automatic routing, and model selection.

## Model profiles
- Core v1: nvidia/nemotron-3-ultra-550b-a55b:free → fallback google/gemma-4-26b-a4b-it:free.
- Core v2: Core v1 plus nvidia/nemotron-3.5-super-vl:free for multimodal use; image attachment support in the desktop chat UI is still pending.
- Pro (proposed): Core v2 plus openrouter/free.
- Enterprise (proposed): Core v1 + Core v2 + openrouter/free + cohere/north-mini-code:free.

The router uses sequential fallback. It does not run all models simultaneously or merge their answers. Manually selecting a model overrides the profile routing.

## Hosted JT AI Agent
The Cloudflare Pages Function accepts the jt-core provider and routes through OpenRouter using the server-side OPENROUTER_API_KEY secret. Hosted default is Core v1 only. Do not pass the API key from the browser.

To enable the hosted route, add OPENROUTER_API_KEY as a secret in the Cloudflare Pages project's environment variables and redeploy. The existing GitHub Actions secrets for Cloudflare deployment are separate credentials and must not be reused as the OpenRouter key.

## Security and permissions
- Provider requests execute in the Electron main process or Cloudflare Pages Function, not the renderer.
- The Electron API key is encrypted with OS-backed safeStorage; if secure storage is unavailable, saving is rejected.
- The hosted key is read from Cloudflare environment bindings only.
- Do not log API keys or full private prompts.
- AI output cannot grant itself app permissions.
- App-to-app and desktop actions still require explicit, app-specific permission checks and user approval.

## Not yet implemented
- Shared multi-app JT AI Core SDK package consumed by every desktop app.
- Student/Pro/Enterprise billing, signed plan entitlements, and account-based enforcement.
- Enterprise multi-user account with an enforced 200-worker limit, admin roles, and audit console.
- Image attachment UX in Jeff AI desktop.
- Usage metering, per-user quotas, queueing, and a reliable paid fallback for enterprise workloads.
- Automated provider contract tests and end-to-end UI tests.

## Free-tier operational warning
OpenRouter free variants are rate-limited and model availability changes. Do not promise unlimited requests or a production SLA on a shared free key. A 200-worker Enterprise service needs quota controls and a capacity plan before sale.
