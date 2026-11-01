# Design

## Context

学生端 `apps/web` 已有完整的 Nuxt 4 SSR 壳、认证流程、`useAsyncData` 取数和语义 CSS token。上一版视觉升级把页面壳固定成 30rem 手机列 + 底部导航，并把视觉落在“纸白 + 墨 + 细线”的宽泛台账上；实际结果是桌面端像一张拉宽的手机截图，细线没有形成可辨认的风格。

本次把壳改为桌面优先，并把视觉收束为「线装标本档案」：冷纸白、宋体标题、等宽数据、点引线、双线印章和一枚印泥红。学生端仍然是 `apps/web`，端口 4000；不新增前端应用。

约束：

- 颜色目前只在 `apps/web/app/assets/css/tokens.css` 定义，组件全部通过 `var()` 消费；这个单一来源必须保留。
- 学生端没有图片、插画或图标资源，且本期不引入 webfont、图标库或动画库。
- 320 / 375 / 768 无横向滚动、44px 触控目标、可见焦点、reduced-motion、safe-area 是既有硬约束。
- 现有测试断言了部分类名和文案，视觉升级不能破坏交互契约。
- admin、Spring、共享包不在本次范围内。

## Goals / Non-Goals

**Goals:**

- 建立桌面优先页面壳：网页顶栏、横向导航、最大 70rem 纸面、双栏档案布局；窄屏才使用底部导航。
- 建立「线装标本档案」视觉语言：纸色、1px/2px 线、宋体 display、等宽数据、点引线、方形记号和印泥红印章。
- 移除植物绿和大面积墨色填充；在养状态改用墨色双线印章。
- 建立 palette → semantic 两层 token，并提供日间/暗夜两套 palette；组件只消费 semantic 层。
- 提供主题切换：首帧无闪白、选择持久化、跟随系统偏好、可访问。
- 用一条可执行校验防止未定义 token、raw color、暗夜对比度不足再次混入。

**Non-Goals:**

- 不新增业务模块、导航入口或页面；绿植、任务、积分、兑换、通知、反馈仍留给后续变更。
- 不修改 URL、表单字段、认证、路由、数据流、API 或 Spring 接口。
- 不修改 `apps/admin`。
- 不引入中文 webfont、CDN 字体、图标库、UI 组件库、CSS-in-JS 或动画库。
- 不调整被测试锁定的文案；文案改动另开变更并同步 spec 与测试。
- 不为未实现模块提前放导航占位或死链。

## Decisions

### D1. Token 两层 + 双主题

`tokens.css` 先定义 palette（paper、sheet、ink、graphite、muted、rule、rule-strong、seal、seal-deep、washes），再定义 semantic（paper、sheet、ink、graphite、subtle、rule、rule-strong、seal、danger、focus、overlay、status）。`[data-theme="dark"]` 只覆盖 palette 和 `--color-on-seal`、`--shadow-overlay`，不复制 semantic 定义。

**为什么**：组件只认语义名，暗夜切换不会牵动组件；palette 是唯一允许出现原始色值的地方，审查时只看两层即可判断角色是否重叠。

**备选**：单层 token（否决：换主题时角色和色值混在一起）；CSS-in-JS 主题对象（否决：引入第二套工具链，违反 Oxc 单一工具链约束）。

### D2. 颜色角色

