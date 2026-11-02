import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("jeffAI", {
  sendMessage: (message: string, imageDataUrl?: string): Promise<string> => ipcRenderer.invoke("jeff-ai:chat", { message, imageDataUrl }),
  getSettings: () => ipcRenderer.invoke("jeff-ai:settings:get"),
  saveSettings: (settings: { apiKey?: string; plan?: string; selectedModel?: string }) => ipcRenderer.invoke("jeff-ai:settings:save", settings),
  listFreeModels: () => ipcRenderer.invoke("jeff-ai:models:list-free")
});
export {};
