(function () {
  "use strict";

  const SAMPLE_TEXT = `第一章 灯塔熄灭以前

海风从半开的窗缝里挤进来，把桌角那叠旧信吹得沙沙作响。林舟按住最上面的一封，抬头看见远处的灯塔正在雾里一明一暗。

镇上的人说，灯塔今晚会最后一次熄灭。明天清晨，新航标就会接替它工作，而守塔人也将离开住了四十年的礁石。

林舟把信装回帆布袋。邮戳上的日期停在十七年前，收件人的名字却被潮气洇成了模糊的一团。

他决定在灯灭以前，把这封迟到的信送到。

第二章 潮汐邮局

旧邮局藏在鱼市背后，门楣上蓝色的漆已经剥落。柜台后的老人戴着圆眼镜，听完来意后没有接信，只把一本厚厚的投递簿推了过来。

“没有地址的信，要等潮水指路。”老人说。

投递簿里记录着许多奇怪的去处：退潮后第三块黑色礁石、冬至才开门的杂货铺、只在凌晨靠岸的渡船。林舟翻到十七年前那一页，在褪色的墨迹中找到了同一个名字。

地址只有短短一行：北岬，白房子，等灯亮起。

第三章 雾中的白房子

通往北岬的小路早已被荒草盖住。雾沿着石阶向上漫，海浪的声音忽远忽近。林舟走了很久，终于看见一扇刷成绿色的木门。

开门的是一位头发银白的女人。她看见信封时先是沉默，随后侧身让出门口。

屋里没有电灯，窗台上却摆满了擦得透亮的玻璃瓶。每只瓶子里都装着一张卷起的纸条，像一座缩小的、不会熄灭的档案馆。

女人读完信，把它放进唯一空着的瓶子。远处的灯塔恰好扫过窗户，瓶身亮了一瞬。

第四章 第一班船

天快亮时，雾开始散了。女人提着一只旧皮箱，与林舟一同走下北岬。

码头上，第一班渡船发出低沉的汽笛。守塔人站在船头，朝岸边摘下帽子。相隔十七年的两个人没有呼喊，只在逐渐清晰的晨光里彼此挥了挥手。

灯塔没有再次亮起。新的航标在海面上规律地闪烁，冷静、准确，从不错过任何一艘船。

林舟回到邮局时，老人已经在门外挂上了新的木牌：今日无迟到的信。`;

  const selectors = {
    openFileButton: document.querySelector("#openFileButton"),
    edgeCaptureButton: document.querySelector("#edgeCaptureButton"),
    edgeStatusDot: document.querySelector("#edgeStatusDot"),
    edgeStatusLabel: document.querySelector("#edgeStatusLabel"),
    webDownloadButton: document.querySelector("#webDownloadButton"),
    fileInput: document.querySelector("#fileInput"),
    bookTitle: document.querySelector("#bookTitle"),
    chapterCount: document.querySelector("#chapterCount"),
    characterCount: document.querySelector("#characterCount"),
    encodingLabel: document.querySelector("#encodingLabel"),
    catalogTab: document.querySelector("#catalogTab"),
    searchTab: document.querySelector("#searchTab"),
    catalogPanel: document.querySelector("#catalogPanel"),
    searchPanel: document.querySelector("#searchPanel"),
    catalogProgress: document.querySelector("#catalogProgress"),
    chapterList: document.querySelector("#chapterList"),
    searchInput: document.querySelector("#searchInput"),
    searchStatus: document.querySelector("#searchStatus"),
    searchResults: document.querySelector("#searchResults"),
    currentChapterNumber: document.querySelector("#currentChapterNumber"),
    currentChapterTitle: document.querySelector("#currentChapterTitle"),
    previousButton: document.querySelector("#previousButton"),
    nextButton: document.querySelector("#nextButton"),
    footerPreviousButton: document.querySelector("#footerPreviousButton"),
    footerNextButton: document.querySelector("#footerNextButton"),
    previousChapterTitle: document.querySelector("#previousChapterTitle"),
    nextChapterTitle: document.querySelector("#nextChapterTitle"),
    readerViewport: document.querySelector("#readerViewport"),
    readerContent: document.querySelector("#readerContent"),
    chapterProgressBar: document.querySelector("#chapterProgressBar"),
    readingProgress: document.querySelector("#readingProgress"),
    currentPosition: document.querySelector("#currentPosition"),
    settingsButton: document.querySelector("#settingsButton"),
    settingsPopover: document.querySelector("#settingsPopover"),
    fontDecrease: document.querySelector("#fontDecrease"),
    fontIncrease: document.querySelector("#fontIncrease"),
    fontSizeOutput: document.querySelector("#fontSizeOutput"),
    lineHeightRange: document.querySelector("#lineHeightRange"),
    themeSwatches: document.querySelectorAll(".theme-swatch"),
    backgroundColorInput: document.querySelector("#backgroundColorInput"),
    sampleColorButton: document.querySelector("#sampleColorButton"),
    windowModeButtons: document.querySelectorAll("[data-window-mode]"),
    minimizeWindowButton: document.querySelector("#minimizeWindowButton"),
    maximizeWindowButton: document.querySelector("#maximizeWindowButton"),
    closeWindowButton: document.querySelector("#closeWindowButton"),
    openSidebarButton: document.querySelector("#openSidebarButton"),
    closeSidebarButton: document.querySelector("#closeSidebarButton"),
    sidebarScrim: document.querySelector("#sidebarScrim"),
    dropOverlay: document.querySelector("#dropOverlay"),
    downloadDialog: document.querySelector("#downloadDialog"),
    closeDownloadDialog: document.querySelector("#closeDownloadDialog"),
    downloadForm: document.querySelector("#downloadForm"),
    downloadFields: document.querySelector("#downloadFields"),
    novelUrl: document.querySelector("#novelUrl"),
    maxChapters: document.querySelector("#maxChapters"),
    rightsConfirmation: document.querySelector("#rightsConfirmation"),
    downloadProgressView: document.querySelector("#downloadProgressView"),
    downloadProgressTitle: document.querySelector("#downloadProgressTitle"),
    downloadProgressCount: document.querySelector("#downloadProgressCount"),
    downloadProgressTrack: document.querySelector(".download-progress-track"),
    downloadProgressBar: document.querySelector("#downloadProgressBar"),
    downloadProgressDetail: document.querySelector("#downloadProgressDetail"),
    cancelDownloadButton: document.querySelector("#cancelDownloadButton"),
    startDownloadButton: document.querySelector("#startDownloadButton"),
    toast: document.querySelector("#toast")
  };

  const state = {
    title: "夜航书简",
    text: "",
    chapters: [],
    currentChapter: 0,
    fingerprint: "sample-night-letters",
    encoding: "示例",
    activeQuery: "",
    filePath: null,
    pendingScrollRatio: 0,
    dragDepth: 0,
    saveTimer: null,
    searchTimer: null,
    toastTimer: null,
    downloadJobId: null,
    downloadCancelRequested: false,
    edgeMode: false,
    edge: {
      cache: {},
      order: [],
      currentUrl: "",
      directoryUrl: "",
      bookTitle: "",
      tabId: null
    },
    arrowKeys: { left: false, right: false, chordTriggered: false },
    arrowTimer: null
  };

  const preferences = loadPreferences();
  applyPreferences();
  bindEvents();
  if (window.desktopAPI?.onDownloadProgress) {
    window.desktopAPI.onDownloadProgress(updateDownloadProgress);
  }
  if (window.desktopAPI?.onEdgeMessage) {
    window.desktopAPI.onEdgeMessage(handleEdgeMessage);
  }
  initializeWindowMode();
  initializeEdgeBridge();
  restoreLastDesktopBook();

  function bindEvents() {
    selectors.openFileButton.addEventListener("click", () => {
      if (window.desktopAPI?.isDesktop) {
        openDesktopTextFile();
      } else {
        selectors.fileInput.click();
      }
    });
    selectors.edgeCaptureButton.addEventListener("click", requestEdgeCapture);
    selectors.fileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) openTextFile(file);
      event.target.value = "";
    });
    selectors.webDownloadButton.addEventListener("click", openDownloadDialog);
    selectors.downloadForm.addEventListener("submit", startWebDownload);
    selectors.cancelDownloadButton.addEventListener("click", requestDownloadDialogClose);
    selectors.closeDownloadDialog.addEventListener("click", requestDownloadDialogClose);
    selectors.downloadDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestDownloadDialogClose();
    });

    selectors.catalogTab.addEventListener("click", () => switchPanel("catalog"));
    selectors.searchTab.addEventListener("click", () => switchPanel("search"));
    selectors.previousButton.addEventListener("click", () => changeChapter(-1));
    selectors.nextButton.addEventListener("click", () => changeChapter(1));
    selectors.footerPreviousButton.addEventListener("click", () => changeChapter(-1));
    selectors.footerNextButton.addEventListener("click", () => changeChapter(1));
    selectors.readerViewport.addEventListener("scroll", onReaderScroll, { passive: true });
    window.addEventListener("beforeunload", () => {
      clearTimeout(state.saveTimer);
      saveCurrentProgress();
      saveEdgeSession();
    });

    selectors.searchInput.addEventListener("input", () => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => performSearch(selectors.searchInput.value), 120);
    });

    selectors.settingsButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = selectors.settingsPopover.hidden;
      selectors.settingsPopover.hidden = !willOpen;
      selectors.settingsButton.setAttribute("aria-expanded", String(willOpen));
    });
    selectors.settingsPopover.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => closeSettings());

    selectors.fontDecrease.addEventListener("click", () => setFontSize(preferences.fontSize - 1));
    selectors.fontIncrease.addEventListener("click", () => setFontSize(preferences.fontSize + 1));
    selectors.lineHeightRange.addEventListener("input", () => {
      preferences.lineHeight = Number(selectors.lineHeightRange.value);
      document.documentElement.style.setProperty("--line-height-reading", preferences.lineHeight);
      savePreferences();
    });
    selectors.themeSwatches.forEach((button) => {
      button.addEventListener("click", () => setTheme(button.dataset.themeValue));
    });
    selectors.backgroundColorInput.addEventListener("input", (event) => setBackgroundColor(event.target.value));
    selectors.sampleColorButton.addEventListener("click", sampleScreenColor);
    selectors.windowModeButtons.forEach((button) => {
      button.addEventListener("click", () => setWindowMode(button.dataset.windowMode));
    });
    selectors.minimizeWindowButton.addEventListener("click", () => window.desktopAPI?.minimizeWindow());
    selectors.maximizeWindowButton.addEventListener("click", () => window.desktopAPI?.toggleMaximizeWindow());
    selectors.closeWindowButton.addEventListener("click", () => window.desktopAPI?.closeWindow());

    selectors.openSidebarButton.addEventListener("click", openSidebar);
    selectors.closeSidebarButton.addEventListener("click", closeSidebar);
    selectors.sidebarScrim.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
      const typing = isTypingTarget(event.target || document.activeElement);
      if (event.key === "Escape") {
        closeSettings();
        closeSidebar();
      }
      if (!typing && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        handleArrowKeyDown(event.key === "ArrowLeft" ? "left" : "right");
      }
      if (!typing && (event.key === "f" || event.key === "F") && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        switchPanel("search");
        selectors.searchInput.focus();
        openSidebar();
      }
    });
    document.addEventListener("keyup", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        state.arrowKeys[event.key === "ArrowLeft" ? "left" : "right"] = false;
        if (!state.arrowKeys.left && !state.arrowKeys.right) state.arrowKeys.chordTriggered = false;
      }
    });
    window.addEventListener("blur", resetArrowKeys);

    document.addEventListener("dragenter", (event) => {
      event.preventDefault();
      state.dragDepth += 1;
      selectors.dropOverlay.classList.add("is-visible");
    });
    document.addEventListener("dragover", (event) => event.preventDefault());
    document.addEventListener("dragleave", (event) => {
      event.preventDefault();
      state.dragDepth = Math.max(0, state.dragDepth - 1);
      if (!state.dragDepth) selectors.dropOverlay.classList.remove("is-visible");
    });
    document.addEventListener("drop", (event) => {
      event.preventDefault();
      state.dragDepth = 0;
      selectors.dropOverlay.classList.remove("is-visible");
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) openTextFile(file);
    });
  }

  async function openTextFile(file) {
    if (!/\.txt$/i.test(file.name) && file.type !== "text/plain") {
      showToast("请选择 TXT 文本文件");
      return;
    }

    try {
      setFileButtonLoading(true);
      const buffer = await file.arrayBuffer();
      loadTextBuffer({
        buffer,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      });
    } catch (error) {
      console.error(error);
      showToast("文件读取失败，请确认文本格式后重试");
    } finally {
      setFileButtonLoading(false);
    }
  }

  async function openDesktopTextFile() {
    try {
      setFileButtonLoading(true);
      const book = await window.desktopAPI.openTextFile();
      if (!book) return;
      loadDesktopBook(book);
    } catch (error) {
      console.error(error);
      showToast("文件读取失败，请确认文本格式后重试");
    } finally {
      setFileButtonLoading(false);
    }
  }

  function openDownloadDialog() {
    if (!window.desktopAPI?.isDesktop || !window.desktopAPI?.downloadNovel) {
      showToast("网页下载功能请在 Windows 桌面版中使用");
      return;
    }
    if (!state.downloadJobId) resetDownloadDialog();
    if (!selectors.downloadDialog.open) selectors.downloadDialog.showModal();
    requestAnimationFrame(() => selectors.novelUrl.focus());
  }

  async function startWebDownload(event) {
    event.preventDefault();
    if (state.downloadJobId) return;
    if (!selectors.downloadForm.reportValidity()) return;

    const jobId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.downloadJobId = jobId;
    state.downloadCancelRequested = false;
    setDownloadRunning(true);
    updateDownloadProgress({
      jobId,
      phase: "catalog",
      current: 0,
      total: 0,
      message: "正在连接目录页"
    });

    let result;
    try {
      result = await window.desktopAPI.downloadNovel({
        jobId,
        url: selectors.novelUrl.value.trim(),
        maxChapters: Number(selectors.maxChapters.value),
        confirmedRights: selectors.rightsConfirmation.checked
      });
    } catch (error) {
      console.error(error);
      result = { ok: false, error: { message: "下载进程通信失败，请重试" } };
    }

    if (state.downloadJobId !== jobId) return;
    state.downloadJobId = null;

    if (result?.ok && result.book) {
      loadDesktopBook(result.book);
      selectors.downloadDialog.close();
      resetDownloadDialog();
      const skipped = result.failedCount ? `，${result.failedCount} 章未能提取` : "";
      showToast(`已保存并打开 ${result.chapterCount} 章${skipped}`);
      return;
    }

    if (result?.canceled || state.downloadCancelRequested) {
      selectors.downloadDialog.close();
      resetDownloadDialog();
      showToast("下载已取消");
      return;
    }

    setDownloadRunning(false);
    showToast(result?.error?.message || "下载失败，请检查网址后重试");
  }

  function updateDownloadProgress(progress) {
    if (!state.downloadJobId || progress?.jobId !== state.downloadJobId) return;
    const current = Number(progress.current) || 0;
    const total = Number(progress.total) || 0;
    let percentage = 3;
    if (progress.phase === "found") percentage = 6;
    if (progress.phase === "chapter" && total) percentage = 6 + (current / total) * 90;
    if (progress.phase === "saving") percentage = 100;
    percentage = clamp(percentage, 0, 100);

    selectors.downloadProgressBar.style.width = `${percentage.toFixed(1)}%`;
    selectors.downloadProgressTrack.setAttribute("aria-valuenow", String(Math.round(percentage)));
    selectors.downloadProgressTitle.textContent = progress.phase === "saving"
      ? "下载完成"
      : progress.phase === "found"
        ? `《${progress.title || "未命名小说"}》`
        : progress.phase === "catalog"
          ? "正在读取目录页"
          : (progress.title || "正在下载章节");
    selectors.downloadProgressCount.textContent = total ? `${current} / ${total}` : "准备中";
    selectors.downloadProgressDetail.textContent = progress.message || "正在处理网页内容";
  }

  function requestDownloadDialogClose() {
    if (!state.downloadJobId) {
      selectors.downloadDialog.close();
      resetDownloadDialog();
      return;
    }
    if (state.downloadCancelRequested) return;
    state.downloadCancelRequested = true;
    selectors.cancelDownloadButton.disabled = true;
    selectors.closeDownloadDialog.disabled = true;
    selectors.downloadProgressDetail.textContent = "正在取消下载…";
    window.desktopAPI.cancelDownload(state.downloadJobId).catch(() => undefined);
  }

  function setDownloadRunning(isRunning) {
    selectors.downloadFields.hidden = isRunning;
    selectors.downloadProgressView.hidden = !isRunning;
    selectors.startDownloadButton.hidden = isRunning;
    selectors.cancelDownloadButton.textContent = isRunning ? "取消下载" : "取消";
    selectors.cancelDownloadButton.disabled = false;
    selectors.closeDownloadDialog.disabled = false;
    if (!isRunning) {
      selectors.downloadProgressBar.style.width = "3%";
      selectors.downloadProgressTrack.setAttribute("aria-valuenow", "0");
    }
  }

  function resetDownloadDialog() {
    state.downloadCancelRequested = false;
    setDownloadRunning(false);
    selectors.downloadProgressTitle.textContent = "正在读取目录页";
    selectors.downloadProgressCount.textContent = "准备中";
    selectors.downloadProgressDetail.textContent = "正在连接网站…";
  }

  async function restoreLastDesktopBook() {
    if (!window.desktopAPI?.isDesktop) {
      loadBook(SAMPLE_TEXT, "夜航书简", "示例", state.fingerprint);
      return;
    }

    try {
      if (localStorage.getItem("pagebetween:active-source") === "edge" && restoreEdgeSession()) return;
    } catch (_error) {
      // Fall through to the last desktop text file.
    }

    try {
      const book = await window.desktopAPI.getLastTextFile();
      if (book?.missing) {
        loadBook(SAMPLE_TEXT, "夜航书简", "示例", state.fingerprint);
        showToast("上次阅读的文件已被移动或删除");
        return;
      }
      if (book) {
        loadDesktopBook(book);
        return;
      }
    } catch (error) {
      console.error(error);
    }

    if (restoreEdgeSession()) return;
    loadBook(SAMPLE_TEXT, "夜航书简", "示例", state.fingerprint);
  }

  function loadDesktopBook(book) {
    loadTextBuffer({
      buffer: toArrayBuffer(book.bytes),
      name: book.name,
      size: book.size,
      lastModified: book.lastModified,
      filePath: book.filePath,
      savedProgress: book.savedProgress
    });
  }

  function loadTextBuffer(source) {
    const decoded = decodeText(source.buffer);
    const title = source.name.replace(/\.txt$/i, "") || "未命名小说";
    const fingerprint = source.filePath
      ? `desktop:${source.filePath}:${source.size}:${source.lastModified}`
      : `${source.name}:${source.size}:${source.lastModified}`;
    loadBook(decoded.text, title, decoded.encoding, fingerprint, {
      filePath: source.filePath || null,
      savedProgress: source.savedProgress || null
    });
    try {
      localStorage.setItem("pagebetween:active-source", "txt");
    } catch (_error) {
      // Optional session marker.
    }
    showToast(`已打开《${title}》`);
  }

  function toArrayBuffer(bytes) {
    const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return byteArray.buffer.slice(byteArray.byteOffset, byteArray.byteOffset + byteArray.byteLength);
  }

  function setFileButtonLoading(isLoading) {
    selectors.openFileButton.disabled = isLoading;
    selectors.openFileButton.lastChild.textContent = isLoading ? " 读取中" : " 打开 TXT";
  }

  function decodeText(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return { text: new TextDecoder("utf-16le").decode(buffer), encoding: "UTF-16 LE" };
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return { text: new TextDecoder("utf-16be").decode(buffer), encoding: "UTF-16 BE" };
    }
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      return { text, encoding: "UTF-8" };
    } catch (_error) {
      try {
        return { text: new TextDecoder("gb18030").decode(buffer), encoding: "GB18030" };
      } catch (_fallbackError) {
        return { text: new TextDecoder().decode(buffer), encoding: "文本" };
      }
    }
  }

  function loadBook(rawText, title, encoding, fingerprint, options = {}) {
    const cleanText = rawText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
    state.title = title;
    state.text = cleanText;
    state.edgeMode = Array.isArray(options.edgeChapters);
    state.chapters = state.edgeMode
      ? options.edgeChapters.map((chapter) => ({
        ...chapter,
        preview: chapter.preview || makePreview(chapter.content),
        start: 0
      }))
      : parseChapters(cleanText);
    state.encoding = encoding;
    state.fingerprint = fingerprint;
    state.filePath = options.filePath || null;
    state.activeQuery = "";
    selectors.searchInput.value = "";
    selectors.searchResults.replaceChildren();
    selectors.searchStatus.textContent = "输入关键词开始搜索";

    const saved = options.savedProgress || loadProgress(fingerprint);
    const requestedChapter = Number.isFinite(options.edgeIndex) ? options.edgeIndex : (saved.chapter || 0);
    state.currentChapter = clamp(requestedChapter, 0, Math.max(0, state.chapters.length - 1));
    state.pendingScrollRatio = saved.ratio || 0;

    selectors.bookTitle.textContent = title;
    selectors.bookTitle.title = title;
    selectors.chapterCount.textContent = `${state.chapters.length} 章`;
    selectors.characterCount.textContent = `${formatNumber(countCharacters(cleanText))} 字`;
    selectors.encodingLabel.textContent = encoding;
    document.title = `${title} · 页间`;

    renderCatalog();
    renderChapter({ restoreScroll: true });
  }

  function initializeEdgeBridge() {
    if (!window.desktopAPI?.isDesktop || !window.desktopAPI?.edgeStatus) return;
    window.desktopAPI.edgeStatus().then((status) => updateEdgeStatus(status?.connected)).catch(() => updateEdgeStatus(false));
  }

  function updateEdgeStatus(connected) {
    selectors.edgeStatusDot.classList.toggle("is-connected", Boolean(connected));
    selectors.edgeStatusLabel.textContent = connected ? "Edge 已连接" : "Edge 未连接";
  }

  function requestEdgeCapture() {
    if (!window.desktopAPI?.edgeCommand) {
      showToast("Edge 桥接只在 Windows 桌面版中可用");
      return;
    }
    state.edgeMode = false;
    state.edge.cache = {};
    state.edge.order = [];
    state.edge.currentUrl = "";
    state.edge.directoryUrl = "";
    window.desktopAPI.edgeCommand({ type: "capture" }).then((result) => {
      if (!result?.ok) showToast("未找到 Edge 连接，请先按扩展说明启动 Edge");
    }).catch(() => showToast("Edge 桥接通信失败"));
  }

  function handleEdgeMessage(message) {
    if (!message || typeof message !== "object") return;
    if (message.type === "status") {
      updateEdgeStatus(message.connected);
      return;
    }
    if (message.type === "chapter-batch") {
      loadEdgeChapterBatch(message);
      return;
    }
    if (message.type === "catalog") {
      loadEdgeCatalog(message);
    }
  }

  function loadEdgeChapterBatch(message) {
    const incoming = Array.isArray(message.chapters) ? message.chapters : [];
    if (!incoming.length) {
      showToast("当前 Edge 页面没有识别到正文");
      return;
    }
    state.edgeMode = true;
    try {
      localStorage.setItem("pagebetween:active-source", "edge");
    } catch (_error) {
      // Optional session marker.
    }
    state.edge.tabId = message.tabId || state.edge.tabId;
    state.edge.currentUrl = String(message.currentUrl || incoming[0].sourceUrl || "");
    state.edge.directoryUrl = String(incoming[0].directoryUrl || state.edge.directoryUrl || "");
    state.edge.bookTitle = String(incoming[0].bookTitle || state.edge.bookTitle || "Edge 网页小说");

    incoming.forEach((chapter) => {
      if (!chapter?.sourceUrl || !chapter.content) return;
      const existingIndex = state.edge.order.indexOf(chapter.sourceUrl);
      const normalized = {
        title: chapter.title || "正文",
        content: chapter.content,
        sourceUrl: chapter.sourceUrl,
        directoryUrl: chapter.directoryUrl || state.edge.directoryUrl,
        bookTitle: chapter.bookTitle || state.edge.bookTitle,
        previous: chapter.previous || null,
        next: chapter.next || null
      };
      state.edge.cache[chapter.sourceUrl] = normalized;
      if (existingIndex === -1) state.edge.order.push(chapter.sourceUrl);
    });

    const current = state.edge.cache[state.edge.currentUrl] || incoming[0];
    const ordered = orderEdgeChapters(state.edge.currentUrl);
    const currentIndex = Math.max(0, ordered.findIndex((chapter) => chapter.sourceUrl === current.sourceUrl));
    state.edge.order = ordered.map((chapter) => chapter.sourceUrl);
    state.edge.currentUrl = current.sourceUrl;
    loadBook(
      ordered.map((chapter) => `${chapter.title}\n\n${chapter.content}`).join("\n\n\n"),
      current.bookTitle || state.edge.bookTitle,
      "Edge 网页",
      `edge:${current.sourceUrl}`,
      { edgeChapters: ordered, edgeIndex: currentIndex }
    );
    state.currentChapter = currentIndex;
    renderChapter({ restoreScroll: false });
    saveEdgeSession();
    showToast(`已读取《${current.bookTitle || state.edge.bookTitle}》，已缓存 ${Math.max(0, incoming.length - 1)} 章`);
  }

  function orderEdgeChapters(currentUrl) {
    const cache = state.edge.cache;
    const chain = [];
    const seen = new Set();
    const backward = [];
    let cursor = currentUrl;
    while (cursor && cache[cursor] && !seen.has(cursor)) {
      seen.add(cursor);
      backward.push(cursor);
      cursor = cache[cursor].previous?.url || "";
    }
    backward.reverse().forEach((url) => chain.push(cache[url]));
    cursor = cache[currentUrl] ? currentUrl : "";
    while (cursor && cache[cursor]?.next?.url && cache[cache[cursor].next.url] && !seen.has(cache[cursor].next.url)) {
      cursor = cache[cursor].next.url;
      seen.add(cursor);
      chain.push(cache[cursor]);
    }
    state.edge.order.forEach((url) => {
      if (!seen.has(url) && cache[url]) {
        seen.add(url);
        chain.push(cache[url]);
      }
    });
    return chain;
  }

  function loadEdgeCatalog(message) {
    const chapters = Array.isArray(message.chapters) ? message.chapters : [];
    if (!chapters.length) {
      showToast("没有识别到目录章节");
      return;
    }
    state.edgeMode = true;
    try {
      localStorage.setItem("pagebetween:active-source", "edge");
    } catch (_error) {
      // Optional session marker.
    }
    state.edge.currentUrl = String(message.url || "");
    state.edge.directoryUrl = String(message.url || "");
    state.edge.bookTitle = String(message.title || "Edge 网页小说");
    state.edge.cache = {};
    state.edge.order = chapters.map((chapter) => chapter.url).filter(Boolean);
    state.title = state.edge.bookTitle;
    state.filePath = null;
    state.encoding = "网页桥接";
    state.fingerprint = `edge:${state.edge.directoryUrl || state.edge.currentUrl}`;
    state.chapters = chapters.map((chapter) => ({
      title: chapter.title || "正文",
      content: "正在从 Edge 读取正文…",
      preview: "点击或使用右箭头读取本章",
      sourceUrl: chapter.url,
      edgeOnly: true,
      start: 0
    }));
    selectors.bookTitle.textContent = state.title;
    selectors.chapterCount.textContent = `${state.chapters.length} 章`;
    selectors.characterCount.textContent = "Edge 目录";
    selectors.encodingLabel.textContent = "网页桥接";
    renderCatalog();
    state.currentChapter = 0;
    renderChapter({ restoreScroll: false });
    showToast(`已读取目录，共 ${state.chapters.length} 章`);
  }

  function restoreEdgeSession() {
    try {
      const saved = JSON.parse(localStorage.getItem("pagebetween:edge-session"));
      if (!saved?.chapters?.length) return false;
      loadEdgeChapterBatch({ currentUrl: saved.currentUrl, chapters: saved.chapters });
      return true;
    } catch (_error) {
      return false;
    }
  }

  function saveEdgeSession() {
    if (!state.edgeMode || !state.edge.order.length) return;
    const chapters = state.edge.order.map((url) => state.edge.cache[url]).filter(Boolean).slice(-20);
    try {
      localStorage.setItem("pagebetween:edge-session", JSON.stringify({
        currentUrl: state.edge.currentUrl,
        chapters,
        savedAt: Date.now()
      }));
    } catch (_error) {
      // Cache is optional and can be discarded when storage is unavailable.
    }
  }

  function parseChapters(text) {
    const headingPattern = /^[ \t]{0,8}(?:第[〇零一二三四五六七八九十百千万两\d]{1,14}[卷章节回篇部集幕][ \t]*[^\n]{0,48}|序章[ \t]*[^\n]{0,48}|序言[ \t]*[^\n]{0,48}|前言[ \t]*[^\n]{0,48}|楔子[ \t]*[^\n]{0,48}|引子[ \t]*[^\n]{0,48}|终章[ \t]*[^\n]{0,48}|尾声[ \t]*[^\n]{0,48}|后记[ \t]*[^\n]{0,48}|番外(?:[一二三四五六七八九十\d]*)[ \t]*[^\n]{0,48})[ \t]*$/gmu;
    const matches = Array.from(text.matchAll(headingPattern));

    if (!matches.length) {
      return [{ title: "全文", content: text, preview: makePreview(text), start: 0 }];
    }

    const chapters = [];
    const firstIndex = matches[0].index || 0;
    const preface = text.slice(0, firstIndex).trim();
    if (preface.length > 20) {
      chapters.push({ title: "卷首", content: preface, preview: makePreview(preface), start: 0 });
    }

    matches.forEach((match, index) => {
      const title = match[0].trim();
      const contentStart = (match.index || 0) + match[0].length;
      const contentEnd = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const content = text.slice(contentStart, contentEnd).trim();
      chapters.push({ title, content, preview: makePreview(content), start: match.index || 0 });
    });

    return chapters;
  }

  function makePreview(content) {
    const preview = content.replace(/\s+/g, " ").trim();
    if (!preview) return "本章暂无正文";
    return preview.length > 70 ? `${preview.slice(0, 70)}…` : preview;
  }

  function renderCatalog() {
    const fragment = document.createDocumentFragment();
    state.chapters.forEach((chapter, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chapter-item";
      button.dataset.chapterIndex = String(index);
      button.setAttribute("aria-label", `跳转到 ${chapter.title}`);

      const number = document.createElement("span");
      number.className = "chapter-index";
      number.textContent = String(index + 1).padStart(2, "0");

      const copy = document.createElement("span");
      copy.className = "chapter-copy";
      const title = document.createElement("strong");
      title.textContent = chapter.title;
      const preview = document.createElement("span");
      preview.className = "chapter-preview";
      preview.textContent = chapter.preview;
      copy.append(title, preview);
      button.append(number, copy);
      button.addEventListener("click", () => {
        if (chapter.edgeOnly && chapter.sourceUrl) {
          requestEdgeNavigation(chapter.sourceUrl, chapter.title);
          closeSidebar();
          return;
        }
        selectChapter(index);
        closeSidebar();
      });
      fragment.append(button);
    });
    selectors.chapterList.replaceChildren(fragment);
  }

  function renderChapter(options = {}) {
    const chapter = state.chapters[state.currentChapter];
    if (!chapter) return;
    const preservedScrollTop = options.preserveScroll ? selectors.readerViewport.scrollTop : null;

    const fragment = document.createDocumentFragment();
    const kicker = document.createElement("div");
    kicker.className = "chapter-kicker";
    kicker.textContent = chapterOrdinal(state.currentChapter);
    const heading = document.createElement("h2");
    heading.textContent = chapter.title;
    fragment.append(kicker, heading);

    const paragraphs = chapter.content.split(/\n\s*\n|\n+/).map((line) => line.trim()).filter(Boolean);
    if (!paragraphs.length) paragraphs.push("本章暂无正文");
    paragraphs.forEach((paragraph) => {
      const element = document.createElement("p");
      appendHighlightedText(element, paragraph, state.activeQuery);
      fragment.append(element);
    });
    selectors.readerContent.replaceChildren(fragment);

    selectors.currentChapterNumber.textContent = chapterOrdinal(state.currentChapter);
    selectors.currentChapterTitle.textContent = chapter.title;
    selectors.currentChapterTitle.title = chapter.title;
    selectors.currentPosition.textContent = `第 ${state.currentChapter + 1} / ${state.chapters.length} 章`;
    selectors.catalogProgress.textContent = `${state.currentChapter + 1} / ${state.chapters.length}`;

    const edgeCurrent = state.edgeMode ? state.edge.cache[chapter.sourceUrl || state.edge.currentUrl] : null;
    const previous = state.chapters[state.currentChapter - 1] || (edgeCurrent?.previous && {
      title: edgeCurrent.previous.title,
      sourceUrl: edgeCurrent.previous.url,
      edgeOnly: true,
      content: ""
    });
    const next = state.chapters[state.currentChapter + 1] || (edgeCurrent?.next && {
      title: edgeCurrent.next.title,
      sourceUrl: edgeCurrent.next.url,
      edgeOnly: true,
      content: ""
    });
    selectors.previousButton.disabled = !previous;
    selectors.footerPreviousButton.disabled = !previous;
    selectors.nextButton.disabled = !next;
    selectors.footerNextButton.disabled = !next;
    selectors.previousChapterTitle.textContent = previous ? previous.title : "已经是开头";
    selectors.nextChapterTitle.textContent = next ? next.title : "已经是结尾";

    updateActiveCatalogItem();

    requestAnimationFrame(() => {
      if (options.restoreScroll && state.pendingScrollRatio) {
        const maxScroll = Math.max(0, selectors.readerViewport.scrollHeight - selectors.readerViewport.clientHeight);
        selectors.readerViewport.scrollTop = maxScroll * state.pendingScrollRatio;
        state.pendingScrollRatio = 0;
      } else if (options.preserveScroll && preservedScrollTop !== null) {
        selectors.readerViewport.scrollTop = preservedScrollTop;
      } else if (options.focusMatch && state.activeQuery) {
        const mark = selectors.readerContent.querySelector("mark");
        if (mark) mark.scrollIntoView({ block: "center", behavior: "smooth" });
        else selectors.readerViewport.scrollTop = 0;
      } else {
        selectors.readerViewport.scrollTop = 0;
      }
      updateReadingProgress();
    });
  }

  function appendHighlightedText(element, text, query) {
    if (!query) {
      element.textContent = text;
      return;
    }
    const lowerText = text.toLocaleLowerCase();
    const lowerQuery = query.toLocaleLowerCase();
    let cursor = 0;
    let matchIndex = lowerText.indexOf(lowerQuery);
    while (matchIndex !== -1) {
      if (matchIndex > cursor) element.append(document.createTextNode(text.slice(cursor, matchIndex)));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(matchIndex, matchIndex + query.length);
      element.append(mark);
      cursor = matchIndex + query.length;
      matchIndex = lowerText.indexOf(lowerQuery, cursor);
    }
    if (cursor < text.length) element.append(document.createTextNode(text.slice(cursor)));
  }

  function selectChapter(index, options = {}) {
    const safeIndex = clamp(index, 0, state.chapters.length - 1);
    if (safeIndex === state.currentChapter && !options.force) return;
    saveCurrentProgress();
    state.currentChapter = safeIndex;
    renderChapter({ focusMatch: Boolean(options.focusMatch) });
    saveCurrentProgress();
  }

  function changeChapter(direction) {
    const target = state.currentChapter + direction;
    if (state.edgeMode) {
      const targetChapter = state.chapters[target];
      if (targetChapter?.edgeOnly && targetChapter.sourceUrl) {
        requestEdgeNavigation(targetChapter.sourceUrl, targetChapter.title);
        return;
      }
      if (targetChapter?.content && !targetChapter.edgeOnly) {
        state.activeQuery = "";
        selectChapter(target);
        const cached = state.edge.cache[targetChapter.sourceUrl];
        if (cached) state.edge.currentUrl = cached.sourceUrl;
        saveEdgeSession();
        return;
      }
      const current = state.edge.cache[state.edge.currentUrl] || state.edge.cache[state.chapters[state.currentChapter]?.sourceUrl];
      const link = direction > 0 ? current?.next : current?.previous;
      if (link?.url) {
        requestEdgeNavigation(link.url, link.title);
        return;
      }
    }
    if (target < 0 || target >= state.chapters.length) return;
    state.activeQuery = "";
    selectChapter(target);
  }

  function requestEdgeNavigation(url, title = "") {
    if (!window.desktopAPI?.edgeCommand) return;
    state.edge.currentUrl = url;
    window.desktopAPI.edgeCommand({ type: "navigate", url }).then((result) => {
      if (!result?.ok) showToast("Edge 未连接，无法切换章节");
      else if (title) showToast(`正在读取${title}`);
    }).catch(() => showToast("Edge 桥接通信失败"));
  }

  function requestEdgeDirectory() {
    if (!state.edgeMode) {
      switchPanel("catalog");
      openSidebar();
      return;
    }
    if (!window.desktopAPI?.edgeCommand) return;
    const directoryUrl = state.edge.directoryUrl;
    window.desktopAPI.edgeCommand({ type: directoryUrl ? "navigate" : "directory", url: directoryUrl }).then((result) => {
      if (!result?.ok) showToast("未找到目录页链接");
    }).catch(() => showToast("Edge 桥接通信失败"));
  }

  function handleArrowKeyDown(side) {
    if (state.arrowKeys[side]) return;
    state.arrowKeys[side] = true;
    if (state.arrowKeys.left && state.arrowKeys.right && !state.arrowKeys.chordTriggered) {
      state.arrowKeys.chordTriggered = true;
      clearTimeout(state.arrowTimer);
      requestEdgeDirectory();
      return;
    }
    clearTimeout(state.arrowTimer);
    state.arrowTimer = setTimeout(() => {
      if (!state.arrowKeys.left && !state.arrowKeys.right) return;
      if (state.arrowKeys.left && !state.arrowKeys.right) changeChapter(-1);
      if (state.arrowKeys.right && !state.arrowKeys.left) changeChapter(1);
    }, 240);
  }

  function resetArrowKeys() {
    state.arrowKeys.left = false;
    state.arrowKeys.right = false;
    state.arrowKeys.chordTriggered = false;
    clearTimeout(state.arrowTimer);
  }

  function updateActiveCatalogItem() {
    selectors.chapterList.querySelectorAll(".chapter-item").forEach((item, index) => {
      const isActive = index === state.currentChapter;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
      if (isActive) item.scrollIntoView({ block: "nearest" });
    });
  }

  function performSearch(rawQuery) {
    const query = rawQuery.trim();
    state.activeQuery = query;
    selectors.searchResults.replaceChildren();

    if (!query) {
      selectors.searchStatus.textContent = "输入关键词开始搜索";
      renderChapter({ restoreScroll: true });
      return;
    }

    const results = [];
    const lowerQuery = query.toLocaleLowerCase();
    state.chapters.some((chapter, chapterIndex) => {
      const haystack = chapter.content.toLocaleLowerCase();
      let from = 0;
      let countInChapter = 0;
      while (results.length < 200 && countInChapter < 8) {
        const found = haystack.indexOf(lowerQuery, from);
        if (found === -1) break;
        results.push({ chapterIndex, position: found, context: createContext(chapter.content, found, query.length) });
        from = found + Math.max(1, query.length);
        countInChapter += 1;
      }
      return results.length >= 200;
    });

    selectors.searchStatus.textContent = results.length >= 200 ? "找到 200+ 处结果" : `找到 ${results.length} 处结果`;
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "empty-results";
      empty.textContent = "没有找到相关内容";
      selectors.searchResults.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach((result) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      const title = document.createElement("strong");
      title.textContent = state.chapters[result.chapterIndex].title;
      const context = document.createElement("p");
      appendHighlightedText(context, result.context, query);
      button.append(title, context);
      button.addEventListener("click", () => {
        state.activeQuery = query;
        selectChapter(result.chapterIndex, { focusMatch: true, force: true });
        closeSidebar();
      });
      fragment.append(button);
    });
    selectors.searchResults.append(fragment);
  }

  function createContext(text, index, length) {
    const radius = 42;
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + length + radius);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < text.length ? "…" : "";
    return `${prefix}${text.slice(start, end).replace(/\s+/g, " ")}${suffix}`;
  }

  function switchPanel(panel) {
    const showCatalog = panel === "catalog";
    selectors.catalogTab.classList.toggle("is-active", showCatalog);
    selectors.searchTab.classList.toggle("is-active", !showCatalog);
    selectors.catalogTab.setAttribute("aria-selected", String(showCatalog));
    selectors.searchTab.setAttribute("aria-selected", String(!showCatalog));
    selectors.catalogPanel.hidden = !showCatalog;
    selectors.searchPanel.hidden = showCatalog;
    selectors.catalogPanel.classList.toggle("is-active", showCatalog);
    selectors.searchPanel.classList.toggle("is-active", !showCatalog);
    if (!showCatalog) requestAnimationFrame(() => selectors.searchInput.focus());
  }

  function onReaderScroll() {
    updateReadingProgress();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveCurrentProgress, 200);
  }

  function updateReadingProgress() {
    const maxScroll = Math.max(0, selectors.readerViewport.scrollHeight - selectors.readerViewport.clientHeight);
    const chapterRatio = maxScroll ? selectors.readerViewport.scrollTop / maxScroll : 1;
    const overall = ((state.currentChapter + chapterRatio) / state.chapters.length) * 100;
    selectors.chapterProgressBar.style.width = `${clamp(chapterRatio * 100, 0, 100).toFixed(1)}%`;
    selectors.readingProgress.textContent = `全书 ${Math.round(clamp(overall, 0, 100))}%`;
  }

  function saveCurrentProgress() {
    if (!state.fingerprint || !state.chapters.length) return;
    const maxScroll = Math.max(0, selectors.readerViewport.scrollHeight - selectors.readerViewport.clientHeight);
    const ratio = maxScroll ? selectors.readerViewport.scrollTop / maxScroll : 0;
    const progress = {
        chapter: state.currentChapter,
        ratio,
        updatedAt: Date.now()
    };
    try {
      localStorage.setItem(`pagebetween:progress:${state.fingerprint}`, JSON.stringify(progress));
    } catch (_error) {
      // Reading continues normally when local storage is unavailable.
    }
    if (state.filePath && window.desktopAPI?.isDesktop) {
      window.desktopAPI.saveProgress({ ...progress, filePath: state.filePath }).catch(() => undefined);
    }
  }

  function loadProgress(fingerprint) {
    try {
      return JSON.parse(localStorage.getItem(`pagebetween:progress:${fingerprint}`)) || {};
    } catch (_error) {
      return {};
    }
  }

  function loadPreferences() {
    const defaults = { fontSize: 18, lineHeight: 1.8, theme: "paper", customBackground: "#f7f2e7", layoutVersion: 3 };
    try {
      const saved = JSON.parse(localStorage.getItem("pagebetween:preferences"));
      if (!saved?.layoutVersion || saved.layoutVersion < defaults.layoutVersion) {
        return { ...defaults, theme: saved?.theme || defaults.theme, customBackground: saved?.customBackground || defaults.customBackground };
      }
      return { ...defaults, ...saved };
    } catch (_error) {
      return defaults;
    }
  }

  function applyPreferences() {
    setFontSize(preferences.fontSize, false);
    preferences.lineHeight = clamp(Number(preferences.lineHeight) || 1.8, 1.6, 2.4);
    selectors.lineHeightRange.value = String(preferences.lineHeight);
    document.documentElement.style.setProperty("--line-height-reading", preferences.lineHeight);
    setTheme(preferences.theme, false);
    setBackgroundColor(preferences.customBackground || "#f7f2e7", false);
  }

  function setFontSize(value, persist = true) {
    preferences.fontSize = clamp(Number(value) || 18, 15, 30);
    selectors.fontSizeOutput.value = String(preferences.fontSize);
    selectors.fontSizeOutput.textContent = String(preferences.fontSize);
    document.documentElement.style.setProperty("--font-size-reading", `${preferences.fontSize}px`);
    if (persist) savePreferences();
  }

  function setTheme(theme, persist = true) {
    const validTheme = ["paper", "white", "night", "custom"].includes(theme) ? theme : "paper";
    preferences.theme = validTheme;
    document.body.dataset.theme = validTheme;
    if (validTheme !== "custom") clearCustomBackgroundStyles();
    selectors.themeSwatches.forEach((swatch) => swatch.classList.toggle("is-active", swatch.dataset.themeValue === validTheme));
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = validTheme === "night" ? "#222425" : validTheme === "white" ? "#ffffff" : validTheme === "custom" ? preferences.customBackground : "#f3f1eb";
    if (persist) savePreferences();
  }

  function setBackgroundColor(value, persist = true) {
    const color = normalizeHexColor(value) || "#f7f2e7";
    preferences.customBackground = color;
    if (persist) preferences.theme = "custom";
    selectors.backgroundColorInput.value = color;
    if (preferences.theme === "custom") {
      const foreground = readableTextColor(color);
      const deep = adjustColor(color, foreground === "#fff" ? 10 : -10);
      const chrome = adjustColor(color, foreground === "#fff" ? -8 : 8);
      document.body.dataset.theme = "custom";
      document.body.style.colorScheme = foreground === "#fff" ? "dark" : "light";
      document.body.style.setProperty("--paper", color);
      document.body.style.setProperty("--paper-deep", deep);
      document.body.style.setProperty("--surface", color);
      document.body.style.setProperty("--chrome", chrome);
      document.body.style.setProperty("--text", foreground);
      document.body.style.setProperty("--text-soft", foreground === "#fff" ? "#d1cec5" : "#68645d");
      document.body.style.setProperty("--muted", foreground === "#fff" ? "#a8a49a" : "#918b80");
      document.body.style.setProperty("--line", foreground === "#fff" ? "#ffffff2b" : "#0000001c");
      document.body.style.setProperty("--line-strong", foreground === "#fff" ? "#ffffff42" : "#0000002e");
      document.body.style.setProperty("--custom-paper", color);
    }
    if (persist) {
      setTheme("custom", false);
      savePreferences();
    }
  }

  function clearCustomBackgroundStyles() {
    ["--paper", "--paper-deep", "--surface", "--chrome", "--text", "--text-soft", "--muted", "--line", "--line-strong", "--custom-paper"].forEach((property) => {
      document.body.style.removeProperty(property);
    });
    document.body.style.removeProperty("color-scheme");
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(raw)) return `#${raw.slice(1).split("").map((part) => part + part).join("")}`.toLowerCase();
    return "";
  }

  function readableTextColor(hex) {
    const value = hex.slice(1);
    const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? "#292824" : "#fff";
  }

  function adjustColor(hex, amount) {
    const value = hex.slice(1);
    const channels = [0, 2, 4].map((index) => clamp(Number.parseInt(value.slice(index, index + 2), 16) + amount, 0, 255));
    return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
  }

  async function sampleScreenColor() {
    if (!window.desktopAPI?.captureScreen) {
      showToast("屏幕取色只在 Windows 桌面版中可用");
      return;
    }
    let sources;
    try {
      sources = await window.desktopAPI.captureScreen();
    } catch (_error) {
      showToast("无法读取屏幕画面");
      return;
    }
    if (!sources?.length) {
      showToast("没有可取色的屏幕");
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "screen-picker-overlay";
    const panel = document.createElement("div");
    panel.className = "screen-picker-panel";
    const heading = document.createElement("strong");
    heading.textContent = "点击其他窗口中的颜色，按 Esc 取消";
    panel.append(heading);
    sources.forEach((source) => {
      const image = document.createElement("img");
      image.src = source.dataUrl;
      image.alt = source.name || "屏幕";
      image.className = "screen-picker-image";
      image.addEventListener("click", (event) => {
        const rect = image.getBoundingClientRect();
        const canvas = document.createElement("canvas");
        canvas.width = source.width;
        canvas.height = source.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, source.width, source.height);
        const x = clamp(Math.floor((event.clientX - rect.left) / rect.width * source.width), 0, source.width - 1);
        const y = clamp(Math.floor((event.clientY - rect.top) / rect.height * source.height), 0, source.height - 1);
        const pixel = context.getImageData(x, y, 1, 1).data;
        const color = `#${[pixel[0], pixel[1], pixel[2]].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
        overlay.remove();
        document.removeEventListener("keydown", cancel);
        setBackgroundColor(color);
        showToast(`已取色 ${color}`);
      });
      panel.append(image);
    });
    overlay.append(panel);
    document.body.append(overlay);
    const cancel = (event) => {
      if (event.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", cancel);
      }
    };
    document.addEventListener("keydown", cancel);
  }

  async function initializeWindowMode() {
    if (!window.desktopAPI?.getWindowMode) return;
    const mode = await window.desktopAPI.getWindowMode().catch(() => "windowed");
    document.body.dataset.windowMode = mode === "frameless" ? "frameless" : "windowed";
    selectors.windowModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.windowMode === document.body.dataset.windowMode));
  }

  async function setWindowMode(mode) {
    const normalized = mode === "frameless" ? "frameless" : "windowed";
    if (!window.desktopAPI?.setWindowMode) return;
    document.body.dataset.windowMode = normalized;
    selectors.windowModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.windowMode === normalized));
    await window.desktopAPI.setWindowMode(normalized).catch(() => showToast("窗口模式切换失败"));
  }

  function isTypingTarget(target) {
    return Boolean(target && (target.matches?.("input, textarea, select, [contenteditable=true]") || target.closest?.("input, textarea, select, [contenteditable=true]")));
  }

  function savePreferences() {
    try {
      localStorage.setItem("pagebetween:preferences", JSON.stringify(preferences));
    } catch (_error) {
      // Preferences are optional.
    }
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function closeSettings() {
    selectors.settingsPopover.hidden = true;
    selectors.settingsButton.setAttribute("aria-expanded", "false");
  }

  function showToast(message) {
    clearTimeout(state.toastTimer);
    selectors.toast.textContent = message;
    selectors.toast.classList.add("is-visible");
    state.toastTimer = setTimeout(() => selectors.toast.classList.remove("is-visible"), 2600);
  }

  function chapterOrdinal(index) {
    return `第 ${index + 1} 章`;
  }

  function countCharacters(text) {
    return text.replace(/\s/g, "").length;
  }

  function formatNumber(number) {
    return new Intl.NumberFormat("zh-CN").format(number);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }
})();
