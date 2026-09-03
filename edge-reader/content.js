(function () {
  "use strict";

  const NAVIGATION_LINE = /^(?:上一章|下一章|返回目录|加入书签|收藏本章|章节报错|手机阅读|请记住本站|最新网址|未完待续|本章完)$/i;
  const REMOVE_SELECTORS = "script,style,noscript,template,iframe,svg,form,button,nav,footer,header,aside,.ads,.ad,.advertisement,.recommend,.related,.comment,.toolbar,.share";

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "extract") extractAndSend(message.prefetch !== false);
    if (message?.type === "navigate" && message.url) window.location.assign(message.url);
    if (message?.type === "find-directory") navigateToDirectory();
  });

  async function extractAndSend(prefetch) {
    const current = extractChapter(document, location.href);
    if (!current.content || current.content.length < 40) {
      sendCatalog();
      return;
    }
    const chapters = prefetch ? await prefetchNext(current, 2) : [current];
    chrome.runtime.sendMessage({ type: "chapter-batch", currentUrl: current.sourceUrl, chapters });
  }

  function extractChapter(doc, sourceUrl) {
    sourceUrl = stripHash(sourceUrl);
    const title = extractTitle(doc);
    const candidates = [];
    const selectors = [
      "#chaptercontent", "#chapter-content", "#content", "#BookText",
      ".chapter-content", ".chapter_content", ".read-content", ".reading-content",
      ".article-content", ".article_content", ".entry-content", ".content",
      "article", "main"
    ];
    const visited = new Set();
    selectors.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((element) => {
        if (visited.has(element)) return;
        visited.add(element);
        const clone = element.cloneNode(true);
        clone.querySelectorAll(REMOVE_SELECTORS).forEach((node) => node.remove());
        const content = cleanContent(nodeToText(clone));
        if (content.length < 40) return;
        const identity = `${element.id || ""} ${element.className || ""} ${element.tagName || ""}`.toLowerCase();
        let score = Math.min(content.length, 30000) + element.querySelectorAll("p").length * 90 + element.querySelectorAll("br").length * 25;
        if (/chapter|article|read|content|text|正文/.test(identity)) score += 1500;
        if (/main|article/.test(element.tagName || "")) score += 500;
        candidates.push({ content, score });
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    const next = findNavLink(doc, "next", sourceUrl);
    const previous = findNavLink(doc, "previous", sourceUrl);
    const directory = findDirectoryLink(doc, sourceUrl);
    return {
      title,
      content: candidates[0]?.content || "",
      sourceUrl,
      bookTitle: extractBookTitle(doc),
      directoryUrl: directory?.url || "",
      previous,
      next
    };
  }

  async function prefetchNext(first, limit) {
    const chapters = [first];
    const seen = new Set([first.sourceUrl]);
    let cursor = first;
    for (let index = 0; index < limit; index += 1) {
      const target = cursor.next?.url;
      if (!target || seen.has(target)) break;
      try {
        const response = await fetch(target, { credentials: "include", cache: "force-cache" });
        if (!response.ok) break;
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        const chapter = extractChapter(parsed, target);
        if (!chapter.content || chapter.content.length < 40) break;
        chapters.push(chapter);
        seen.add(target);
        cursor = chapter;
      } catch (_error) {
        break;
      }
    }
    return chapters;
  }

  function findNavLink(doc, direction, baseUrl) {
    const isNext = direction === "next";
    const pattern = isNext
      ? /下一章|下一页|继续阅读|后 一 章|next/i
      : /上一章|上一页|prev|previous/i;
    const opposite = isNext ? /上一章|上一页|prev|previous/i : /下一章|下一页|继续阅读|next/i;
    const candidates = [];
    doc.querySelectorAll("a[href],button[data-href]").forEach((element) => {
      const label = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""} ${element.className || ""}`.replace(/\s+/g, " ").trim();
      if (!pattern.test(label) || opposite.test(label)) return;
      const raw = element.getAttribute("href") || element.dataset.href;
      if (!raw || /^(?:javascript:|mailto:|tel:|#)/i.test(raw)) return;
      try {
        const url = new URL(raw, baseUrl || location.href);
        url.hash = "";
        if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return;
        candidates.push({ title: cleanTitle(element.textContent || (isNext ? "下一章" : "上一章")), url: url.href });
      } catch (_error) {
        // Ignore malformed navigation links.
      }
    });
    return candidates[0] || null;
  }

  function findDirectoryLink(doc, baseUrl) {
    const candidates = [];
    doc.querySelectorAll("a[href]").forEach((element) => {
      const label = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""}`.replace(/\s+/g, " ").trim();
      if (!/目录|章节列表|返回书页|全书/.test(label)) return;
      const raw = element.getAttribute("href");
      if (!raw || /^(?:javascript:|mailto:|tel:|#)/i.test(raw)) return;
      try {
        const url = new URL(raw, baseUrl || location.href);
        url.hash = "";
        if (/^https?:$/.test(url.protocol) && url.origin === location.origin) {
          candidates.push({ title: cleanTitle(label), url: url.href });
        }
      } catch (_error) {
        // Ignore malformed links.
      }
    });
    return candidates[0] || null;
  }

  function sendCatalog() {
    const directory = findDirectoryLink(document);
    const chapters = Array.from(document.querySelectorAll("a[href]"))
      .map((element) => {
        const text = cleanTitle(element.textContent || "");
        const href = element.getAttribute("href");
        if (!text || !href || text.length > 120 || /登录|注册|充值|排行|书架|首页|作者|评论|下载/.test(text)) return null;
        if (!/第[一二三四五六七八九十百千万\d]+[章节回篇部集]|序章|番外|尾声|^\d{1,5}[.、\s]/.test(text)) return null;
        try {
          const url = new URL(href, location.href);
          url.hash = "";
          return url.origin === location.origin ? { title: text, url: url.href } : null;
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean)
      .slice(0, 2000);
    chrome.runtime.sendMessage({
      type: "catalog",
      title: extractBookTitle(document),
      url: location.href,
      chapters
    });
  }

  function navigateToDirectory() {
    const directory = findDirectoryLink(document);
    if (directory?.url) window.location.assign(directory.url);
    else sendCatalog();
  }

  function extractTitle(doc) {
    const selectors = ["h1.chapter-title", ".chapter-title", ".read-title h1", ".bookname h1", "article h1", "main h1", "h1", "h2"];
    for (const selector of selectors) {
      const value = cleanTitle(doc.querySelector(selector)?.textContent || "");
      if (value && value.length <= 120) return value;
    }
    return cleanTitle(doc.title || "正文") || "正文";
  }

  function extractBookTitle(doc) {
    const meta = doc.querySelector('meta[property="og:novel:book_name"],meta[property="og:title"],meta[name="book_name"]');
    const value = cleanTitle(meta?.content || "");
    if (value) return value;
    return cleanTitle(doc.title || "小说").split(/\s*[|_—-]\s*/u)[0].trim().slice(0, 120) || "小说";
  }

  function nodeToText(node) {
    node.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    node.querySelectorAll("p,div,section,li,blockquote").forEach((element) => element.append("\n"));
    return node.textContent || "";
  }

  function cleanContent(raw) {
    const lines = String(raw)
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter((line) => line && !NAVIGATION_LINE.test(line));
    return lines.filter((line, index) => !index || line !== lines[index - 1]).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  function cleanTitle(value) {
    return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function stripHash(value) {
    try {
      const url = new URL(value, location.href);
      url.hash = "";
      return url.href;
    } catch (_error) {
      return String(value || "");
    }
  }
})();
