# 页间 Edge 扩展上架流程

本项目的扩展包已经生成：

```text
release\edge-extension\pagebetween-edge-extension-1.2.0.zip
```

## 1. 注册开发者账号

打开 Microsoft Edge Add-ons Partner Center：

<https://partner.microsoft.com/dashboard/microsoftedge/public/login>

官方要求：

- 使用个人 Microsoft account（MSA，例如 Outlook、Live 或 Hotmail 账号）作为 Primary Owner。
- 工作或学校账号不能直接注册 Edge 扩展开发者计划。
- 可以选择 Individual 或 Company，注册后账号类型不能更改。
- Edge 扩展提交没有注册费。

## 2. 发布隐私政策和测试页面

把下面两个目录发布到同一个公开 HTTPS 静态站点（GitHub Pages、自己的 HTTPS 网站均可）：

```text
edge-reader\privacy.html
store-demo\
```

得到两个地址，例如：

```text
隐私政策：https://你的用户名.github.io/仓库名/privacy.html
测试目录：https://你的用户名.github.io/仓库名/store-demo/
```

发布前必须把 `privacy.html` 中的 `YOUR_SUPPORT_EMAIL` 替换为真实支持邮箱。测试目录是原创内容，不需要登录或付费。

可以直接使用已生成的公开资料包：

```text
release\edge-extension\pagebetween-public-assets-1.2.0.zip
```

解压后把 `privacy.html` 放在站点根目录，把 `store-demo` 目录保持原样上传。

同时把桌面安装包放到公开 HTTPS 下载地址：

```text
release\页间小说阅读器-1.2.0-setup.exe
```

审核员需要安装桌面程序，才能验证本扩展连接的本机阅读器。

## 3. 创建首次提交

在 Partner Center 选择 **Microsoft Edge > Overview > Create new extension**，上传 ZIP。首次创建产品不能只依靠 REST API，必须先在 Partner Center 建立产品和商店资料。

填写资料时使用：

- 名称：页间 Edge 网页桥接
- 类别：生产力
- 隐私政策：上一步的公开 HTTPS 隐私页
- 支持页面：你的项目主页或下载页
- 详细说明和权限理由：`edge-reader\STORE-SUBMISSION.md`
- 审核备注：同一文件的“审核员测试步骤”
- 商店 Logo：`edge-reader\store-assets\logo-300.png`
- 商店截图：`release\edge-extension\screenshots\00-reader.png` 至 `03-next-chapter.png`

审核备注中必须明确“这是桌面阅读器的配套扩展”，并提供桌面程序下载地址和测试目录地址。

## 4. 提交前检查

- ZIP 根目录直接包含 `manifest.json`、`background.js`、`content.js` 和 `icons`，不要多包一层目录。
- 隐私政策地址无需登录，使用 HTTPS，并包含真实联系邮箱。
- 桌面程序下载地址和测试页面地址无需登录。
- 权限说明与实际功能一致：网页访问、`tabs`、本机 `127.0.0.1:17321`。
- 不加入远程脚本、广告、统计代码或绕过登录/付费/验证码的功能。
- 如果修改代码，先把版本号改为大于 `1.2.0`，再重新运行：

```powershell
Set-Location 'E:\制作 gpt'
npm.cmd run pack:edge
```

## 5. 审核通过后的使用方式

在普通 Edge 中从 Edge Add-ons 商店安装“页间 Edge 网页桥接”，启动已安装的“页间小说阅读器”，打开小说页面后点击“读取 Edge”。不需要启动特殊 Edge 窗口，也不需要 `--load-extension`。

官方参考：

- <https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account>
- <https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension>
- <https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies>
