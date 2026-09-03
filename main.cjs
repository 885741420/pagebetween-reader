const { app, BrowserWindow, dialog, ipcMain, Menu, net, desktopCapturer } = require("electron");
const { promises: fs } = require("node:fs");
const path = require("node:path");
const { downloadNovel } = require("./novel-downloader.cjs");
const { WebSocketServer, WebSocket } = require("ws");

let mainWindow;
let readerState = { lastFilePath: null, progressByFile: {}, windowMode: "windowed", windowBounds: null };
let statePath;
let writeQueue = Promise.resolve();
const downloadJobs = new Map();
const bridgeClients = new Set();
const EDGE_BRIDGE_PORT = 17321;
let bridgeServer;

app.setName("页间小说阅读器");

function defaultState() {
  return { lastFilePath: null, progressByFile: {}, windowMode: "windowed", windowBounds: null };
}

async function initializeState() {
  statePath = path.join(app.getPath("userData"), "reader-state.json");
  try {
    const parsed = JSON.parse(await fs.readFile(statePath, "utf8"));
    readerState = {
      ...defaultState(),
      ...parsed,
      progressByFile: parsed.progressByFile || {}
    };
  } catch (_error) {
    readerState = defaultState();
  }
}

function persistState() {
  const payload = JSON.stringify(readerState, null, 2);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      await fs.writeFile(statePath, payload, "utf8");
    });
  return writeQueue;
}

async function readBook(filePath) {
  const [bytes, stats] = await Promise.all([fs.readFile(filePath), fs.stat(filePath)]);
  return {
    filePath,
    name: path.basename(filePath),
    size: Number(stats.size),
    lastModified: Math.floor(stats.mtimeMs),
    bytes: new Uint8Array(bytes),
    savedProgress: readerState.progressByFile[filePath] || null
  };
}

async function rememberBook(filePath) {
  readerState.lastFilePath = filePath;
  await persistState();
}

function sanitizeFileName(value) {
  const cleaned = String(value || "未命名小说")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  return (cleaned || "未命名小说").slice(0, 100);
}

function sendDownloadProgress(sender, payload) {
  if (!sender.isDestroyed()) sender.send("reader:download-progress", payload);
}

function sendToEdgeExtensions(payload) {
  const message = JSON.stringify(payload);
  let sent = 0;
  bridgeClients.forEach((client) => {
    if (client.role !== "edge-extension" || client.readyState !== WebSocket.OPEN) return;
    try {
      client.send(message);
      sent += 1;
    } catch (_error) {
      bridgeClients.delete(client);
    }
  });
  return sent;
}

function sanitizeEdgeMessage(message) {
  if (!message || typeof message !== "object") return null;
  if (!["chapter-batch", "status", "catalog"].includes(message.type)) return null;
  if (message.type === "status") return { type: "status", connected: Boolean(message.connected) };
  if (message.type === "catalog") {
    return {
      type: "catalog",
      title: String(message.title || "").slice(0, 200),
      url: String(message.url || "").slice(0, 2000),
      chapters: Array.isArray(message.chapters)
        ? message.chapters.slice(0, 2000).map((chapter) => ({
          title: String(chapter?.title || "").slice(0, 200),
          url: String(chapter?.url || "").slice(0, 2000)
        })).filter((chapter) => chapter.url)
        : []
    };
  }
  const chapters = Array.isArray(message.chapters) ? message.chapters : [];
  return {
    type: "chapter-batch",
    currentUrl: String(message.currentUrl || "").slice(0, 2000),
    chapters: chapters.slice(0, 3).map((chapter) => ({
      title: String(chapter?.title || "正文").slice(0, 200),
      content: String(chapter?.content || "").slice(0, 2_000_000),
      sourceUrl: String(chapter?.sourceUrl || "").slice(0, 2000),
      bookTitle: String(chapter?.bookTitle || "").slice(0, 200),
      directoryUrl: String(chapter?.directoryUrl || "").slice(0, 2000),
      previous: chapter?.previous && {
        title: String(chapter.previous.title || "上一章").slice(0, 200),
        url: String(chapter.previous.url || "").slice(0, 2000)
      },
      next: chapter?.next && {
        title: String(chapter.next.title || "下一章").slice(0, 200),
        url: String(chapter.next.url || "").slice(0, 2000)
      }
    })).filter((chapter) => chapter.sourceUrl && chapter.content)
  };
}

