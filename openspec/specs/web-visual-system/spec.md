# web-visual-system Specification

## Purpose

定义学生端的线装标本档案视觉语言与桌面优先页面壳：冷纸白、墨线、宋体标题、等宽数据、印泥红印章，以及日间/暗夜两套纸色。界面在没有图片和插画的条件下仍具备识别度，并能扩展到未来的绿植、任务、积分、兑换、通知和反馈模块。

## Requirements

### Requirement: 桌面优先页面壳

学生端 SHALL 在 `48rem` 及以上使用网页顶栏、横向导航和最大 `70rem` 的内容纸面；在 `48rem` 以下使用压缩顶栏与底部导航。页面 SHALL NOT 再把 `30rem` 手机列作为默认壳。

#### Scenario: 桌面进入首页

- **WHEN** 学生在 768px 及以上视口访问 `/` 或 `/me`
- **THEN** 页面显示字标、横向导航、主题切换和宽版档案内容，不显示底部导航

#### Scenario: 窄屏进入首页

- **WHEN** 学生在 320px 或 375px 视口访问 `/` 或 `/me`
- **THEN** 页面显示压缩顶栏、主题切换和底部导航，内容改为单栏

#### Scenario: 无横向滚动

- **WHEN** 在 320px、375px 或 768px 视口查看任一学生端页面
- **THEN** `scrollWidth` 不超过视口宽度，文字、字段行和按钮不被裁切

### Requirement: 线装视觉语言

学生端 SHALL 以纸色、1px/2px 线条、宋体标题、等宽数据和印泥红小印章构成视觉识别；SHALL NOT 使用植物绿作为品牌色、背景、按钮填充或状态色，也 SHALL NOT 使用大面积墨色填充块作为页面主体。

#### Scenario: 区块分组

- **WHEN** 页面渲染档案区块、字段行或数据摘要
- **THEN** 使用 1px 线、点引线、方形记号和留白分组，不使用包裹式卡片或阴影

#### Scenario: 主操作

- **WHEN** 页面渲染主按钮
- **THEN** 使用 2px 墨色描边和透明/纸色底，不使用填充色块

#### Scenario: 在养状态

- **WHEN** 学生有在养绿植
- **THEN** 使用墨色双线印章和“在养中”文字，不使用绿色

### Requirement: 颜色角色分离

学生端 SHALL 为页面纸色、表面、正文、次级文字、辅助文字、装饰线、交互边界、待处理、失败和焦点分别定义独立语义角色；SHALL 按 palette → semantic 两层组织，原始十六进制只允许出现在 `tokens.css`。

#### Scenario: 页面纸色与表面

- **WHEN** 页面渲染背景、输入框或对话框
- **THEN** 页面底使用 paper，输入和浮层使用 sheet，二者不互换

#### Scenario: 待处理与失败

- **WHEN** 显示待处理或失败
- **THEN** 待处理使用 seal 与虚线/文字，失败使用 seal-deep 与 2px 左线，不只靠颜色区分

#### Scenario: 暗夜纸色

- **WHEN** 页面处于暗夜模式
- **THEN** 只替换 palette 值，semantic token 名称和组件引用保持不变

### Requirement: 排版三角色

学生端 SHALL 区分 display、body 与 data 三种排版角色。页面标题 SHALL 使用宋体栈和 `clamp(2.5rem, 5vw, 3.75rem)`；正文 SHALL 使用系统黑体 16px / 1.65；读数 SHALL 使用等宽字体、`tabular-nums` 和 `clamp(2.25rem, 4vw, 3.5rem)`，且标题在任意断点都大于读数。

#### Scenario: 页面标题

- **WHEN** 渲染首页或“我的”页面标题
- **THEN** 使用宋体 display 角色，字号大于同屏任何读数

#### Scenario: 读数

- **WHEN** 显示积分或在养数量
- **THEN** 使用等宽数字和小一号的 `PT` / `PL` 单位，单位使用印泥红

#### Scenario: 中文正文

- **WHEN** 显示中文正文
- **THEN** 使用 16px 系统黑体、1.65 行高，不加载中文 webfont

### Requirement: 标签与档案区块

短标签 SHALL 使用 11px、500 字重和 `+0.18em` 字距；档案区块 SHALL 使用“卷号 + 宋体标题 + 右侧等宽英文标签”的 `FolioSection` 结构。

#### Scenario: 字段标签

- **WHEN** 显示“当前积分”“在养绿植”等字段
- **THEN** 使用 11px 标签样式和点引线

#### Scenario: 档案区块

- **WHEN** 首页或“我的”需要分组
- **THEN** 使用 `01 / 02` 卷号、宋体区块标题和英文标签，不另造卡片

### Requirement: 印章与字段行

