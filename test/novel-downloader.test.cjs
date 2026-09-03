const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cleanChapterContent,
  downloadNovel,
  extractCatalog,
  extractChapter,
  isPrivateIp,
  normalizeHttpUrl,
  parseRobots
} = require("../novel-downloader.cjs");

test("downloadNovel assembles a complete TXT through the fetch pipeline", async () => {
  const pages = new Map([
    ["http://93.184.216.34/catalog", `
      <html><head><title>离线测试小说</title></head><body>
        <h1>离线测试小说</h1>
        <div class="catalog">
          <a href="/chapter/1">第一章 启程</a>
          <a href="/chapter/2">第二章 抵达</a>
        </div>
      </body></html>`],
    ["http://93.184.216.34/chapter/1", `
      <h1>第一章 启程</h1><div id="content">
        <p>清晨的渡船离开码头，长长的水纹一直延伸到雾里。</p>
        <p>岸边的人影越来越小，远处的钟声响了三次。</p>
      </div>`],
    ["http://93.184.216.34/chapter/2", `
      <h1>第二章 抵达</h1><div id="content">
        <p>午后，船靠上陌生的石岸，风里带着松木和雨水的气味。</p>
        <p>旅人提起行李，沿着旧地图标出的方向走进城门。</p>
      </div>`]
  ]);
  const progress = [];
  const fakeFetch = async (url) => {
    if (String(url).endsWith("/robots.txt")) return new Response("", { status: 404 });
    const html = pages.get(String(url));
    return html
      ? new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } })
      : new Response("Not found", { status: 404 });
  };

  const result = await downloadNovel(
    { url: "http://93.184.216.34/catalog", maxChapters: 2, delayMs: 350, fetchImpl: fakeFetch },
    { onProgress: (value) => progress.push(value) }
  );

  assert.equal(result.title, "离线测试小说");
  assert.equal(result.chapterCount, 2);
  assert.equal(result.failedCount, 0);
  assert.match(result.text, /第一章 启程[\s\S]*第二章 抵达/);
  assert.equal(progress.at(-1).current, 2);
});

test("extractCatalog finds same-origin chapter links in document order", () => {
  const html = `
    <html>
      <head><meta name="author" content="作者甲"><title>测试小说_某站</title></head>
      <body>
        <h1>测试小说</h1>
        <div class="catalog">
          <a href="/book/1/101.html">第一章 起点</a>
          <a href="/book/1/102.html#reader">第二章 继续</a>
          <a href="https://other.example/book/1/103.html">第三章 外站</a>
          <a href="/login">登录</a>
        </div>
      </body>
    </html>`;

  assert.deepEqual(extractCatalog(html, "https://example.com/book/1/", 500), {
    title: "测试小说",
    author: "甲",
    chapters: [
      { title: "第一章 起点", url: "https://example.com/book/1/101.html" },
      { title: "第二章 继续", url: "https://example.com/book/1/102.html" }
    ]
  });
});

test("extractChapter chooses and cleans the main reading content", () => {
  const html = `
    <html><body>
      <nav>首页 书库 排行</nav>
      <h1 class="chapter-title">第一章 起点</h1>
      <div id="content">
        <p>这是第一段正文，海风掠过窗台，纸页发出细碎的声响。</p>
        <p>这是第二段正文，灯塔的光从远方缓慢扫过来。</p>
        <a href="/next">下一章</a>
      </div>
      <aside class="recommend">相关推荐内容内容内容内容内容内容内容</aside>
    </body></html>`;

  const chapter = extractChapter(html, "https://example.com/book/1/101.html", "备用标题");
  assert.equal(chapter.title, "第一章 起点");
  assert.match(chapter.content, /海风掠过窗台/);
  assert.match(chapter.content, /灯塔的光/);
  assert.doesNotMatch(chapter.content, /相关推荐/);
  assert.doesNotMatch(chapter.content, /^下一章$/m);
});

test("cleanChapterContent removes navigation and adjacent duplicate lines", () => {
  assert.equal(
    cleanChapterContent("正文第一行\n正文第一行\n下一章\n正文第二行"),
    "正文第一行\n\n正文第二行"
  );
});

test("URL and network guards reject private address forms", () => {
  assert.equal(normalizeHttpUrl("example.com/book"), "https://example.com/book");
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("192.168.1.8"), true);
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("2606:4700:4700::1111"), false);
});

test("parseRobots keeps wildcard allow and disallow rules", () => {
  const rules = parseRobots(`
    User-agent: *
    Disallow: /private/
    Allow: /private/sample/
    User-agent: OtherBot
    Disallow: /
  `);
  assert.deepEqual(rules, [
    { allow: false, path: "/private/" },
    { allow: true, path: "/private/sample/" }
  ]);
});