function handleBridgeMessage(socket, rawMessage) {
  let message;
  try {
    message = JSON.parse(String(rawMessage));
  } catch (_error) {
    return;
  }

  if (message?.type === "hello") {
    socket.role = String(message.role || "unknown");
    socket.send(JSON.stringify({ type: "hello-ack", port: EDGE_BRIDGE_PORT }));
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reader:edge-message", { type: "status", connected: true });
    }
    return;
  }

  const safeMessage = sanitizeEdgeMessage(message);
  if (!safeMessage || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("reader:edge-message", safeMessage);
}

function startEdgeBridge() {
  if (bridgeServer) return;
  bridgeServer = new WebSocketServer({
    host: "127.0.0.1",
    port: EDGE_BRIDGE_PORT,
    maxPayload: 8 * 1024 * 1024
  });
  bridgeServer.on("connection", (socket) => {
    socket.role = "unknown";
    bridgeClients.add(socket);
    socket.on("message", (message) => handleBridgeMessage(socket, message));
    socket.on("close", () => {
      bridgeClients.delete(socket);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("reader:edge-message", {
          type: "status",
          connected: Array.from(bridgeClients).some((client) => client.role === "edge-extension")
        });
      }
    });
    socket.on("error", () => bridgeClients.delete(socket));
  });
  bridgeServer.on("error", (error) => {
    console.error("Edge bridge error:", error.message);
  });
}

function stopEdgeBridge() {
  bridgeClients.forEach((client) => client.close());
  bridgeClients.clear();
  bridgeServer?.close();
  bridgeServer = null;
}

