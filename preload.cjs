const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktop: true,
  openTextFile: () => ipcRenderer.invoke("reader:open-text-file"),
  getLastTextFile: () => ipcRenderer.invoke("reader:get-last-text-file"),
  saveProgress: (progress) => ipcRenderer.invoke("reader:save-progress", progress),
  downloadNovel: (request) => ipcRenderer.invoke("reader:download-novel", request),
  cancelDownload: (jobId) => ipcRenderer.invoke("reader:cancel-download", jobId),
  edgeStatus: () => ipcRenderer.invoke("reader:edge-status"),
  edgeCommand: (command) => ipcRenderer.invoke("reader:edge-command", command),
  getWindowMode: () => ipcRenderer.invoke("reader:get-window-mode"),
  setWindowMode: (mode) => ipcRenderer.invoke("reader:set-window-mode", mode),
  captureScreen: () => ipcRenderer.invoke("reader:capture-screen"),
  minimizeWindow: () => ipcRenderer.send("reader:minimize-window"),
  toggleMaximizeWindow: () => ipcRenderer.send("reader:toggle-maximize-window"),
  closeWindow: () => ipcRenderer.send("reader:close-window"),
  onEdgeMessage: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on("reader:edge-message", listener);
    return () => ipcRenderer.removeListener("reader:edge-message", listener);
  },
  onDownloadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("reader:download-progress", listener);
    return () => ipcRenderer.removeListener("reader:download-progress", listener);
  }
});