| 语义角色             | 日间      | 暗夜      | 职责                                 |
| -------------------- | --------- | --------- | ------------------------------------ |
| Paper 页面底         | `#F4F3EE` | `#1B1C18` | 全幅背景、顶层纸面                   |
| Sheet 表面           | `#FBFAF6` | `#22231E` | 输入、浮层、纸张表面                 |
| Ink 墨               | `#171714` | `#E8E6DC` | 正文、标题、强线、焦点、主按钮描边   |
| Graphite 石墨        | `#4C4C44` | `#B8B6AA` | 次级文字、未选中导航                 |
| Muted 灰墨           | `#6B6B61` | `#8F8D82` | 占位符、hint、日期、单位             |
| Rule 细线            | `#CFCEC6` | `#3A3B34` | 行线、装饰分组线                     |
| Rule-strong 交互边界 | `#8A8980` | `#74746C` | 输入框、次按钮、点引线；≥3:1         |
| Seal 印泥            | `#962D24` | `#D26757` | 卷号、页眉小方点、待处理、警示、印章 |
| Seal-deep 深绛       | `#6F1F19` | `#E08375` | 失败、不可逆、破坏性操作             |
| Ink-wash 墨洗        | `#EAE9E2` | `#2A2B25` | hover 底、禁用底                     |
| Seal-wash 印泥洗     | `#F3E7E3` | `#34221F` | 仅提示/浮层的极浅印泥底              |

**为什么**：上一版把绿色留给“生命状态”，但页面因此仍带着植物 App 的默认联想；线装档案用墨色印章表达在养，印泥红只做索引和警示，颜色职责更少、更明确。

**备选**：保留苔绿状态戳（否决：与“不要植物=绿色”的目标冲突）；另立靛青行动色（暂不采纳：当前操作密度低，墨色描边足够）。

### D3. 排版：宋体 display + 黑体正文 + 等宽数据

- Display：宋体栈 400，`clamp(2.5rem, 5vw, 3.75rem)` / 1.08 / `+0.02em`，每屏一个。
- Section：宋体 24px / 1.2，配 11px 等宽卷号和右侧英文标签。
- Body：系统黑体 400，16px / 1.65；次级正文 14px / 1.6。
- Data：`--font-mono` + `tabular-nums`；读数 `clamp(2.25rem, 4vw, 3.5rem)`，编号与日期 12–14px。
- Label：11px / 500 / `+0.18em`，只用于 2–6 个汉字或短编号。
- 不加载中文 webfont；`font-synthesis-weight: none`。

**为什么**：宋体在大字号下的横细竖粗本身就是“线条”，比继续堆细线更能形成识别；黑体正文保证小字号可读；等宽数字把积分、编号、日期变成档案数据。

**备选**：全站宋体（否决：小字号中文屏显发虚）；奶油 + 衬线 + 陶土（否决：AI 默认皮肤）；引入拉丁展示字体（暂不采纳：收益只在数字和短标签）。

### D4. 桌面优先页面壳

- `≥48rem`：72px 纸色顶栏，字标 + 横向导航 + 主题切换；内容最大 70rem；首页和“我的”使用双栏；页脚一行等宽说明。
- `<48rem`：56px 压缩顶栏（字标 + 主题切换）+ 底部导航；内容单栏。
- 页面壳不再设置 30rem 最大宽度。

**为什么**：学生端是 Web 应用，桌面是第一现场；30rem 手机列会让 768px 以上屏幕中央出现一条窄带，底部导航在桌面上也没有意义。

**备选**：保留 30rem 但加宽到 48rem（否决：仍是手机壳）；桌面做侧边栏（否决：当前只有两个导航项，侧栏会显得空）。

### D5. 表面：线、双线、点引线

- 默认零阴影；卡片、输入、导航、印章全部靠线分层。
- 顶栏下方使用“1px + 3px 间隔 + 1px”的双细线；页眉下方使用 2px 墨线。
- 字段行使用方形套印记号 + 点引线，不用卡片。
- 圆角只用 0 / 2px；圆形只给主题标记和加载环。
- 可点击边界至少 `--color-rule-strong`（对纸面 3:1）；装饰线才用 `--color-rule`。
- 只有对话框和浮层使用 `--shadow-overlay`，且必须有 1px 墨框。

**为什么**：线装档案的层级来自纸、线和留白；去掉填充块和阴影后，页面不再像“白卡片模板”，也避免大块黑底。

### D6. 招牌结构：TagRow / Stamp / Ledger / FolioSection

