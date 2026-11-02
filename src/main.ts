import { app, BrowserWindow, ipcMain, safeStorage } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { OpenRouterProvider, JTPlan } from "./core/ai-provider";
import { assertCapability } from "./core/app-permissions";

type Settings = { encryptedApiKey?: string; plan: JTPlan; selectedModel?: string };
const defaults: Settings = { plan: "free" };
const settingsPath = () => path.join(app.getPath("userData"), "jt-ai-settings.json");
let settings: Settings = { ...defaults };

async function loadSettings(): Promise<void> {
  try {
    const saved = JSON.parse(await fs.readFile(settingsPath(), "utf8")) as Partial<Settings> & { provider?: string; ollamaBaseUrl?: string };
    settings = { ...defaults, ...saved };
    // Migrate older installs away from the retired local Ollama provider.
    delete (settings as Settings & { provider?: string; ollamaBaseUrl?: string }).provider;
    delete (settings as Settings & { provider?: string; ollamaBaseUrl?: string }).ollamaBaseUrl;
    if (saved.provider === "ollama") delete settings.selectedModel;
  } catch { /* first launch */ }
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

function createWindow(): void {
  const window = new BrowserWindow({ width: 1120, height: 760, minWidth: 680, minHeight: 520, title: "Jeff AI", backgroundColor: "#090b14", webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  void window.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}
function publicSettings() {
  return { plan: settings.plan, selectedModel: settings.selectedModel || "", hasApiKey: Boolean(settings.encryptedApiKey), secureStorageAvailable: safeStorage.isEncryptionAvailable() };
}
ipcMain.handle("jeff-ai:settings:get", () => publicSettings());
ipcMain.handle("jeff-ai:settings:save", async (_event, input: unknown) => {
  if (!input || typeof input !== "object") throw new Error("Invalid settings.");
  const value = input as { apiKey?: unknown; plan?: unknown; selectedModel?: unknown };
  if (value.apiKey !== undefined) {
    if (typeof value.apiKey !== "string" || value.apiKey.length > 500 || (value.apiKey && !value.apiKey.startsWith("sk-or-"))) throw new Error("Enter a valid OpenRouter API key.");
    if (value.apiKey) {
      if (!safeStorage.isEncryptionAvailable()) throw new Error("Secure credential storage is unavailable. Your key has not been saved.");
      settings.encryptedApiKey = safeStorage.encryptString(value.apiKey).toString("base64");
    } else delete settings.encryptedApiKey;
  }
  if (value.plan !== undefined) {
    if (!["free", "student", "pro", "enterprise"].includes(String(value.plan))) throw new Error("Unknown JT plan.");
    settings.plan = value.plan as JTPlan;
  }
  if (value.selectedModel !== undefined) {
    if (typeof value.selectedModel !== "string" || value.selectedModel.length > 180) throw new Error("Invalid model selection.");
    settings.selectedModel = value.selectedModel;
  }
  await saveSettings();
  return publicSettings();
});
ipcMain.handle("jeff-ai:models:list", async () => {
  if (!getApiKey()) throw new Error("Add your OpenRouter API key in Settings to browse free models.");
  return openRouter.listFreeModels();
});
ipcMain.handle("jeff-ai:provider:test", async () => {
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
  return openRouter.chat(payload.message.trim(), { model: settings.selectedModel || undefined, imageDataUrl: payload.imageDataUrl as string | undefined });
});
app.whenReady().then(async () => { await loadSettings(); createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
