const dns = require("node:dns").promises;
const net = require("node:net");
const { load } = require("cheerio");

const USER_AGENT = "PageBetween/1.1 (personal offline reader)";
const MAX_PAGE_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const robotsCache = new Map();

class DownloadError extends Error {
  constructor(message, code = "DOWNLOAD_FAILED") {
    super(message);
    this.name = "DownloadError";
    this.code = code;
  }
}

async function downloadNovel(options, hooks = {}) {
  const maxChapters = clamp(Number(options.maxChapters) || 500, 1, 2000);
  const delayMs = clamp(Number(options.delayMs) || 700, 350, 5000);
  const fetchImpl = options.fetchImpl || fetch;
  const signal = hooks.signal;

  hooks.onProgress?.({ phase: "catalog", message: "正在读取目录页" });
  const catalogPage = await fetchPublicText(options.url, { signal, checkRobots: true, fetchImpl });
  const catalog = extractCatalog(catalogPage.text, catalogPage.url, maxChapters);

  let chapterLinks = catalog.chapters;
  if (!chapterLinks.length) {
    const singleChapter = extractChapter(catalogPage.text, catalogPage.url, catalog.title);
    if (singleChapter.content.length < 80) {
      throw new DownloadError("没有识别到章节链接，请粘贴包含完整章节列表的目录页网址", "NO_CHAPTERS");
    }
    chapterLinks = [{ title: singleChapter.title, url: catalogPage.url, cached: singleChapter }];
  }

  hooks.onProgress?.({
    phase: "found",
    current: 0,
    total: chapterLinks.length,
    title: catalog.title,
    message: `识别到 ${chapterLinks.length} 个章节`
  });

  const chapters = [];
  const failures = [];
  for (let index = 0; index < chapterLinks.length; index += 1) {
    throwIfAborted(signal);
    const link = chapterLinks[index];
    hooks.onProgress?.({
      phase: "chapter",
      current: index,
      total: chapterLinks.length,
      title: link.title,
      message: `正在下载：${link.title}`
    });

    try {
      const chapter = link.cached || extractChapter(
        (await fetchPublicText(link.url, {
          signal,
          checkRobots: true,
          fetchImpl,
          expectedOrigin: new URL(catalogPage.url).origin
        })).text,
        link.url,
        link.title
      );

      if (chapter.content.length < 40) {
        throw new DownloadError("正文过短，可能需要登录或页面由脚本动态加载", "EMPTY_CHAPTER");
      }
      chapters.push(chapter);
    } catch (error) {
      if (isAbortError(error)) throw error;
      failures.push({ title: link.title, reason: readableError(error) });
    }

    hooks.onProgress?.({
      phase: "chapter",
      current: index + 1,
      total: chapterLinks.length,
      title: link.title,
      failed: failures.length,
      message: `已完成 ${index + 1} / ${chapterLinks.length}`
    });

    if (index + 1 < chapterLinks.length) await abortableDelay(delayMs, signal);
  }

  if (!chapters.length) {
    throw new DownloadError("所有章节都未能提取正文，页面可能需要登录或使用了动态加载", "NO_CONTENT");
  }

  const text = formatNovelText({
    title: catalog.title,
    author: catalog.author,
    sourceUrl: catalogPage.url,
    chapters,
    failures
  });

  return {
    title: catalog.title,
    author: catalog.author,
    sourceUrl: catalogPage.url,
    chapterCount: chapters.length,
    failedCount: failures.length,
    failures,
    text
  };
}

async function fetchPublicText(input, options = {}) {
  let currentUrl = normalizeHttpUrl(input);
  const initialOrigin = options.expectedOrigin;
  const fetchImpl = options.fetchImpl || fetch;

  for (let redirects = 0; redirects <= 5; redirects += 1) {
    await assertPublicUrl(currentUrl, initialOrigin);
    if (options.checkRobots) await assertRobotsAllowed(currentUrl, options.signal, fetchImpl);

    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
    let response;
    try {
      response = await fetchImpl(currentUrl, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.2",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5"
        }
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new DownloadError(`无法访问页面：${error.message}`, "NETWORK_ERROR");
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new DownloadError("网页返回了无效的跳转地址", "BAD_REDIRECT");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new DownloadError("页面拒绝公开访问，下载器不会绕过登录或访问限制", "ACCESS_DENIED");
    }
    if (!response.ok) throw new DownloadError(`网页返回 HTTP ${response.status}`, "HTTP_ERROR");

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/(?:text\/|html|xhtml)/i.test(contentType)) {
      throw new DownloadError("网址返回的不是网页文本", "UNSUPPORTED_CONTENT");
    }
    const declaredSize = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_PAGE_BYTES) {
      throw new DownloadError("单个网页超过 8 MB，已停止下载", "PAGE_TOO_LARGE");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_PAGE_BYTES) {
      throw new DownloadError("单个网页超过 8 MB，已停止下载", "PAGE_TOO_LARGE");
    }
    return { url: currentUrl, text: decodeHtml(bytes, contentType) };
  }

  throw new DownloadError("网页跳转次数过多", "TOO_MANY_REDIRECTS");
}

