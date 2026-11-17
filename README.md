# BiliEditionSwitch

B站国内版 / 国际多语言版一键切换工具，提供篡改猴脚本和 Firefox 扩展。

切换的是 `bilibili.com` 国内版与 `bilibili.com/en/`、`bilibili.com/ja/`、`bilibili.com/zh-Hans/` 等多语言页面。

## 篡改猴脚本：直接安装

**[点击安装 / 更新脚本](https://raw.githubusercontent.com/yuyu107/BiliEditionSwitch/main/BiliEditionSwitch.user.js)**

1. 先在浏览器中安装并启用 Tampermonkey（篡改猴）。
2. 打开上面的链接，在篡改猴安装页确认安装。
3. 刷新 B站，页面左下角会出现“切到国际版 / 切到国内版”按钮。
4. 点击旁边的 **⚙**，选择国际版默认语言并保存。

也可点击篡改猴图标，使用“切换国内版 / 国际版”或“设置国际版默认语言…”菜单。

如果链接显示代码而未出现安装页：在篡改猴中选择“添加新脚本”，删除默认模板，粘贴链接中显示的全部代码，按 `Ctrl+S` 保存后刷新 B站。

### 脚本更新

当前版本 **0.1.1**。脚本已配置此仓库的 `@updateURL` 和 `@downloadURL`，可通过篡改猴检查更新。实际检查频率由篡改猴设置决定。

此前手动安装的 0.1.0 尚未配置更新地址，请通过上方链接更新一次。若出现两份同名脚本，请禁用或删除旧版，保留一份启用。

原生全屏播放时隐藏页面按钮，退出全屏后恢复。

## 可选默认语言

默认英语。支持以下 13 种语言；选择简体中文仍然进入国际版布局。

| 语言 | 地址代码 |
| --- | --- |
| English / 英语 | `en` |
| 简体中文 | `zh-Hans` |
| 繁體中文 | `zh-Hant` |
| 日本語 / 日语 | `ja` |
| 泰语 | `th` |
| 越南语 | `vi` |
| 印度尼西亚语 | `id` |
| 马来语 | `ms` |
| 阿拉伯语 | `ar` |
| 葡萄牙语 | `pt` |
| 西班牙语 | `es` |
| 土耳其语 | `tr` |
| 俄语 | `ru` |

## 切换范围

- **主站首页和普通 BV/av 视频页**：保留当前页面、分 P、时间参数及网址锚点。
- **搜索、空间、动态、直播、番剧、专栏等其他页面**：当前版本切换到目标版本首页。
- 切换会刷新当前页面。只有原网址自带时间参数时才保留对应播放位置。
- 选择语言并保存，本身不会刷新页面；下次切到国际版时生效。

国际版布局、翻译范围、登录状态、功能和区域可用性由 B站提供。账号或网站策略可能使页面自动跳转，此时可能仍需后续适配。

## Firefox 扩展

当前扩展版本 **0.1.0**，与先前提交审核的版本一致。

- [下载 Mozilla 上传包 ZIP](https://github.com/yuyu107/BiliEditionSwitch/raw/refs/heads/main/dist/BiliEditionSwitch-Firefox-v0.1.0-AMO.zip)
- [下载未签名 XPI](https://github.com/yuyu107/BiliEditionSwitch/raw/refs/heads/main/dist/BiliEditionSwitch-Firefox-v0.1.0-unsigned.xpi)
- [查看完整源码](firefox/)

ZIP 根目录直接包含 `manifest.json`，可用于上传审核。未签名 XPI 不能在普通正式版 Firefox 中作为永久扩展安装。

### 临时测试

1. 下载 ZIP 并解压。
2. Firefox 地址栏打开 `about:debugging#/runtime/this-firefox`。
3. 点击“临时载入附加组件”，选择解压后的 `manifest.json`。
4. 将扩展固定到工具栏，点击图标即可切换；右键图标设置默认语言。

快捷键：`Alt+Shift+B`。临时扩展在重启 Firefox 后需重新载入。扩展声明最低 Firefox 78，旧版 Firefox 的实际兼容性尚待测试。

## 隐私

脚本和扩展均不收集或上传数据，无远程执行代码或统计服务。脚本通过 GitHub 获取安装文件和检查更新。

切换时会写入 B站的 `user_site`（版本）和 `lang`（语言）偏好 Cookie。设置可能同时影响 B站自己的语言显示；卸载工具后这些网站偏好仍会保留，可在卸载前切回国内版，或通过 B站自身设置调整。

脚本默认语言保存在篡改猴中；扩展默认语言保存在浏览器扩展本地存储中。两者设置独立。

## 开发与验证

源码直接可读，无需 npm 安装或构建编译。

```sh
node tests/userscript.cjs
node tests/firefox.cjs
python3 tools/build.py
```

前两项分别进行 74 项脚本模拟检查和 57 项扩展路由、后台模拟检查。它们使用模拟 DOM / 浏览器 API，不能代替真实浏览器中的端到端测试。

`tools/build.py` 用标准库生成扩展包、检查脚本更新元数据；压缩包中的扩展代码与 `firefox/` 中源码一致。当前尚未完成真实 Firefox / 篡改猴已登录环境中的完整验证，欢迎提交反馈。

### 目录

| 文件 / 目录 | 用途 |
| --- | --- |
| `BiliEditionSwitch.user.js` | 可直接安装的完整脚本 |
| `BiliEditionSwitch.meta.js` | 篡改猴更新检查元数据 |
| `firefox/` | Firefox 扩展完整源码 |
| `dist/` | Firefox 上传、调试包 |
| `tests/` | 自动检查 |
| `tools/build.py` | 生成扩展包与检查更新元数据 |

更新脚本时，同步提升 `.user.js` 和 `.meta.js` 中的版本号及元数据。脚本逻辑与扩展路由目前各自包含在对应文件中，改动时需同步维护。

## 反馈

[提交问题](https://github.com/yuyu107/BiliEditionSwitch/issues)，请附浏览器、脚本或扩展版本、切换前后网址和现象。请勿提交账号 Cookie 或登录凭据。

非官方工具，与哔哩哔哩无关联。
