# Design System

> Sort-King UI 设计规范
>
> 本文档用于统一 Sort-King 的 UI 视觉与交互表现。
>
> **Design.md 只负责 UI 设计，不负责玩法、代码架构、资源制作或技术实现。**

---

# 1. Design Principles

## 1.1 核心目标

Sort-King 的 UI 应做到：

* 一眼看懂
* 一眼知道可以点什么
* 一眼知道当前状态
* 操作后立即获得反馈
* 不干扰核心游戏区域

整体 UI 风格：

* 简单
* 清爽
* 圆润
* 轻松
* 友好
* 有玩具感

---

## 1.2 UI 优先级

所有 UI 设计遵循：

```text
可读性
  ↓
可操作性
  ↓
视觉层级
  ↓
统一性
  ↓
装饰性
```

不能为了视觉效果牺牲操作体验。

---

## 1.3 极低认知负担

Sort-King 是休闲小游戏。

UI 不应该要求玩家学习复杂规则。

优先使用：

```text
图形
+
颜色
+
简单文字
+
直接反馈
```

避免：

* 大段说明
* 复杂提示
* 多层菜单
* 过多按钮
* 过多状态信息

---

# 2. Design Tokens

所有 UI 应使用统一的视觉 Token。

---

# 2.1 Color

UI 颜色分为两类：

```text
UI Colors
Game Colors
```

两者必须区分。

---

## 2.1.1 UI Colors

基础 UI 颜色角色：

```text
Primary
Secondary
Background
Surface
TextPrimary
TextSecondary
TextDisabled
Border
Success
Warning
Error
```

### Primary

用于：

* 主要按钮
* 主要 CTA
* 当前最重要的操作

### Secondary

用于：

* 次要按钮
* 辅助操作

### Background

用于：

* 页面背景
* 游戏整体背景

### Surface

用于：

* 面板
* 卡片
* Dialog

### TextPrimary

用于：

* 标题
* 核心数字
* 重要文字

### TextSecondary

用于：

* 辅助说明
* 次要信息

### TextDisabled

用于：

* Disabled 状态

### Success

用于：

* 正确
* 完成
* 成功反馈

### Warning

用于：

* 注意
* 警告

### Error

用于：

* 错误
* 无效操作

---

# 2.2 Game Colors

分类颜色属于游戏内容视觉体系。

分类颜色必须保持稳定。

当前游戏分类颜色来自现有分类数据，不得由 UI 单独重新定义。

当前垂直切片使用：

```text
Fruit
Sport
Vehicle
```

分类颜色用于表达：

* 分类盒
* 分类标识
* 分类相关 UI

### 规则

同一个分类必须始终保持相同的颜色语义。

例如：

```text
Fruit
→ 始终使用 Fruit 的分类色

Sport
→ 始终使用 Sport 的分类色

Vehicle
→ 始终使用 Vehicle 的分类色
```

禁止：

```text
同一个分类
在不同页面使用不同颜色
```

UI 不得覆盖或重新定义游戏分类颜色。

---

# 2.3 Typography

统一使用以下文字层级：

```text
Display
Title
Subtitle
Body
Caption
Button
Number
```

---

## Display

用于：

* 游戏标题
* 重要结果
* 特别重要的数字

---

## Title

用于：

* 页面标题
* Dialog 标题
* 主要区域标题

---

## Subtitle

用于：

* 次级标题
* 辅助标题

---

## Body

用于：

* 普通文字
* 说明

---

## Caption

用于：

* 次要说明
* 辅助信息

---

## Button

按钮文字：

* 简短
* 清晰
* 易识别

推荐：

```text
开始
继续
下一关
重玩
设置
返回
确认
取消
```

---

## Number

游戏数字优先使用独立数字层级。

包括：

```text
Score
Streak
Level
Count
Progress
```

重要数字应该明显高于普通正文。

---

# 2.4 Spacing

统一间距体系：

```text
4
8
12
16
20
24
32
40
48
64
```

推荐：

```text
4   → 极小间距
8   → 紧凑间距
12  → 组件内部
16  → 普通组件间距
20  → 内容间距
24  → 区域间距
32  → 大区域间距
48  → 页面级间距
64  → 大型留白
```

