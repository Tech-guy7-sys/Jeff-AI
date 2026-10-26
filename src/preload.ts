import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("jeffAI", {
  sendMessage: (message: string): Promise<string> =>
    ipcRenderer.invoke("jeff-ai:chat", message)
});

export {};