学生端 SHALL 提供可复用的 `TagRow`、`Stamp`、`Ledger` 和 `FolioSection`。`TagRow` SHALL 包含方形套印记号、11px 标签、点引线、值、可选编号/日期和双线状态戳；行内 SHALL NOT 使用卡片或阴影，只用一条 1px 行线。未来模块 SHALL 复用该结构，并以 PL、TK、PT、OD、NT、FB 作为编号前缀。

#### Scenario: 我的资料行

- **WHEN** “我的”显示院系、班级、手机号和邮箱
- **THEN** 使用字段行、点引线和方形记号，长值不横向溢出

#### Scenario: 状态戳

- **WHEN** 显示“在养中”“在册”或“待审核”
- **THEN** 使用 1px 内框 + 1px 外框的印章，并同时显示状态文字

#### Scenario: 320px 视口

- **WHEN** 视口为 320px
- **THEN** 字段行的编号和印章换到第二行或保持右对齐，不产生横向滚动

### Requirement: 表面与形状

页面 SHALL 默认零阴影；只有对话框、popover 和下拉使用 `--shadow-overlay`，且必须同时有 1px 墨色边框。圆角 SHALL 只用 0 或 2px。页眉 SHALL 使用 2px 墨色底线；顶栏 SHALL 使用“1px + 3px 间隔 + 1px”的双细线。

#### Scenario: 默认表面

- **WHEN** 页面渲染统计或资料分组
- **THEN** 使用线条、点引线和留白，不默认使用白卡片加阴影

#### Scenario: 对话框

- **WHEN** 打开退出确认对话框
- **THEN** 对话框使用 sheet 底、1px 墨框和唯一允许的浮层阴影

#### Scenario: 焦点

- **WHEN** 键盘聚焦按钮、链接或输入框
- **THEN** 显示 2px 墨色 outline 和 2px offset，不写 `outline: none`

### Requirement: 暗夜模式

学生端 SHALL 提供日间/暗夜主题切换。首屏 SHALL 在绘制前根据 `localStorage["student-theme"]` 或 `prefers-color-scheme` 设置 `<html data-theme>`，避免闪白；主题选择 SHALL 持久化，且两套色板 SHALL 通过正文、次级文字、印泥红和交互边界的对比度校验。

#### Scenario: 切换主题

- **WHEN** 学生点击顶栏或认证页的主题切换按钮
- **THEN** 页面在日间与暗夜之间切换，按钮的 `aria-pressed` 和文案同步更新

#### Scenario: 刷新保持

- **WHEN** 学生选择暗夜后刷新页面
- **THEN** 首帧即为暗夜纸色，不出现先亮后暗的闪烁

#### Scenario: 首次访问

- **WHEN** 学生没有保存过主题偏好
- **THEN** 页面跟随 `prefers-color-scheme`，并允许手动覆盖

### Requirement: 组件状态一致

按钮 SHALL 提供主、次、幽灵、破坏性和禁用五种线框状态；输入框 SHALL 提供默认、焦点、错误和禁用状态。禁用态 SHALL 同时改变底色、边框和文字，SHALL NOT 只降低透明度；错误 SHALL 使用深绛文字或 2px 深绛左线。

#### Scenario: 禁用输入

- **WHEN** 验证码倒计时或提交中禁用输入
- **THEN** 输入框显示 ink-wash 底、虚线边框和 muted 文字

#### Scenario: 字段错误

- **WHEN** 表单字段校验失败
- **THEN** 字段显示深绛错误文字和 1.5px 深绛边框，错误文案替换 hint

#### Scenario: 主按钮权重

- **WHEN** 页面出现多个操作
- **THEN** 只有最高权重操作使用 2px 墨色描边，其余使用 1px 次按钮或文字按钮

### Requirement: 空态与零值

零值 SHALL NOT 作为孤立的大数字显示。空态 SHALL 使用统一的虚线空档框，包含“未登记”标签、宋体标题和一句说明；现有被测试锁定的文案“暂无在养绿植”和“未填写” SHALL 保留。

#### Scenario: 无在养绿植

- **WHEN** 在养数量为 0
- **THEN** 显示“暂无在养绿植”说明和空档框，不显示孤立的大号 0

#### Scenario: 缺少可选资料

- **WHEN** 手机号或班级为空
- **THEN** 显示“未填写”占位，不显示空白行

### Requirement: 无图识别与图片兼容

学生端 SHALL NOT 新增装饰性图片、插画或图标库依赖；装饰 SHALL 只使用线条、方形记号、点引线和印章，图片 SHALL 只承载真实业务内容。业务凭证图片 SHALL 允许由学生上传。品种封面 SHALL 进入固定画框：列表 1:1、详情 4:3，配 1px 线框和底部编号条；凭证图片 SHALL 使用 1:1 固定画框和最多三张的等宽网格，选择后先在本机预览再上传。加载中 SHALL 显示静态占位，加载失败 SHALL 显示文字说明与重试；SHALL NOT 使用脉冲骨架、大圆角通栏图、背景虚化或图片替代状态文字。

