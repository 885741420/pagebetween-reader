# 页间 Edge 网页桥接

该扩展把当前 Edge 标签页的小说正文发送到本地的页间 Electron 阅读器。内容只在本机处理，不上传网页内容。

## 正式安装

运行 `npm.cmd run pack:edge` 会生成可提交到 Microsoft Edge Add-ons 的 ZIP：

```text
release\edge-extension\pagebetween-edge-extension-1.2.0.zip
```

在 Microsoft Partner Center 审核通过后，从 Edge 加载项商店安装。安装后直接在现有的普通 Edge 窗口中打开小说页面即可，不需要单独的“扩展窗口”。

## 本地测试

商店审核前只能用 Edge 开发者模式加载解压后的 `edge-reader` 目录。下面的命令会启动一个加载本地扩展的普通 Edge 窗口：

先启动阅读器，再用命令行启动一个带扩展的 Edge 实例：

```powershell
msedge.exe --load-extension="E:\制作 gpt\edge-reader"
```

打开小说章节后，在页间阅读器点击“读取 Edge”。

扩展会在当前章节阅读期间预取下一章和下下章，失败时会在实际切换时回退到正常网页加载。
