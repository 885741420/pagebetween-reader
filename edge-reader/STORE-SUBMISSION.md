# Edge Add-ons 提交资料

版本：`1.2.0`

## 商店字段

- 名称：页间 Edge 网页桥接
- 类别：生产力
- 简短说明：把 Edge 当前小说网页转换为纯文字并发送到本机阅读器，支持章节切换和后两章预取。
- 支持语言：简体中文
- 隐私政策：`https://885741420.github.io/pagebetween-reader/edge-reader/privacy.html`
- 支持页面：`https://github.com/885741420/pagebetween-reader/issues`

## 详细说明

页间 Edge 网页桥接是“页间小说阅读器”的配套扩展。它可以提取用户当前小说网页的章节标题、纯文字正文、上一章、下一章和目录链接，并在阅读当前章节时预取后两章，让章节切换更流畅。

扩展只连接用户本机运行的页间小说阅读器（`127.0.0.1:17321`），不会把网页内容或浏览历史上传到开发者服务器。扩展不会绕过网站登录、付费、验证码、DRM 或其他访问限制。用户必须已经能够在 Edge 中正常打开相关网页，并主动点击阅读器的“读取 Edge”操作。

## 权限说明

### 网页访问权限

用户可能在不同小说网站阅读，需要从当前页面提取正文和章节导航。扩展只在用户主动使用阅读器连接功能后处理页面内容。

### tabs

用于识别用户当前阅读的 Edge 标签页，并响应用户在阅读器中发出的上一章、下一章和目录切换命令。

### 127.0.0.1 连接

仅用于连接本机页间小说阅读器，不连接开发者服务器。

## 审核员测试步骤

1. 从发布页下载并安装“页间小说阅读器”桌面程序：`https://github.com/885741420/pagebetween-reader/releases/latest`。
2. 启动桌面阅读器，确认其本机桥接地址为 `127.0.0.1:17321`。
3. 使用 Edge 打开无需登录、付费或验证码的公开测试页面：`https://885741420.github.io/pagebetween-reader/store-demo/chapter-1.html`。
4. 在阅读器中点击“读取 Edge”。
5. 检查正文以纯文字显示；使用左右箭头切换上一章或下一章。
6. 同时按住左右箭头，检查是否返回目录链接（测试页面提供目录链接时）。
7. 在当前章节阅读期间切换下一章，检查预取缓存是否优先生效。

审核测试页和隐私政策由本仓库的 GitHub Pages 提供；桌面安装包发布到 GitHub Releases 后，上述下载地址会自动指向最新版本。

## 商店图片

已生成可直接上传的素材：

- Logo：`edge-reader\store-assets\logo-300.png`（300 x 300）
- 阅读器截图：`release\edge-extension\screenshots\00-reader.png`（1280 x 800）
- 目录截图：`release\edge-extension\screenshots\01-directory.png`（1280 x 800）
- 测试章节截图：`release\edge-extension\screenshots\02-chapter.png`、`03-next-chapter.png`（1280 x 800）

Microsoft Edge Add-ons 允许最多 6 张 640 x 480 或 1280 x 800 截图。截图只展示原创测试内容和阅读器界面，不包含第三方网站或受版权保护的小说正文。
