# 《分类之王》美术方向

## Game frame

- Player fantasy: 4–8 岁把桌上立体玩具拖进同类盒子
- Core verbs: 拾取、拖、放入、揭盖、满盒消除
- Engine: Cocos Creator 3.8，微信小游戏
- Camera: 锁死俯视书桌，约 35°–45°，禁止旋转捏合
- Typical on-screen size: 手牌约手掌能握住的玩具

## Visual system

- Shape: 圆润、厚、黏土/注塑玩具，边角全部倒圆
- Silhouette: 单件从侧面也能认出（可乐必须是易拉罐，不是吸管杯）
- Value: 主体 2–3 个色阶 + 一块高光
- Palette: 书桌奶油木 `#F3EDE3` / `#D7C4A3`；分类色沿用 catalog
- Materials: 塑料高光、轻微次表面，不要写实果皮毛孔
- Light: 左上柔光，blob 接触阴影，无全场景实时阴影
- Detail: 少装饰，没有文字品牌
- Explicit exclusions: 扁贴纸贴到 3D 面上；现有 PNG 只当识别对照

## Technical contract

- Runtime: `sortking/models/<itemKey>.glb`
- Source refs: `assets/models/ref/`
- PNG 对照: `assets/items/*.png` 不进微信包