避免大量使用：

```text
13
17
19
23
27
31
```

等无规律数字。

---

# 2.5 Corner Radius

整体 UI 使用圆润风格。

```text
Small   = 8
Medium  = 12
Large   = 16
XLarge  = 20
Round   = 999
```

推荐：

```text
Button  → 12~16
Card    → 16
Dialog  → 20
Badge   → 999
```

同一页面不得随意出现大量不同圆角。

---

# 2.6 Shadow

阴影用于表达 UI 层级。

```text
普通组件 → 弱
浮动组件 → 中
Dialog   → 强
```

阴影应该：

* 柔和
* 克制
* 清晰

禁止：

* 硬边黑色阴影
* 过重阴影
* 大面积发光
* 多层复杂阴影

---

# 3. Screen Layout

Sort-King 为竖屏小游戏。

UI 布局应围绕：

```text
顶部信息区域
        ↓
核心游戏区域
        ↓
底部操作区域
```

进行设计。

---

# 3.1 Safe Area

UI 必须考虑：

* 顶部安全区域
* 刘海
* 系统状态区域
* 底部手势区域

重要按钮、文字、信息不得紧贴屏幕边缘。

---

# 3.2 核心游戏区域

核心游戏区域拥有最高视觉优先级。

UI 不得无意义遮挡：

* 游戏物品
* 分类盒
* 玩家主要操作区域

---

# 3.3 UI Layer

统一层级：

```text
Background
    ↓
Game Content
    ↓
HUD
    ↓
Overlay
    ↓
Dialog
    ↓
Toast
```

高层 UI 不得被低层 UI 遮挡。

---

# 4. Core Game UI

当前垂直切片的 UI 核心围绕：

```text
Score
Streak
Goal
Category Bin
Hand
Pause
```

展开。

---

# 4.1 Score

Score 是游戏过程中的核心反馈之一。

要求：

* 清晰
* 易读取
* 不遮挡游戏区域
* 数字视觉权重高于普通文字

Score 变化可以使用轻微动画强化反馈。

但不得产生长时间动画。

---

# 4.2 Streak

连续正确操作可以通过 Streak 表现。

Streak 的视觉权重：

```text
Score > Streak > 普通辅助信息
```

Streak 应该：

* 容易理解
* 不抢夺 Score 的视觉主体地位
* 连续成功时提供积极反馈

没有连续状态时，不应制造大量视觉噪音。

---

# 4.3 Goal

Goal 用于告诉玩家当前阶段目标。

当前垂直切片存在：

```text
Fill 5 to clear
装满 5 个消除
```

Goal 文案应该：

* 短
* 直接
* 容易理解

不要使用复杂说明。

---

# 4.4 Pause

Pause 属于辅助操作。

视觉权重应低于：

```text
Score
Game Content
Primary Action
```

Pause 不应该占据大量空间。

---

# 5. Category Bin UI

分类盒是游戏核心 UI / Game Object 表现之一。

分类盒必须让玩家快速识别：

> 这个盒子应该放什么。

---

# 5.1 分类识别

分类盒可以通过：

```text
颜色
图形
文字
```

表达分类。

优先保证：

```text
视觉识别 > 文字阅读
```

---

# 5.2 分类颜色

分类盒必须使用对应分类颜色。

例如：

```text
Fruit
Sport
Vehicle
```

颜色必须稳定。

同一分类不能因为：

* 页面变化
* 关卡变化
* 状态变化

而改变基础分类色。

---

# 5.3 分类名称

分类名称应：

* 简短
* 清晰
* 容易阅读

不要使用长句。

---

# 5.4 Capacity

分类盒容量状态必须容易理解。

当前核心容量：

```text
5
```

玩家应能够快速感知：

```text
当前已有多少
距离装满还有多少
```

不需要复杂文字解释。

---

# 5.5 Filled

分类盒装满时属于重要游戏反馈。

视觉表现应该：

```text
明确
快速
积极
```

不要使用复杂阻塞动画。

---

# 6. Hand UI

玩家当前可操作物品区域属于核心操作区域。

Hand UI 必须：