- `TagRow`：方形套印记号 + 11px 标签 + 点引线 + 值（数字/编号等宽）+ 右侧编号/日期 + 可选双线印章；无卡片、无阴影。
- `Stamp`：1px 内框 + 1px 外框、等宽小字、-1.2° 旋转；文字 + 线型 + 颜色三重表达。
- `Ledger`：多条字段行的容器，负责行线和收尾。
- `FolioSection`：`卷号 + 宋体标题 + 右侧英文标签`，负责档案区块头。

未来模块复用同一结构，只换编号前缀：`PL` 植株、`TK` 任务、`PT` 积分流水、`OD` 兑换单、`NT` 通知、`FB` 反馈。

**为什么**：当前仓库没有图片，视觉识别必须来自结构；字段行同时承载标签、值、编号和状态，正好对应“领养要审核、积分有流水、兑换有截止”的信息结构。

### D7. 状态语法

- 整页错误：2px 深绛左线 + 墨色标题 + 具体原因 + “重试”。
- 区块错误：1px 深绛线 + 深绛文字。
- 字段错误：12px 深绛文字 + `aria-describedby` + `role="alert"`；错误文案替换 hint。
- success：墨色 2px 左线 + “已保存/已通过”。
- warning：1px 虚线印泥框 + “待你处理”。
- 禁用：ink-wash 底 + 虚线边界 + muted 文字，不得只降 opacity。
- 焦点：2px 墨 outline + 2px offset；任何组件不得写 `outline: none`。

### D8. 暗夜模式

- `<html data-theme="light|dark">`；`nuxt.config.ts` 的内联脚本在绘制前读取 `localStorage["student-theme"]`，否则跟随 `prefers-color-scheme`。
- `useTheme` 用 `useState` 保存当前主题；`ThemeToggle` 按钮有 `aria-pressed` 和“暗夜/日间”文案。
- 暗夜纸色是 `#1B1C18`，不是纯黑；墨色变浅，印泥红提亮；双线、点引线和印章保持可见。
- 主题选择持久化；存储不可用时只在当前页面生效。

**为什么**：暗夜是用户明确要求的独立能力；把首帧脚本放在 head 里可以避免刷新时先亮后暗，`data-theme` 也让所有组件无需感知主题。

### D9. 动效

- 只解释状态变化：按下 90ms、颜色/边框 140ms、浮层进入 180ms / 退出 120ms。
- 总时长 ≤220ms，位移 ≤8px。
- 禁止数字滚动、刻度生长、庆祝、抖动、骨架脉冲、持续装饰动画。
- 全部用 CSS transition，自动继承 `prefers-reduced-motion` 降级。

### D10. Token 校验

新增 Vitest 校验：

1. 扫描 `apps/web/app/**/*.vue` 和 `base.css` 中出现的 `var(--*)`，每个变量必须在 `tokens.css` 中有定义。
2. 扫描组件 scoped style 中的十六进制/rgb 颜色，除 `tokens.css` 外不得出现。
3. 分别解析日间与暗夜 palette，校验正文、次级文字、印泥红、交互边界的对比度。

**为什么**：上一版 404 页使用了未定义的 `--font-size-3xl`，`--color-focus` 还是遗留蓝色；构建和类型检查都不会报这类问题，必须用测试兜住。暗夜是新增色板，也需要独立对比度校验。

### D11. 保留交互契约

只改容器、排版角色、页面壳和状态语法，不改模板中的字段、事件、路由和文案。保留 `.app-shell`、`.auth-layout`、`.ui-bottom-nav`、`.ui-bottom-nav__link--active`、`.ui-alert`、`.ui-code` 等被测试断言的类名，以及“你好，”“暂无在养绿植”“未填写”等文案。主题切换是新增按钮，不移除任何已有入口。

## Data flow

本次不改变 admin、web 与 Spring 之间的数据流：

- 浏览器请求仍走同源 `/api/v1/*`，由 web 的 Nitro `server/api/[...path].ts` 转发到 Spring，保留前缀。
- SSR 取数仍由 Nuxt 服务端通过 `runtimeConfig.springApiOrigin` 直接访问 Spring，首页和“我的”继续使用 `useAsyncData`。
- admin 继续由 Vite 开发代理直连 Spring；本次不修改 admin，也不引入跨应用导入。
- 共享包 `@repo/http-client`、`@repo/env` 不变；本次不新增共享运行时包，不读取环境变量。
- 主题偏好只存在浏览器 `localStorage`，不进入 API、Cookie 或共享包。