function extractCatalog(html, pageUrl, maxChapters = 500) {
  const $ = load(html);
  removeNonContent($);
  const title = extractBookTitle($, pageUrl);
  const author = extractAuthor($);
  const origin = new URL(pageUrl).origin;
  const seen = new Set();
  const chapters = [];

  $("a[href]").each((_index, element) => {
    if (chapters.length >= maxChapters) return false;
    const anchor = $(element);
    const linkTitle = normalizeInlineText(anchor.text());
    const rawHref = anchor.attr("href");
    if (!rawHref || !looksLikeChapterLink(anchor, linkTitle, rawHref)) return undefined;

    let target;
    try {
      target = new URL(rawHref, pageUrl);
    } catch (_error) {
      return undefined;
    }
    target.hash = "";
    if (!/^https?:$/.test(target.protocol) || target.origin !== origin) return undefined;
    if (seen.has(target.href) || target.href === pageUrl) return undefined;
    seen.add(target.href);
    chapters.push({ title: cleanChapterTitle(linkTitle, chapters.length + 1), url: target.href });
    return undefined;
  });

  return { title, author, chapters };
}

function extractChapter(html, pageUrl, fallbackTitle = "") {
  const $ = load(html);
  removeNonContent($);

  const titleSelectors = [
    "h1.chapter-title", ".chapter-title", ".read-title h1", ".bookname h1",
    "article h1", "main h1", "h1", "h2"
  ];
  let title = "";
  for (const selector of titleSelectors) {
    const value = normalizeInlineText($(selector).first().text());
    if (value && value.length <= 100) {
      title = value;
      break;
    }
  }
  title = cleanChapterTitle(title || fallbackTitle || "正文", 1);

  const candidates = [];
  const candidateSelectors = [
    "#chaptercontent", "#chapter-content", "#content", "#BookText",
    ".chapter-content", ".chapter_content", ".read-content", ".reading-content",
    ".article-content", ".article_content", ".entry-content", ".content",
    "article", "main"
  ];
  const visited = new Set();
  for (const selector of candidateSelectors) {
    $(selector).each((_index, element) => {
      if (visited.has(element)) return;
      visited.add(element);
      const node = $(element).clone();
      node.find("script,style,noscript,iframe,svg,form,button,nav,footer,header,aside,.ads,.ad,.advertisement,.recommend,.related,.comment,.toolbar").remove();
      const content = htmlNodeToText(node, $);
      if (content.length < 40) return;
      const paragraphCount = node.find("p").length;
      const breakCount = node.find("br").length;
      const identity = `${element.tagName || ""} ${(anchorIdentity(element) || "").toLowerCase()}`;
      let score = Math.min(content.length, 30_000) + paragraphCount * 90 + breakCount * 25;
      if (/chapter|article|read|content|text|正文/.test(identity)) score += 1500;
      if (/main|article/.test(element.tagName || "")) score += 500;
      if (containsAccessWall(content)) score -= 5000;
      candidates.push({ content, score });
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const content = cleanChapterContent(candidates[0]?.content || "");
  if (!content && containsAccessWall($("body").text())) {
    throw new DownloadError("章节需要登录、订阅或购买，下载器不会绕过访问限制", "ACCESS_WALL");
  }
  return { title, content, sourceUrl: pageUrl };
}

function looksLikeChapterLink(anchor, text, href) {
  if (!text || text.length > 100) return false;
  if (/登录|注册|充值|排行|书架|首页|作者|评论|投票|下载|客户端|上一|下一|返回|目录页/i.test(text)) return false;
  if (/^(?:javascript:|mailto:|tel:|#)/i.test(href)) return false;

  const strongTitle = /^(?:第[〇零一二三四五六七八九十百千万两\d]{1,16}[卷章节回篇部集幕]|序章|序言|前言|楔子|引子|终章|尾声|后记|番外)/u.test(text);
  const numericTitle = /^\d{1,5}(?:[.、\s]|$)/u.test(text);
  const container = anchor.closest("[class],[id]");
  const containerIdentity = anchorIdentity(container.get(0)).toLowerCase();
  const chapterContainer = /chapter|catalog|list|volume|directory|目录|章节/.test(containerIdentity);
  const chapterHref = /(?:chapter|read|content|book|novel)[/_-]?\d|\/\d{2,}(?:\.html?)?(?:\?|$)/i.test(href);
  return strongTitle || numericTitle || (chapterContainer && chapterHref);
}

function htmlNodeToText(node, $) {
  node.find("br").replaceWith("\n");
  node.find("p,div,section,li,blockquote").each((_index, element) => {
    $(element).append("\n");
  });
  return node.text();
}

function cleanChapterContent(rawText) {
  const navigationLine = /^(?:上一章|下一章|返回目录|加入书签|收藏本章|章节报错|手机阅读|请记住本站|最新网址|未完待续|本章完)[\s\S]{0,30}$/i;
  const lines = String(rawText)
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line && !navigationLine.test(line));

  const uniqueAdjacent = lines.filter((line, index) => !index || line !== lines[index - 1]);
  return uniqueAdjacent.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatNovelText(book) {
  const header = [`《${book.title}》`];
  if (book.author) header.push(`作者：${book.author}`);
  header.push(`来源：${book.sourceUrl}`);
  header.push("仅供个人离线阅读，请遵守来源网站规则与著作权要求。");

  const body = book.chapters.map((chapter) => `${chapter.title}\n\n${chapter.content}`);
  if (book.failures.length) {
    body.push(`下载说明\n\n有 ${book.failures.length} 个章节未能下载：\n${book.failures.map((item) => `- ${item.title}：${item.reason}`).join("\n")}`);
  }
  return `${header.join("\n")}\n\n\n${body.join("\n\n\n")}\n`;
}

function extractBookTitle($, pageUrl) {
  const selectors = [
    'meta[property="og:novel:book_name"]', 'meta[property="og:title"]',
    'meta[name="book_name"]', "h1.book-title", ".book-info h1", ".bookinfo h1", "h1"
  ];
  for (const selector of selectors) {
    const element = $(selector).first();
    const value = normalizeInlineText(element.attr("content") || element.text());
    if (value && value.length <= 100) return value;
  }
  const documentTitle = normalizeInlineText($("title").first().text());
  if (documentTitle) return documentTitle.split(/\s*[|_—]\s*/u)[0].trim().slice(0, 100);
  return new URL(pageUrl).hostname;
}

function extractAuthor($) {
  const selectors = [
    'meta[property="og:novel:author"]', 'meta[name="author"]',
    ".book-author", ".author", "[itemprop=author]"
  ];
  for (const selector of selectors) {
    const element = $(selector).first();
    const value = normalizeInlineText(element.attr("content") || element.text()).replace(/^作者[：:]?\s*/u, "");
    if (value && value.length <= 80) return value;
  }
  return "";
}

function cleanChapterTitle(title, index) {
  const clean = normalizeInlineText(title).replace(/^(?:章节目录|正文)[：:]?\s*/u, "");
  return clean || `第 ${index} 章`;
}

function removeNonContent($) {
  $("script,style,noscript,template,iframe,svg").remove();
}

function anchorIdentity(element) {
  if (!element || !element.attribs) return "";
  return `${element.attribs.id || ""} ${element.attribs.class || ""}`;
}

function normalizeInlineText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function containsAccessWall(text) {
  return /(?:登录后阅读|请先登录|订阅后阅读|购买本章|付费章节|VIP章节|解锁本章|无权访问)/i.test(String(text));
}

function decodeHtml(bytes, contentType) {
  const head = Buffer.from(bytes.slice(0, 4096)).toString("latin1");
  const charsetMatch = contentType.match(/charset\s*=\s*["']?([^;\s"']+)/i)
    || head.match(/charset\s*=\s*["']?([^;\s"'/>]+)/i);
  const declared = normalizeCharset(charsetMatch?.[1]);
  const labels = declared ? [declared, "utf-8", "gb18030"] : ["utf-8", "gb18030"];
  for (const label of [...new Set(labels)]) {
    try {
      return new TextDecoder(label, { fatal: label === "utf-8" }).decode(bytes);
    } catch (_error) {
      // Try the next common web encoding.
    }
  }
  return new TextDecoder().decode(bytes);
}

function normalizeCharset(value) {
  const label = String(value || "").trim().toLowerCase();
  if (/^(?:gbk|gb2312|gb_2312|cp936)$/.test(label)) return "gb18030";
  if (/^(?:utf8|utf-8)$/.test(label)) return "utf-8";
  if (/^big5/.test(label)) return "big5";
  return label || "";
}

async function assertPublicUrl(input, expectedOrigin) {
  const url = new URL(input);
  if (expectedOrigin && url.origin !== expectedOrigin) {
    throw new DownloadError("章节链接跳转到了其他网站，已停止下载", "CROSS_ORIGIN");
  }
  if (url.username || url.password) throw new DownloadError("网址不能包含登录凭据", "BAD_URL");

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new DownloadError("不能下载本机或局域网页面", "PRIVATE_ADDRESS");
  }

  const literalType = net.isIP(hostname);
  if (literalType && isPrivateIp(hostname)) {
    throw new DownloadError("不能下载本机或局域网页面", "PRIVATE_ADDRESS");
  }

  if (!literalType) {
    let addresses;
    try {
      addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    } catch (error) {
      throw new DownloadError(`无法解析网站地址：${error.message}`, "DNS_ERROR");
    }
    if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
      throw new DownloadError("网站地址指向本机或局域网，已停止下载", "PRIVATE_ADDRESS");
    }
  }
}

function normalizeHttpUrl(input) {
  let value = String(input || "").trim();
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(value)) value = `https://${value}`;
  let url;
  try {
    url = new URL(value);
  } catch (_error) {
    throw new DownloadError("请输入有效的网页地址", "BAD_URL");
  }
  if (!/^https?:$/.test(url.protocol)) throw new DownloadError("只支持 HTTP 或 HTTPS 网页", "BAD_URL");
  url.hash = "";
  return url.toString();
}

function isPrivateIp(address) {
  const normalized = String(address).toLowerCase();
  if (net.isIPv4(normalized)) {
    const [a, b] = normalized.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (net.isIPv6(normalized)) {
    if (normalized === "::" || normalized === "::1") return true;
    if (/^(?:fc|fd)/.test(normalized) || /^fe[89ab]/.test(normalized) || /^ff/.test(normalized)) return true;
    const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  return true;
}

async function assertRobotsAllowed(pageUrl, signal, fetchImpl = fetch) {
  const url = new URL(pageUrl);
  let rulesPromise = robotsCache.get(url.origin);
  if (!rulesPromise) {
    rulesPromise = fetchRobots(url.origin, signal, fetchImpl);
    robotsCache.set(url.origin, rulesPromise);
  }
  const rules = await rulesPromise;
  if (!rules.length) return;

  const path = `${url.pathname}${url.search}`;
  const matches = rules.filter((rule) => rule.path && path.startsWith(rule.path));
  if (!matches.length) return;
  matches.sort((a, b) => b.path.length - a.path.length);
  if (!matches[0].allow) {
    throw new DownloadError("网站的 robots.txt 不允许抓取这个页面", "ROBOTS_DENIED");
  }
}

async function fetchRobots(origin, signal, fetchImpl = fetch) {
  try {
    await assertPublicUrl(origin);
    const response = await fetchImpl(new URL("/robots.txt", origin).toString(), {
      redirect: "manual",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(7000)]) : AbortSignal.timeout(7000),
      headers: { "User-Agent": USER_AGENT, Accept: "text/plain" }
    });
    if (!response.ok) return [];
    return parseRobots(await response.text());
  } catch (error) {
    if (isAbortError(error) && signal?.aborted) throw error;
    return [];
  }
}

function parseRobots(text) {
  const rules = [];
  let applies = false;
  let sawRule = false;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (sawRule) {
        applies = false;
        sawRule = false;
      }
      applies = value === "*" || value.toLowerCase().includes("pagebetween");
    } else if ((key === "allow" || key === "disallow") && applies) {
      sawRule = true;
      if (value) rules.push({ allow: key === "allow", path: value.split(/[?*]/)[0] });
    }
  }
  return rules;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw signal.reason || new DOMException("已取消", "AbortError");
}

function abortableDelay(duration, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, duration);
    function done() {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason || new DOMException("已取消", "AbortError"));
    }
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

function readableError(error) {
  if (error instanceof DownloadError) return error.message;
  return error?.message || "未知错误";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

module.exports = {
  DownloadError,
  cleanChapterContent,
  decodeHtml,
  downloadNovel,
  extractCatalog,
  extractChapter,
  formatNovelText,
  isPrivateIp,
  normalizeHttpUrl,
  parseRobots
};
