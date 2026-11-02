import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { OpenRouterProvider, JTPlan } from "./core/ai-provider";
import { OllamaProvider, ProviderId } from "./core/ollama-provider";
import { assertCapability } from "./core/app-permissions";

type Settings = { encryptedApiKey?: string; plan: JTPlan; selectedModel?: string; provider: ProviderId; ollamaBaseUrl: string };
const defaults: Settings = { plan: "free", provider: "ollama", ollamaBaseUrl: "http://127.0.0.1:11434" };
const settingsPath = () => path.join(app.getPath("userData"), "jt-ai-settings.json");
let settings: Settings = { ...defaults };

async function loadSettings(): Promise<void> {
  try { settings = { ...defaults, ...JSON.parse(await fs.readFile(settingsPath(), "utf8")) as Partial<Settings> }; }
  catch { /* first launch */ }
  if (settings.provider !== "ollama" && settings.provider !== "openrouter") settings.provider = "ollama";
  if (!/^https?:\/\//i.test(settings.ollamaBaseUrl)) settings.ollamaBaseUrl = defaults.ollamaBaseUrl;
}
async function saveSettings(): Promise<void> {
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}
function getApiKey(): string {
  if (!settings.encryptedApiKey) return "";
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Secure credential storage is unavailable on this device.");
  return safeStorage.decryptString(Buffer.from(settings.encryptedApiKey, "base64"));
}
const openRouter = new OpenRouterProvider(getApiKey, () => settings.plan);
const ollama = new OllamaProvider(() => settings.ollamaBaseUrl);

function createWindow(): void {
  const window = new BrowserWindow({ width: 1120, height: 760, minWidth: 680, minHeight: 520, title: "Jeff AI", backgroundColor: "#090b14", webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  void window.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}
function publicSettings() {
  return { plan: settings.plan, selectedModel: settings.selectedModel || "", provider: settings.provider, ollamaBaseUrl: settings.ollamaBaseUrl, hasApiKey: Boolean(settings.encryptedApiKey), secureStorageAvailable: safeStorage.isEncryptionAvailable() };
}
ipcMain.handle("jeff-ai:settings:get", () => publicSettings());
ipcMain.handle("jeff-ai:settings:save", async (_event, input: unknown) => {
  if (!input || typeof input !== "object") throw new Error("Invalid settings.");
  const value = input as { apiKey?: unknown; plan?: unknown; selectedModel?: unknown; provider?: unknown; ollamaBaseUrl?: unknown };
  if (value.apiKey !== undefined) {
    if (typeof value.apiKey !== "string" || value.apiKey.length > 500 || (value.apiKey && !value.apiKey.startsWith("sk-or-"))) throw new Error("Enter a valid OpenRouter API key.");
    if (value.apiKey) { if (!safeStorage.isEncryptionAvailable()) throw new Error("Secure credential storage is unavailable. Your key has not been saved."); settings.encryptedApiKey = safeStorage.encryptString(value.apiKey).toString("base64"); }
    else delete settings.encryptedApiKey;
  }
  if (value.plan !== undefined) { if (!["free", "student", "pro", "enterprise"].includes(String(value.plan))) throw new Error("Unknown JT plan."); settings.plan = value.plan as JTPlan; }
  if (value.provider !== undefined) { if (value.provider !== "ollama" && value.provider !== "openrouter") throw new Error("Unknown AI provider."); settings.provider = value.provider as ProviderId; }
  if (value.ollamaBaseUrl !== undefined) {
    if (typeof value.ollamaBaseUrl !== "string" || value.ollamaBaseUrl.length > 300) throw new Error("Invalid Ollama address.");
    const url = new URL(value.ollamaBaseUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use a valid Ollama HTTP address without credentials.");
    settings.ollamaBaseUrl = url.toString().replace(/\/$/, "");
  }
  if (value.selectedModel !== undefined) { if (typeof value.selectedModel !== "string" || value.selectedModel.length > 180) throw new Error("Invalid model selection."); settings.selectedModel = value.selectedModel; }
  await saveSettings();
  return publicSettings();
});
ipcMain.handle("jeff-ai:models:list", async () => settings.provider === "ollama" ? ollama.listModels() : openRouter.listFreeModels());
ipcMain.handle("jeff-ai:provider:test", async () => {
  if (settings.provider === "ollama") return { ok: true, provider: "ollama", models: await ollama.listModels() };
  if (!getApiKey()) throw new Error("Add your OpenRouter API key in Settings first.");
  return { ok: true, provider: "openrouter", models: await openRouter.listFreeModels() };
});
ipcMain.handle("jeff-ai:chat", async (_event, input: unknown) => {
  const payload = typeof input === "string" ? { message: input } : input as { message?: unknown; imageDataUrl?: unknown };
  if (!payload || typeof payload.message !== "string" || !payload.message.trim()) throw new Error("Enter a message first.");
  if (payload.message.length > 12000) throw new Error("That message is too long. Please shorten it and try again.");
  if (payload.imageDataUrl !== undefined && (typeof payload.imageDataUrl !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(payload.imageDataUrl) || payload.imageDataUrl.length > 7_000_000)) throw new Error("Choose a PNG, JPEG, or WebP image under 5 MB.");
  assertCapability("jeff-ai", "ai.chat");
  if (payload.imageDataUrl !== undefined) assertCapability("jeff-ai", "ai.vision");
  const message = payload.message.trim();
  if (settings.provider === "ollama") return ollama.chat(message, settings.selectedModel || "", payload.imageDataUrl as string | undefined);
  return openRouter.chat(message, { model: settings.selectedModel || undefined, imageDataUrl: payload.imageDataUrl as string | undefined });
});
app.whenReady().then(async () => { await loadSettings(); createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