* 容易点击
* 容易拖拽
* 卡片之间有足够间距
* 不互相遮挡
* 不被其他 UI 覆盖

---

# 6.1 Item

Item 的 UI 表现必须突出：

```text
物品本身
```

而不是复杂 UI 边框。

玩家应该第一眼看到：

> 这是什么东西。

---

# 6.2 Item State

至少考虑：

```text
Normal
Picked
Dragging
Returning
Placed
```

不同状态之间需要存在明确但轻量的视觉区别。

---

# 6.3 Picked

玩家拿起物品时，可以使用：

* 轻微放大
* 轻微抬升
* 阴影变化

目的：

> 让玩家明确知道“我拿起来了”。

---

# 6.4 Dragging

拖拽状态应突出当前物品。

不要让拖拽物品被：

* HUD
* Dialog
* 其他 UI

遮挡。

---

# 7. Game Feedback

游戏反馈是当前 UI 设计的重要组成部分。

核心反馈：

```text
Picked
Correct
Wrong
Filled
Score Changed
Streak Changed
```

---

# 7.1 Correct

正确操作必须产生明确正反馈。

推荐组合：

```text
物品进入分类盒
+
轻微视觉反馈
+
Score 增加
+
必要时 Streak 增加
```

反馈应快速完成。

---

# 7.2 Wrong

错误操作必须让玩家知道：

> 这个分类不对。

当前实现已经存在错误分类反馈，包括：

* 分类盒闪烁
* Toast
* 轻微震动
* 错误音效

UI 设计应保持这种反馈方向，但不要叠加大量额外效果。

错误反馈原则：

```text
明确
短暂
不惩罚
不打断连续操作
```

---

# 7.3 Score Changed

Score 增加时可以使用轻微强调：

```text
数字变化
轻微缩放
轻微位移
```

不要使用：

* 大幅跳动
* 长时间动画
* 屏幕级特效

---

# 7.4 Streak Changed

Streak 增加可以提供积极反馈。

反馈强度应该随着连续成功适度增加。

但必须保持克制。

---

# 7.5 Filled

分类盒达到容量后，应立即让玩家知道：

> 这一盒完成了。

推荐：

```text
完成反馈
+
清除反馈
+
继续游戏
```

整个反馈过程应该快速。

---

# 8. Toast

Toast 用于短暂信息反馈。

适合：

```text
操作成功
操作失败
暂不可用
```

Toast 文案必须短。

例如：

```text
分类错误
操作成功
再试一次
```

---

## 8.1 Toast 原则

Toast：

* 不遮挡核心游戏区域
* 不持续过久
* 不承载复杂内容
* 不要求玩家进行选择

当前错误提示已经使用短暂 Toast，保持这种方向。

---

# 9. Dialog

Dialog 只用于需要玩家明确处理的状态。

结构：

```text
Overlay
    ↓
Dialog
    ↓
Title
    ↓
Content
    ↓
Actions
```

适合：

* 暂停
* 设置
* 重要确认
* 结果

不应该把普通提示全部做成 Dialog。

---

# 10. Button

按钮分为：

```text
Primary
Secondary
Icon
```

---

## Primary

用于当前最重要操作：

```text
开始
继续
下一关
```

原则上一个页面只有一个主要 CTA。

---

## Secondary

用于次级操作：

```text
重玩
返回
取消
设置
```

---

## Icon

用于简单操作：

```text
暂停
关闭
返回
声音
设置
```

Icon 必须容易理解。

---

# 11. Button States

按钮至少支持：

```text
Normal
Pressed
Disabled
Selected
```

---

## Normal

默认状态。

---

## Pressed

按下时提供轻微反馈。

例如：

```text
Scale
Position
Shadow
```

只允许轻微变化。

---

## Disabled

必须明显区别于 Normal。

但不能使用过于刺眼的视觉效果。

---

# 12. UI Animation

UI 动画只服务于：

```text
操作反馈
状态变化
视觉层级
引导
```

不为了“看起来丰富”而增加动画。

---

# 12.1 Animation Principles

动画应该：

* 快
* 轻
* 明确
* 不阻塞操作

---

# 12.2 推荐动画

