import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { LocalAIProvider } from "./core/ai-provider";

const provider = new LocalAIProvider();

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 720,
    minHeight: 540,
    title: "Jeff AI",
    backgroundColor: "#090b14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  void window.loadFile(path.join(__dirname, "../src/renderer/index.html"));
}

ipcMain.handle("jeff-ai:chat", async (_event, input: unknown) => {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("Enter a message first.");
  }
  if (input.length > 12000) {
    throw new Error("That message is too long. Please shorten it and try again.");
  }
  return provider.chat(input.trim());
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
