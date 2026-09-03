# 页间 · 小说阅读器与网页转 TXT

这是一个 TXT 小说阅读器，包含浏览器版本和 Windows 桌面版本。桌面版可以把公开网页上的小说章节整理成 UTF-8 TXT 文件。

## Windows 桌面版

首次准备：运行 `npm.cmd install`。

开发运行：`npm.cmd start`。

生成 NSIS 安装包：`npm.cmd run dist`。完成后安装包位于 `release` 目录，安装后可直接从开始菜单启动，不需要浏览器或本地服务器。

也可以使用便携版：运行 `release/win-unpacked/页间小说阅读器.exe` 即可启动，无需安装。也可以使用 `release/页间小说阅读器-1.2.0-setup.exe` 安装。

桌面版会保存上次打开的 TXT 路径、当前章节和滚动位置。下次打开应用会自动恢复阅读。

### 网页转 TXT

1. 点击顶部的“网页转 TXT”。
2. 粘贴小说目录页网址，选择最多下载章节数。
3. 确认你有权保存内容后开始下载，选择 TXT 保存位置。

下载器识别同一网站内的章节链接，按顺序限速下载，清理网页导航和广告区域，最后合并为一个 TXT 并自动打开。它只处理无需登录即可访问的静态页面，并遵守网站 `robots.txt`；不会绕过登录、付费、验证码、DRM 或其他访问限制。脚本动态渲染正文的网站可能无法提取。

## 浏览器版本

双击 `index.html` 即可使用；也可以运行 `node server.mjs`，然后打开 <http://127.0.0.1:4173>。

## 功能

- 读取本地 `.txt` 文件，支持 UTF-8、UTF-16 和 GB18030 文本
- 从公开小说目录页识别章节、限速下载并合并保存为 UTF-8 TXT
- 下载进度、任务取消、失败章节说明和保存后自动打开
- 自动识别“第 X 章 / 卷 / 回 / 篇”、序章、楔子、番外、尾声等章节标题
- 目录章节预览、上一章/下一章和章节快速跳转
- 全书内容搜索、结果上下文预览和正文高亮定位
- 拖放打开 TXT 文件
- 自动保存每本书的章节位置和阅读进度
- 字号、行距、纸张/明亮/夜间主题设置
- 桌面与手机响应式布局
- Edge 网页桥接：从当前 Edge 标签页提取纯文字正文
- Edge 章节预取：阅读当前章节时自动缓存后两章
- 普通窗口/无边框窗口模式切换
- 左右箭头切换章节，同时按下左右箭头返回目录
- 自定义背景色与屏幕取色

本地 TXT 内容不会上传到网络。网页转 TXT 仅由桌面版直接访问用户填写的网址并将结果保存到本机。

## Edge 网页阅读

桌面程序启动后，本机会监听 `127.0.0.1:17321`，只接受来自本机 Edge 扩展的连接。扩展文件位于 `edge-reader`，可以用命令行加载开发版扩展：

```powershell
msedge.exe --load-extension="E:\制作 gpt\edge-reader"
```

打开小说章节后，在阅读器点击“读取 Edge”。扩展会提取当前正文，并在后台预取后两章；阅读器优先使用本地缓存切换章节。同时按住左右箭头会让 Edge 返回目录页（若网站提供目录链接）。

正式扩展包使用 `npm.cmd run pack:edge` 生成，位于 `release/edge-extension/pagebetween-edge-extension-1.2.0.zip`。该 ZIP 用于提交 Microsoft Edge Add-ons；审核通过并从商店安装后，可直接配合现有的普通 Edge 窗口使用。未经商店签名的本地扩展无法由普通 Windows 程序静默安装到 Edge。

## 公开发布地址

- 项目主页：<https://github.com/885741420/pagebetween-reader>
- 桌面安装包：<https://github.com/885741420/pagebetween-reader/releases/latest>
- 隐私政策：<https://885741420.github.io/pagebetween-reader/edge-reader/privacy.html>
- 审核测试目录：<https://885741420.github.io/pagebetween-reader/store-demo/>