#### Scenario: 当前无图

- **WHEN** 渲染首页、登录页或 404 页
- **THEN** 识别度由宋体标题、线条、编号和印章建立，不依赖图片

#### Scenario: 未来图片

- **WHEN** 品种列表出现植物图片
- **THEN** 图片使用 1:1 固定画框，不改变字段行结构

#### Scenario: 图片加载中

- **WHEN** 品种封面仍在读取
- **THEN** 画框保持最终尺寸并显示静态占位，不出现脉冲或位移动画

#### Scenario: 图片加载失败

- **WHEN** 品种封面读取失败
- **THEN** 画框内显示“图片加载失败”文字和重试入口，品种名称与数量仍可阅读

#### Scenario: 上传前预览

- **WHEN** 学生选择了一张合法凭证图片
- **THEN** 表单在 1:1 画框中显示本地预览和移除操作，不使用大图通栏或背景虚化

#### Scenario: 凭证图片展示

- **WHEN** 打卡详情显示一张或多张凭证图片
- **THEN** 图片按 1:1 画框排列，最多三张时保持等宽网格，状态文字不被图片替代

#### Scenario: 装饰性图片

- **WHEN** 渲染任意学生端页面
- **THEN** 不出现装饰插画、emoji 图标或图标库素材，上传入口只为业务凭证服务

### Requirement: 克制的装饰语法

学生端 SHALL NOT 使用渐变、玻璃拟态、背景模糊、发光描边、emoji 图标、装饰性植物插画、游戏化进度环、徽章或彩带；SHALL NOT 使用大圆角加柔阴影的卡片作为默认表面。装饰 SHALL 限于线条、方形记号、点引线和印章。

#### Scenario: 页面渲染

- **WHEN** 渲染任意学生端页面
- **THEN** 不存在渐变背景、玻璃模糊、发光边框、emoji 图标或装饰插画

#### Scenario: 状态反馈

- **WHEN** 显示审核通过、积分变化或兑换成功
- **THEN** 使用文字、线型和印章，不使用彩带、徽章或进度环庆祝

### Requirement: Token 架构与校验

颜色 SHALL 按 palette → semantic 两层定义，并同时提供日间和暗夜两套 palette。原始十六进制 SHALL 只出现在 token 定义中；组件 SHALL 只消费语义 token。校验 SHALL 覆盖未定义变量、组件 raw color，以及日间/暗夜关键对比度。

#### Scenario: 组件颜色

- **WHEN** 组件设置颜色
- **THEN** 引用语义 token，不写十六进制

#### Scenario: 未定义 token

- **WHEN** CSS 使用了 `var(--*)`
- **THEN** 该变量必须在 `tokens.css` 中有定义；校验失败时指出变量名

#### Scenario: 暗夜对比度

- **WHEN** 运行 token 测试
- **THEN** 日间和暗夜的正文、次级文字、印泥红、交互边界均达到约定阈值

### Requirement: 动效克制

动效 SHALL 只解释状态变化，总时长 SHALL 不超过 220ms，位移 SHALL 不超过 8px。SHALL NOT 使用数字滚动、进度环生长、庆祝、抖动、骨架脉冲或持续装饰动画；所有过渡 SHALL 使用 CSS transition，以便自动继承 `prefers-reduced-motion` 降级。

#### Scenario: 按钮按下

- **WHEN** 按下按钮
- **THEN** 仅发生 90ms 位移或颜色变化

#### Scenario: 浮层

- **WHEN** 打开对话框
- **THEN** 180ms 淡入和 4px 上移，关闭 120ms

#### Scenario: 减少动态效果

- **WHEN** 用户启用减少动态效果
- **THEN** 不出现位移动画

### Requirement: 视觉升级不改变交互契约

视觉升级 SHALL NOT 改变现有 URL、表单字段、认证流程、数据流或无障碍语义；被测试断言的类名（如 `.ui-bottom-nav__link--active`）和文案 SHALL 保留，除非同一变更同步更新 spec 与测试。主题切换是新增能力，SHALL NOT 阻断已有页面。

#### Scenario: 路由与表单

- **WHEN** 学生登录、注册、刷新或退出
- **THEN** 路径、字段和提交行为与升级前一致

#### Scenario: 测试契约

- **WHEN** 运行现有测试
- **THEN** 被断言的类名与文案仍然存在

#### Scenario: 无障碍

- **WHEN** 使用键盘或辅助技术
- **THEN** `aria-current`、`role="alert"`、`aria-describedby`、焦点可见性和主题按钮的 `aria-pressed` 保持可用