出现：

```text
Fade In
Scale In
```

消失：

```text
Fade Out
Scale Out
```

按钮：

```text
轻微缩放
轻微位移
```

数字：

```text
轻微强调
```

---

# 12.3 禁止动画

禁止：

* 长时间等待
* 大幅旋转
* 无限循环装饰
* 大量 UI 同时运动
* 阻塞玩家下一次操作

---

# 13. Responsive

UI 必须适配不同竖屏设备。

必须考虑：

```text
屏幕比例
Safe Area
顶部区域
底部区域
核心游戏区域
```

禁止：

* 假设固定屏幕尺寸
* 重要 UI 紧贴边缘
* 重要按钮因为比例变化被遮挡
* UI 挤压核心游戏区域

---

# 14. Visual Hierarchy

每个页面必须具有明确的视觉层级。

游戏过程中：

```text
Game Content
    ↓
Score / Core Status
    ↓
Primary Action
    ↓
Secondary UI
    ↓
Decorative UI
```

装饰元素永远不能超过核心游戏内容的视觉权重。

---

# 15. UI Density

Sort-King 应保持低 UI 密度。

优先：

```text
少
而清晰
```

而不是：

```text
多
而复杂
```

禁止为了“看起来丰富”增加：

* 无意义按钮
* 无意义标签
* 无意义图标
* 无意义数字
* 无意义装饰

---

# 16. Empty Space

留白属于设计的一部分。

不要为了填满屏幕：

* 增加文字
* 增加按钮
* 增加图标
* 增加装饰

适当留白能够提升：

* 可读性
* 视觉层级
* 操作准确性
* 整体质感

---

# 17. Accessibility

UI 必须保持基本可识别性。

特别注意：

* 文字与背景具有足够对比度
* Button 状态明显
* Disabled 状态明显
* 重要信息不能只依赖颜色
* Icon 不应成为唯一的信息表达方式

分类颜色可以作为辅助识别，但不能成为唯一识别方式。

---

# 18. UI Consistency

相同功能必须保持相同表现。

例如：

```text
所有 Primary Button
→ 相同视觉体系

所有 Dialog
→ 相同视觉体系

所有 Toast
→ 相同视觉体系

所有 Score
→ 相同视觉体系

所有分类盒
→ 使用统一分类视觉体系
```

不得因为某一个页面而重新设计一套完全不同的 UI。

---

# 19. New UI

新增 UI 时优先：

```text
已有组件
    ↓
已有 Design Token
    ↓
已有布局模式
    ↓
最小必要扩展
```

不要为了一个小需求创造完整的新 UI 风格。

---

# 20. UI Anti-Patterns

禁止：

1. 随意增加颜色
2. 随意增加字号
3. 随意增加圆角
4. 随意增加按钮样式
5. 同一个功能使用不同视觉表现
6. UI 遮挡核心游戏区域
7. 使用过重阴影
8. 使用大量动画
9. 使用过长文字
10. 使用复杂弹窗
11. 使用大量无意义装饰
12. 使用完全不同风格的 Icon
13. 为了“丰富”而堆 UI
14. 用颜色作为唯一状态表达
15. 让 UI 的视觉权重超过游戏核心内容

---

# 21. Current Vertical Slice UI Baseline

当前 3D 垂直切片的 UI 基准：

```text
┌─────────────────────┐
│ Score      Goal     │
│                     │
│                     │
│    Game Content     │
│                     │
│  Category  Category │
│  Bin       Bin      │
│                     │
│       Category      │
│         Bin         │
│                     │
│                     │
│  Item  Item  Item   │
│      Item           │
└─────────────────────┘
```

具体位置可以根据实际场景调整，但必须保持：

```text
核心游戏区域 > HUD > 辅助 UI
```

---

# 22. Final Standard

Sort-King UI 的最终目标：

```text
第一眼
→ 看懂

第二眼
→ 知道怎么操作

操作之后
→ 马上得到反馈

连续操作
→ 不被 UI 打断

整个游戏
→ 始终像同一个产品
```

最终标准：

> **简单到几乎不需要学习，统一到玩家不会注意到 UI 在“设计”。**
