# Design

## Context

见 `proposal.md`。本变更只作用于 `apps/web` 的展示层，不改变数据流：浏览器经 Nitro
`server/api` 同源转发到 Spring，SSR 取数仍由 `useAsyncData` 完成；`admin`、
`@repo/*` 共享包与环境配置均不涉及。现有约束来自 `openspec/config.yaml`：TypeScript 6、
Vitest 5、Oxc 是唯一的 lint/format 工具链，不新增第二套工具链。

## Goals / Non-Goals

**Goals:**

- 把「生长手帐」主张落成可执行的 token 与组件语言，装饰全部受纪律约束。
- 重建 token 治理：palette → semantic 两层、零别名、零死 token、零裸字号。
- 保持 URL、表单字段、认证流程、数据流和无障碍语义完全不变。

**Non-Goals:**

- 不新增任何依赖（图标库、webfont、动画库、CSS 框架）。
- 不改动 `admin`、Spring、共享包、构建与测试配置。
- 不做功能增删；只换视觉与随之收敛的组件写法。

## Decisions

### D1. Token 单文件、两层、暗夜只换 palette

`app/assets/css/tokens.css` 仍是唯一来源。`:root` 定义 palette，semantic 变量只引用
palette；`:root[data-theme="dark"]` 仅覆盖 palette 值。删除旧别名层、status 层与死
token。字号、间距、圆角、阴影与动效时长同样 token 化；断点不依赖 CSS 变量，统一写成
`@media (min-width: 48rem)`，删除 `47.99rem`、`63.99rem`、`30rem` 与组件私有档。

替代方案：保留别名层做渐进迁移——被否决，别名正是当前"一个值四个名字"的根源。

### D2. 字体：系统楷体栈 + 系统黑体，零 webfont

标题使用 `"Kaiti SC", "STKaiti", "KaiTi", "楷体", serif` 且固定 400，配合
`font-synthesis-weight: none` 禁止伪粗；正文、按钮、数据使用系统黑体。跨平台差异由
字号、行高与留白兜底，而不是加载字体。

替代方案：加载思源宋体/手写体 webfont——被否决：体积与首屏成本，且与 no-webfont 约束冲突。

### D3. 组件就地重写，保留文件名与 props 契约

保留 `UiButton`、`TagRow`、`Ledger`、`FolioSection`、`UiPageHeader`、`UiFigure`、
`UiTimeline`、`UiEmptyState`、`UiAlert`、`UiConfirmDialog` 等文件名，重写其内部样式与
模板，页面改动面因此收敛为"换类名、删旧标记"。`Stamp` 组件删除，由新组件
`UiStatusChip`（彩点 + 中文词胶囊）取代；`FolioSection` 重写为全站唯一区块头
（props 收敛为标题与可选中文链接）。新增 `UiLeafMark`（内联叶形 SVG 集合，含导航图标与
占位叶形）与 `UiStreakCalendar`（打卡贴纸日历，手帐签名元素）。

替代方案：全部重命名组件——被否决：会同时改动 19 个页面与测试契约，收益仅是命名美观。

### D4. 装饰用 CSS 伪元素 + token，不建装饰组件

和纸胶带、纸面点纹、手绘下划线由统一工具类（`.tape`、`.paper-texture`、`.squig`）配合
token 实现，且只在约定组件内引用；贴纸徽章仅 `UiStreakCalendar` 与成就位使用。装饰参数
（宽高、角度、透明度、颜色轮换）全部写成 token，避免"每处胶带各写各的"。

替代方案：为每种装饰建 Vue 组件——被否决：会鼓励任意位置复用，违背装饰纪律。

### D5. 页面自造样式收敛为共享类

页面 `<style>` 中只允许布局（grid/flex）、间距引用 token 与极少量页面级定位；字段行、
对象卡、记录行、区块头、空态、错误一律走组件或共享类。首页删除自造的五种行结构与
档案条；`my-plants`、`care` 两页的类名前缀与结构向 `plants`、`adoptions` 对齐。

### D6. 测试策略

- 更新现有 token/对比度测试为新 palette 与阈值。
- 新增或扩展静态扫描测试：`app/` 下 `.vue`/`.css` 不得出现 `tokens.css` 之外的
  `#hex`、`rgb(`、裸 `font-size` 与未定义 `var(--*)`。
- `tests/nuxt` 中按旧类名/文案断言的用例，与页面改造同批更新，保持 spec 与测试一致。
- Vitest、覆盖率 include、tsconfig 与 Turbo 输入均不变。

### D7. 文档与长期规则

`docs/design/web-visual-system.md` 全文重写为《生长手帐视觉系统》（主张、调色板、
字阶、装饰纪律、组件语气、暗夜、动效、明确不做），与 OpenSpec 的
`web-visual-system` 能力互为说明与契约。

## Risks / Trade-offs

- [楷体在 Windows/macOS 渲染差异大] → 标题只用 400、依靠字号与留白分层；在 Windows 与
  macOS 各截图复核关键页面；若某平台渲染不可接受，改用系统圆体需另开变更。
- [装饰过多回到"乱"] → 装饰位置写入 spec 与 token，胶带/贴纸只允许出现在指定组件；
  实施时逐页截图复核，超出的装饰视为缺陷。
- [改动面广（18 组件、19 页面）] → 分四批落地，每批结束即跑 `lint`、`check-types`、
  `test` 并截图；任一批不通过不进入下一批。
- [既有测试按旧视觉契约断言] → 在 tasks 中显式列出同步更新测试，避免实施时遗漏。
- [叶绿与贴纸黄的对比度] → `leaf` 作文字色仅限 ≥14px 粗体或带下划线链接；对比度测试
  覆盖 day/night 两套 palette。

## Migration Plan

纯前端展示层替换，无数据或接口迁移。实施顺序：① token 层 + 壳层 → ② 组件层 →
③ 页面三批（植物·领养·养护 / 任务·积分·兑换 / 通知·反馈·我的·认证·404）→
④ 文档重写与死代码清理。每批独立提交；回滚按批 revert，不涉及数据回滚。
