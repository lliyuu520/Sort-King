# 《分类之王》/ Sort-King

微信小游戏（竖屏，`compileType: game`）。玩家 4–8 岁。上线运行时是 **Cocos Creator 3.8.x**（当前工程 `3.8.8`），工程在 `client/`。

中文名 **分类之王**，英文 **Sort-King**。包名 `sort-king`。旧称「归归归」已废弃，不要写进文案或标识符。

本周期：免费、无广告、无内购、无登录/世界榜。进度只存本地。没有失败结算，关卡只赢、可重玩。

## 先读

改玩法/交付前读 [`docs/开发计划.md`](docs/开发计划.md) 第 0 节（产品锁死）。改 UI 读 [`DESIGN.md`](DESIGN.md)。改模型/画面读 [`assets/art-direction-brief.md`](assets/art-direction-brief.md)。

## 目录

| 路径 | 用途 |
|------|------|
| `client/` | **上线入口**。Cocos 工程，构建「微信小游戏」 |
| `client/assets/scripts/game/` | 纯 TS 规则：`Game` / `catalog` / `i18n`。不碰 `wx`、不碰节点 |
| `client/assets/scripts/view/` | 表现：`BootApp`、`PlayView`、`UiKit` |
| `client/assets/scripts/shell/` | `AppSession`、`WxShell`（存档/隐私/振动/前后台） |
| `client/assets/scenes/` | `boot`（隐私/首页/选关）、`play`（3D 对局） |
| `js/` `index.html` `game.js` | **冻结的 Canvas 原型**，只对照规则，不是上线路径 |
| `assets/items/` `assets/models/` | PNG/参考图，**不进微信包** |
| `scripts/test-game.ts` | 纯逻辑测试 |

根目录 `project.config.json` 是旧 Canvas 小游戏壳，不要把它当 Cocos 构建入口。

## 分层

```
Game（纯逻辑） → PlayView / BootApp（Cocos 节点） → WxShell（平台）
```

- 规则改动只动 `client/assets/scripts/game/`。
- 进关：`BootApp.startPlay` → `AppSession.goPlay` → `director.loadScene("play")`。**禁止**在 `boot` 里画对局（`PlayBoard` 黄底 2D 卡是回归）。
- `play` 用 `PlayView` 3D 书桌；UI 相机 `DEPTH_ONLY` 叠 HUD，Main Camera 保持透视、锁死俯视。禁止旋转/捏合。关掉 3D 物理（ammo/bullet），拖拽是射线打桌面平面，入盒是逻辑判定。

## 点击（预览易踩）

首页按钮点不中时，走 `UiKit.onTap` + `bindDomTap`：事件绑 `game.canvas` 的 pointer/mouse/touch（捕获阶段），用 `getBoundingClientRect` 映射到 `view.getVisibleSize()`（Y 从底向上）。不要靠 Main Camera `hitTest` / 只靠节点 `TOUCH_END`。内嵌预览截 WebGL 常全黑，用场景节点树验证是否进了 `play`。

## 画面与包体

- 设计分辨率 720×1280，`fitHeight`，竖屏。
- 运行时模型：`https://oss.lliyuu520.cn/sortking/models/<itemKey>.glb`（key 与 `catalog.ITEMS` 一致）。UI 可走 `sortking/ui/`。不要占用怒雷的 `sprites/`、`audio/`。
- 主包 **< 4MB**。模型走远程/分包；脚本不能远程。加载失败用色块/emoji 占位，不挡开局。URL 不加手写 `?v=`。
- 现有 PNG 只当建模对照，不要当扁贴纸贴到 3D 面上。可乐必须是易拉罐，不是吸管杯。
- 不引入 Unity / Laya / Three.js。怒雷试点的「禁止引擎」**不套用**本项目。

## 存档键

`sortking_v2` / `sortking_lang` / `sortking_privacy`。本周期不请求自有后端，不复用 `/nulei/api`。OSS 凭据只在本机环境 / `.env`，不进仓库。

## 命令

仓库没有 npm lint/test 脚本。逻辑回归：

```bash
npx --yes tsx scripts/test-game.ts
```

（旧原型：`node js/test-logic.js`，不要当交付验证。）

出包：Cocos Creator 打开 `client/`，构建微信小游戏，再用微信开发者工具导入产物。不要把 `index.html` 当验收入口。

功能裁剪保持关 3D 物理、WebGL 2.0、视频、WebView、地形、Spine 等；开 3D 渲染、基础动画、2D UI。

## 工具与范围

- Funplay Cocos MCP 只写 [`/.zcode/config.json`](.zcode/config.json)（`http://127.0.0.1:22968/`），不要写全局 `~/.zcode/cli/config.json`。改完需重启 ZCode。
- 默认当前分支就地开发。LF 行尾。
- 不要改 `client/settings` 裁剪、微信 `appid`、OSS 域名，除非任务明确要求。
- 不要启动/杀掉编辑器、预览端口或开发者工具进程；需要时告诉用户手动操作。