function createWindow(options = {}) {
  const bounds = options.bounds || readerState.windowBounds || {};
  const frameless = readerState.windowMode === "frameless";
  mainWindow = new BrowserWindow({
    width: bounds.width || 1320,
    height: bounds.height || 850,
    x: Number.isFinite(bounds.x) ? bounds.x : undefined,
    y: Number.isFinite(bounds.y) ? bounds.y : undefined,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#f3f1eb",
    title: "页间小说阅读器",
    frame: !frameless,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile("index.html");
  const createdWindow = mainWindow;
  createdWindow.on("closed", () => {
    if (mainWindow === createdWindow) mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle("reader:open-text-file", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "打开 TXT 小说",
      properties: ["openFile"],
      filters: [{ name: "TXT 文本", extensions: ["txt"] }]
    });

    if (result.canceled || !result.filePaths[0]) return null;
    const book = await readBook(result.filePaths[0]);
    await rememberBook(book.filePath);
    return book;
  });

  ipcMain.handle("reader:get-last-text-file", async () => {
    if (!readerState.lastFilePath) return null;
    try {
      return await readBook(readerState.lastFilePath);
    } catch (_error) {
      return {
        missing: true,
        name: path.basename(readerState.lastFilePath),
        filePath: readerState.lastFilePath
      };
    }
  });

  ipcMain.handle("reader:save-progress", async (_event, progress) => {
    if (!progress || typeof progress.filePath !== "string") return;
    readerState.progressByFile[progress.filePath] = {
      chapter: Number.isFinite(progress.chapter) ? progress.chapter : 0,
      ratio: Number.isFinite(progress.ratio) ? progress.ratio : 0,
      updatedAt: Date.now()
    };
    await persistState();
  });

  ipcMain.handle("reader:download-novel", async (event, request) => {
    const jobId = typeof request?.jobId === "string" ? request.jobId : "";
    if (!jobId || downloadJobs.has(jobId)) {
      return { ok: false, error: { code: "BAD_JOB", message: "下载任务无效，请重试" } };
    }
    if (request?.confirmedRights !== true) {
      return { ok: false, error: { code: "RIGHTS_NOT_CONFIRMED", message: "请先确认你有权下载这些内容" } };
    }

    const controller = new AbortController();
    downloadJobs.set(jobId, controller);
    try {
      const novel = await downloadNovel(
        { url: request.url, maxChapters: request.maxChapters, fetchImpl: net.fetch },
        {
          signal: controller.signal,
          onProgress: (progress) => sendDownloadProgress(event.sender, { jobId, ...progress })
        }
      );

      sendDownloadProgress(event.sender, {
        jobId,
        phase: "saving",
        current: novel.chapterCount,
        total: novel.chapterCount,
        message: "请选择 TXT 保存位置"
      });
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        title: "保存 TXT 小说",
        defaultPath: path.join(app.getPath("downloads"), `${sanitizeFileName(novel.title)}.txt`),
        filters: [{ name: "TXT 文本", extensions: ["txt"] }]
      });
      if (saveResult.canceled || !saveResult.filePath) return { ok: true, canceled: true };

      await fs.writeFile(saveResult.filePath, `\uFEFF${novel.text}`, "utf8");
      const book = await readBook(saveResult.filePath);
      await rememberBook(book.filePath);
      return {
        ok: true,
        book,
        chapterCount: novel.chapterCount,
        failedCount: novel.failedCount
      };
    } catch (error) {
      const canceled = controller.signal.aborted || error?.name === "AbortError";
      return {
        ok: false,
        canceled,
        error: {
          code: canceled ? "CANCELED" : (error?.code || "DOWNLOAD_FAILED"),
          message: canceled ? "下载已取消" : (error?.message || "下载失败")
        }
      };
    } finally {
      downloadJobs.delete(jobId);
    }
  });

  ipcMain.handle("reader:cancel-download", (_event, jobId) => {
    const controller = downloadJobs.get(jobId);
    if (!controller) return false;
    controller.abort(new DOMException("下载已取消", "AbortError"));
    return true;
  });

  ipcMain.handle("reader:edge-status", () => ({
    connected: Array.from(bridgeClients).some((client) => client.role === "edge-extension" && client.readyState === WebSocket.OPEN),
    port: EDGE_BRIDGE_PORT
  }));

  ipcMain.handle("reader:edge-command", (_event, command) => {
    const type = String(command?.type || "");
    if (!["capture", "navigate", "directory", "find-directory"].includes(type)) {
      return { ok: false, error: "未知的 Edge 命令" };
    }
    const sent = sendToEdgeExtensions({ type: "reader-command", command: { type, url: String(command?.url || "") } });
    return { ok: sent > 0, connected: sent > 0 };
  });

  ipcMain.handle("reader:get-window-mode", () => readerState.windowMode);

  ipcMain.handle("reader:capture-screen", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1600, height: 1000 },
      fetchWindowIcons: false
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      displayId: source.display_id,
      width: source.thumbnail.getSize().width,
      height: source.thumbnail.getSize().height,
      dataUrl: source.thumbnail.toDataURL()
    }));
  });

  ipcMain.handle("reader:set-window-mode", async (_event, requestedMode) => {
    const mode = requestedMode === "frameless" ? "frameless" : "windowed";
    if (mode === readerState.windowMode || !mainWindow || mainWindow.isDestroyed()) return mode;

    const bounds = mainWindow.getBounds();
    readerState.windowMode = mode;
    readerState.windowBounds = bounds;
    await persistState();

    const oldWindow = mainWindow;
    mainWindow = null;
    setImmediate(() => {
      if (!oldWindow.isDestroyed()) oldWindow.destroy();
      createWindow({ bounds });
    });
    return mode;
  });

  ipcMain.on("reader:minimize-window", () => mainWindow?.minimize());
  ipcMain.on("reader:toggle-maximize-window", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on("reader:close-window", () => mainWindow?.close());
}

app.whenReady().then(async () => {
  await initializeState();
  Menu.setApplicationMenu(null);
  startEdgeBridge();
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  downloadJobs.forEach((controller) => controller.abort());
  stopEdgeBridge();
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", stopEdgeBridge);
