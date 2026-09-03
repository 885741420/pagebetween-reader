(function () {
  "use strict";

  const BRIDGE_URL = "ws://127.0.0.1:17321";
  let socket = null;
  let reconnectTimer = null;
  let reconnectDelay = 500;
  let edgeTabId = null;
  let pendingMessage = null;
  let heartbeatTimer = null;

  connect();

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    try {
      socket = new WebSocket(BRIDGE_URL);
      socket.addEventListener("open", () => {
        reconnectDelay = 500;
        socket.send(JSON.stringify({ type: "hello", role: "edge-extension", version: "1.2.0" }));
        clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "keepalive" }));
        }, 20000);
        if (pendingMessage) {
          socket.send(JSON.stringify(pendingMessage));
          pendingMessage = null;
        }
      });
      socket.addEventListener("message", (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (_error) {
          return;
        }
        if (message?.type === "reader-command") handleReaderCommand(message.command || {});
      });
      socket.addEventListener("close", () => {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
        scheduleReconnect();
      });
      socket.addEventListener("error", () => socket?.close());
    } catch (_error) {
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectDelay = Math.min(8000, reconnectDelay * 1.7);
      connect();
    }, reconnectDelay);
  }

  function sendToReader(message) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return;
    }
    pendingMessage = message;
    connect();
  }

  async function handleReaderCommand(command) {
    const type = String(command.type || "");
    if (type === "capture") {
      const tab = await getTargetTab();
      if (!tab?.id) return;
      edgeTabId = tab.id;
      await askTab(tab.id, { type: "extract", prefetch: true });
      return;
    }

    if (["navigate", "directory"].includes(type)) {
      const tab = await getTargetTab();
      if (!tab?.id) return;
      edgeTabId = tab.id;
      const target = String(command.url || "");
      if (target) {
        await chrome.tabs.update(tab.id, { url: target });
      } else {
        await askTab(tab.id, { type: "find-directory" });
      }
      return;
    }

    if (type === "find-directory") {
      const tab = await getTargetTab();
      if (!tab?.id) return;
      edgeTabId = tab.id;
      await askTab(tab.id, { type: "find-directory" });
    }
  }

  async function getTargetTab() {
    if (edgeTabId) {
      try {
        const tab = await chrome.tabs.get(edgeTabId);
        if (tab) return tab;
      } catch (_error) {
        edgeTabId = null;
      }
    }
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0] || null;
  }

  async function askTab(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (_error) {
      return null;
    }
  }

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (!message || !sender.tab?.id) return;
    if (sender.tab.id !== edgeTabId && message.type !== "catalog") return;
    if (message.type === "chapter-batch") {
      sendToReader({ ...message, tabId: sender.tab.id });
    } else if (message.type === "catalog") {
      sendToReader({ ...message, tabId: sender.tab.id });
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId !== edgeTabId || changeInfo.status !== "complete") return;
    setTimeout(() => askTab(tabId, { type: "extract", prefetch: true }), 220);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === edgeTabId) edgeTabId = null;
  });

  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab?.id) return;
    edgeTabId = tab.id;
    await askTab(tab.id, { type: "extract", prefetch: true });
  });
})();
