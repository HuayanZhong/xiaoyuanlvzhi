# Tasks

## 1. Token 层

- [x] 1.1 重写 `tokens.css` 为 palette → semantic 两层：paper、sheet、ink、graphite、muted、rule、rule-strong、seal、seal-deep、ink-wash、seal-wash、overlay；保留旧变量名别名；验证：现有组件仍能解析，`--color-focus` 使用墨色。
- [x] 1.2 增加 `[data-theme="dark"]` palette 覆盖：深纸 `#1B1C18`、浅墨、提亮印泥红与交互边界；`--color-on-seal` 单独控制印章文字；验证：日间/暗夜切换只改 palette 和少量语义值。
- [x] 1.3 增加宋体栈 `--font-serif`、display `clamp(2.5rem, 5vw, 3.75rem)`、measure `clamp(2.25rem, 4vw, 3.5rem)`、`--layout-max-width: 70rem`、`--layout-gutter`、`--masthead-height`、线宽与直角 token；验证：页面标题在任意断点大于读数。
- [x] 1.4 扩展 `tokens.test.ts`：扫描未定义 `var(--*)`、组件 raw color，并分别校验日间/暗夜正文、次级文字、印泥红、交互边界对比度；验证：删除任一 token 或降低暗夜对比度时测试失败。
- [x] 1.5 重写 `docs/design/web-visual-system.md`，记录线装档案主张、双主题 palette、字号、页面壳、印章、字段行、暗夜模式和明确不做的列表；验证：文档色值与 `tokens.css` 一致，`AGENTS.md` 链接可打开。

## 2. Base 与表单

- [x] 2.1 `base.css` 改纸色底、墨色字、墨色焦点、1px 下划线链接、selection 和 `font-synthesis-weight: none`；验证：登录、注册、404 无遗留蓝色或绿色。
- [x] 2.2 保留全局 `tabular-nums`、2px outline + 2px offset 和 `prefers-reduced-motion` 降级；验证：键盘焦点可见，减少动态效果下无位移动画。
- [x] 2.3 `forms.css` 改 48px 直角输入、sheet 底、1px 交互边界、墨色 focus 边界、深绛错误边界、ink-wash 虚线禁用；验证：三个输入组件和验证码按钮状态一致。

## 3. Primitives

- [x] 3.1 `UiButton` 改线框五态：主按钮 2px 墨描边、次按钮 1px 交互边界、幽灵下划线、危险 1px 深绛描边、禁用 ink-wash + 虚线；不再使用填充色块。
- [x] 3.2 `UiTextInput`、`UiPasswordInput`、`UiCodeField` 统一 `.ui-control`，去掉圆角并保留 44px 以上触控目标；验证：组件测试通过。
- [x] 3.3 `UiField` 统一 11px 字距标签、hint 和 `UiInlineError`，错误文案替换 hint；验证：`aria-describedby` 与 `role="alert"` 保留。
- [x] 3.4 `UiAlert` 改线条语气：错误 2px 深绛左线、成功墨色左线、信息 1px 边界、warning 虚线印泥框；不再使用整块浅红底。
- [x] 3.5 `UiLoading` 改 1rem/1.5px `currentcolor` 旋转，保留 `role="status"`；验证：减少动态效果下停止。
- [x] 3.6 `TagRow` 改为方形套印记号 + 11px 标签 + 点引线 + 值 + 编号/日期 + 可选双线印章；验证：组件测试断言 `.ui-tag-row__punch`、值、编号和印章；320px 无溢出。
- [x] 3.7 `Ledger` 保持字段行容器，去掉末行行线；验证：空列表、单行、多行测试通过。
- [x] 3.8 `Stamp` 改 1px 内框 + 1px 外框、等宽小字、-1.2° 旋转；alive 用墨色、pending 用印泥红、danger 用深绛虚线；检验：灰度下仍靠文字和线型区分。
- [x] 3.9 新增 `FolioSection`：卷号 + 宋体标题 + 右侧等宽英文标签 + 1px 底线；验证：首页和“我的”复用一个组件。
- [x] 3.10 `UiEmptyState` 改虚线空档框、方形记号、宋体标题；保留“未登记”“暂无在养绿植”文案。
- [x] 3.11 `UiConfirmDialog` 改 1px 墨框、直角、sheet 底和唯一浮层阴影；保留 Esc 关闭与焦点行为。

## 4. 页面壳与主题

- [x] 4.1 `default.vue` 在 ≥48rem 渲染纸色顶栏、字标、横向导航、主题切换、双细线、70rem 内容纸面和页脚；验证：768/1440 不显示底部导航。
- [x] 4.2 窄屏渲染 56px 压缩顶栏（字标 + 主题切换），隐藏横向导航和英文副标；`UiBottomNav` 只在 <48rem 显示；验证：320/375 无横向滚动。
- [x] 4.3 `auth.vue` 改左右分栏线框：左侧宋体主张 + 描边“植”水印 + 竖线，右侧纸质表单；右上角固定主题切换；验证：登录、注册、404 在 375 和 1440 下成立。
- [x] 4.4 新增 `useTheme` 和 `ThemeToggle`：`localStorage["student-theme"]`、`data-theme`、跟随 `prefers-color-scheme`、`aria-pressed`、44px 命中区；`nuxt.config.ts` 增加绘制前内联脚本避免闪白。
- [x] 4.5 新增 `theme-toggle.test.ts`，断言按钮文案、`aria-pressed` 和点击切换；验证：测试通过。

## 5. Pages

- [x] 5.1 `index.vue` 改双栏档案页：页眉卷号 + 宋体问候 + 档案编号；“01 在养记录”读数/空态；“02 积分余额”读数；底部档案摘要条；保留“你好，”“暂无在养绿植”。
- [x] 5.2 `me.vue` 改“持档人档案”：左侧双线身份框（姓名、编号、建档、在册印章），右侧“登记资料”和“积分与领养”字段行，退出登录保留确认流程；保留“未填写”。
- [x] 5.3 `login.vue` / `register.vue` 改线装表单：入口眉题、宋体标题、2px 页眉线、宋体分组标题；保留字段、校验、验证码和提交行为。
- [x] 5.4 `[...slug].vue` 改“未登记”404：等宽 404、宋体标题、墨框返回按钮；保留登录态分流。

## 6. Verification

- [x] 6.1 运行 `pnpm --filter web format`、`lint`、`check-types`、`test`、`format:check`；验证：全部通过。
- [x] 6.2 运行 `pnpm --filter web build`，确认 Nitro `/api` 代理路由仍在产物中；验证：构建成功。
- [x] 6.3 浏览器检查 1440 / 768 / 375 / 320 的日间与暗夜：`scrollWidth === innerWidth`、44px 命中区、主题切换、刷新保持、键盘焦点、reduced-motion、灰度区分；验证：逐项记录。
- [x] 6.4 运行根目录 `pnpm verify`；验证：全部任务通过。
- [x] 6.5 运行 `openspec validate web-two-ink-ledger --strict`；验证：通过。
- [x] 6.6 确认首屏无新增字体请求，主题脚本不阻塞渲染；验证：网络面板无字体请求，暗夜刷新无闪白。

## Workflow follow-up

- [x] 在评审通过后归档本变更。
- [x] 归档后验证主 specs 与归档结果。
