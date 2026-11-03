# Tasks

## 1. Token 层与全局样式

- [x] 1.1 重写 `app/assets/css/tokens.css`：palette → semantic 两层，日间/暗夜两套色板，字阶、间距、圆角、阴影、动效全部 token 化；删除旧别名层、status 层与死 token；验证：文件内无别名段，`pnpm --filter web lint` 通过
- [x] 1.2 重写 `app/assets/css/base.css`：楷体标题栈（400、禁用伪粗）、黑体正文栈、`::focus-visible` 2px 叶绿外圈、`prefers-reduced-motion` 降级、纸面点纹工具类；验证：`pnpm --filter web lint` 通过，页面标题渲染为楷体
- [x] 1.3 重写 `app/assets/css/forms.css`：输入 12px 圆角、聚焦 2px 叶绿、错误 blush 边框、禁用三态（底/线/字）；验证：登录页输入框聚焦与错误态截图符合 spec
- [x] 1.4 更新并扩展 token 测试：未定义 `var(--*)` 报错、`tokens.css` 外裸色值与裸 `font-size` 扫描、日间/暗夜对比度阈值；验证：`pnpm --filter web test` 通过，故意写入一个裸色值会被测试拦截

## 2. 壳层与导航

- [x] 2.1 重写 `app/layouts/default.vue` 顶栏：奶油纸、虚线底边、楷体字标、导航当前项叶绿文字 + 2px 下划线、页脚；验证：1440px 与 768px 截图与 spec 一致
- [x] 2.2 重写底部导航：5 个内联叶形 SVG、当前项叶绿、1px 顶线、44px 触控目标；验证：375px 截图无横向滚动，`aria-current="page"` 存在
- [x] 2.3 重写 `app/layouts/auth.vue` 并对齐登录、注册、404 页壳：每屏只有一个楷体大标题；验证：320/375/768/1440 四档截图无横向滚动
- [x] 2.4 同步更新 `tests/nuxt` 中与壳层类名、导航文案相关的断言；验证：`pnpm --filter web test` 通过

## 3. 组件层

- [x] 3.1 重写 `UiButton`：叶绿填充主按钮、1px 次按钮、叶绿文字按钮、blush 描边破坏按钮与禁用态；验证：组件页面截图与 `pnpm --filter web lint` 通过
- [x] 3.2 统一输入族（`UiTextInput`、`UiPasswordInput`、`UiTextArea`、`UiField`、`UiCodeField`）的聚焦、错误与禁用样式；验证：表单页逐态截图，错误只出现一种形态
- [x] 3.3 新增 `UiStatusChip`（彩点 + 中文词），全站移除 `Stamp` 及其引用；验证：`grep -r "Stamp" apps/web/app` 为零，状态页截图符合 spec
- [x] 3.4 重写 `FolioSection` 为全站唯一区块头（楷体标题 + 可选中文链接），重写 `TagRow` 为字段行、`Ledger` 为行组收尾；验证：`grep -r "点引线\|方印\|卷号" apps/web/app` 为零，任意页区块头结构一致
- [x] 3.5 新增 `UiLeafMark`（内联叶形 SVG 集合）与 `UiStreakCalendar`（打卡贴纸日历，含落定动画与 reduced-motion 降级）；验证：`my-plants` 页日历截图，减少动态效果下无动画
- [x] 3.6 重写 `UiFigure`、`UiTimeline`、`UiEmptyState`、`UiAlert`、`UiConfirmDialog`、`UiImagePicker` 为手帐语气；验证：图框三态、空态、错误、对话框、上传预览逐项截图符合 spec
- [x] 3.7 同步更新组件相关测试与快照断言；验证：`pnpm --filter web test` 与 `pnpm --filter web check-types` 通过

## 4. 页面层（三批）

- [x] 4.1 批次一：首页与植物·领养·养护共 8 页（`index`、`plants/*`、`adoptions/*`、`my-plants/*`、`care/*`）改为手帐组件语言，首页删除五种自造行结构与档案条；验证：明暗两套截图逐页复核，`pnpm --filter web test` 通过
- [x] 4.2 批次二：任务·积分·兑换共 6 页（`tasks/*`、`points`、`rewards/*`）改用统一区块头、字段行与列表节奏，读数统一为数据角色；验证：截图复核与 `pnpm --filter web test` 通过
- [x] 4.3 批次三：通知、反馈、我的、登录、注册、404 共 8 页完成换皮，编号只作小字辅助；验证：截图复核与 `pnpm --filter web test` 通过
- [x] 4.4 每批同步更新对应 `tests/nuxt` 断言（类名、可访问名称、文案），确保 spec 与测试一致；验证：每批结束后 `pnpm --filter web check-types`、`pnpm --filter web test` 通过

## 5. 集成验收

- [x] 5.1 重写 `docs/design/web-visual-system.md` 为《生长手帐视觉系统》，与 `openspec/specs/web-visual-system/spec.md` 内容一致；验证：文档中的 token 名称与 `tokens.css` 完全对应
- [x] 5.2 全站静态扫描：`tokens.css` 外无裸 `#hex`、`rgb(`、裸 `font-size`、未定义 `var(--*)`、旧类名（`ui-stamp`、`ui-tag-row__punch`）；验证：扫描命令输出为零
- [x] 5.3 明暗两套逐页截图复核：无第二套区块头/行结构/空态语言，320/375/768/1440 四档无横向滚动，触控目标 ≥44px；验证：截图清单逐页勾选
- [x] 5.4 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test`，全部通过；验证：三条命令退出码为 0

## Workflow follow-up

- 评审通过后按项目流程归档本次变更（`openspec archive`）。
- 归档后复核主 spec 中的 `web-visual-system` 与 `web-shell` 需求已合并。