## Testing and tooling impact

- 新增测试放在 `apps/web/tests/nuxt/**/*.test.ts`，沿用现有 Vitest include，不修改 `apps/web/vitest.config.ts`。
- 不新增依赖，不改 tsconfig、覆盖率 include 路径或 Turbo 输入；`$TURBO_DEFAULT$` 已覆盖 `apps/web` 源码变化。
- 保持 Oxc（oxlint/oxfmt）为唯一 lint/format 工具链，不引入 ESLint、Prettier、Stylelint 或第二套格式化工具。
- 验证命令：`pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test`、`pnpm --filter web build`；完成后运行根目录 `pnpm verify`。
- 浏览器检查：1440 / 768 / 375 / 320 的日间与暗夜截图、主题切换、刷新保持、键盘焦点、reduced-motion、灰度区分。

## Risks / Trade-offs

- [宋体在部分 Android/Linux 设备缺失] → 回落到通用 serif；标题仍有字号和字距差异，不会退回黑体。真机检查后如字形明显不一致，再评估本地宋体子集，不引入整包 webfont。
- [印泥红用得多会变装饰] → 只允许卷号、页眉方点、状态和印章使用；大面积印泥底不超过两块；文档写死这条纪律。
- [点引线在低分辨率屏上断断续续] → 使用 1px dotted + `--color-rule-strong`；320px 下允许收短，不隐藏。
- [暗夜纸色对比不足] → token 测试同时跑日间/暗夜；印泥红在暗夜提亮到 `#D26757`，交互边界提亮到 `#74746C`。
- [桌面双栏在 768px 偏挤] → 48rem 起双栏，低于 48rem 单栏；320px 下字段行编号/印章换行。
- [测试锁定文案] → 本期保留原文案，只改容器与排版；文案变更另开变更并同步 spec 与测试。
- [顶栏只有两个导航项，桌面显得空] → 用字标、双线、右侧主题切换和页脚构成完整页头；模块上线后再增加导航项。

## Migration Plan

1. **token 层**：重写 `tokens.css` 为 palette → semantic 两层；新增宋体栈、display/measure 字号、线宽、双主题 palette；把 `--color-focus` 改为墨色；保留旧变量名别名。
2. **base / forms**：纸色底、墨色字、墨色焦点、全局 tabular-nums；输入改直角、1px 交互边界、48px 高。
3. **壳层**：`default.vue` 增加桌面顶栏、双细线、页脚和主题切换；`UiBottomNav` 只在窄屏显示；`auth.vue` 改为左右分栏线框，增加主题切换。
4. **primitives**：按钮五态改线框；`TagRow` 增加点引线、方形记号；`Stamp` 改双线；新增 `FolioSection`、`ThemeToggle`；`UiAlert`/`UiEmptyState`/`UiConfirmDialog` 去填充、去圆角。
5. **pages**：首页和“我的”改双栏档案布局；登录/注册改纸质表单；404 改未登记档案页。
6. **验证**：日间/暗夜对比度、320/375/768/1440 截图、主题切换与刷新、键盘 Tab、reduced-motion、现有测试、生产构建。

回滚策略：本次没有数据迁移和接口变更，回滚只需还原 `apps/web` 内的 token、组件、布局和页面样式文件；不影响 Spring、admin 或环境配置。

## Open Questions

- 未来主导航是 4 项还是 5 项？本期只有“首页/我的”，不影响当前实现；模块上线前需要产品确认。
- admin 是否愿意共享状态词表与等宽数字（不改 antd 外壳）？这是后续独立变更，不影响本次学生端落地。
- 宋体标题在 iOS/Android 真机的实际字形是否需要进一步收敛？先以系统字体上线，收集截图后再决定。
