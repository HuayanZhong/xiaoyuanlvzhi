# Spec Delta

## REMOVED Requirements

### Requirement: 线装视觉语言

**Reason**: 视觉方向由「线装标本档案」整体更换为「生长手帐」。冷纸白、墨线、档案术语与绿植领养产品的情感预期冲突，用户判定其"混乱、没有清晰方向"。

**Migration**: 由 ADDED「生长手帐视觉语言」替代；`tokens.css` 的 palette、字阶与组件语气在同一变更内重写。

### Requirement: 标签与档案区块

**Reason**: 卷号、英文标签与档案区块头属于被移除的档案语言，正文阅读负担过重。

**Migration**: 由 ADDED「区块头与中文标签」替代；全部页面的区块头改为楷体标题加可选中文链接。

### Requirement: 印章与字段行

**Reason**: 方形套印、点引线、双线印章与 PL/PT 编号前缀不再符合新方向。

**Migration**: 由 ADDED「字段行与状态标记」替代；状态改用彩点加中文词胶囊，业务编号只作小字辅助。

### Requirement: 克制的装饰语法

**Reason**: 新方向允许受纪律约束的手帐装饰（和纸胶带、贴纸徽章、纸面点纹），旧的全量禁令与新主张冲突。

**Migration**: 由 ADDED「装饰纪律」替代；渐变、玻璃拟态、发光、进度环、彩带与功能性 emoji 图标仍被禁止。

## ADDED Requirements

### Requirement: 生长手帐视觉语言

学生端 SHALL 以奶油纸底、楷体标题、胶囊组件、叶绿主色与手帐装饰构成视觉识别；正文、按钮与数据 SHALL 使用系统黑体；SHALL NOT 显示装饰性英文微标签、卷号或橡皮章。页面在没有图片时仍 SHALL 具备识别度。

#### Scenario: 页面第一眼

- **WHEN** 学生访问任一学生端页面
- **THEN** 页面底为奶油纸色，页面标题与区块标题使用楷体，主操作是叶绿填充的胶囊按钮

#### Scenario: 无图识别

- **WHEN** 渲染登录页、注册页或 404 页
- **THEN** 识别度由奶油纸、楷体标题、胶囊组件与手帐装饰建立，不依赖图片

#### Scenario: 不出现英文微标签

- **WHEN** 学生查看任意页面或区块头
- **THEN** 只出现中文标题与中文操作文字，不出现装饰性英文标签或卷号

### Requirement: 装饰纪律

手帐装饰 SHALL 只出现在约定位置：和纸胶带只在卡片顶部一角，贴纸徽章只用于连续打卡与里程碑，纸面点纹只在页面底层，手绘下划线只用于页面级大标题，虚线框只用于可参与或可书写的容器。楷体 SHALL 只用于标题且字重为 400。

#### Scenario: 成就贴纸

- **WHEN** 学生连续打卡达到里程碑
- **THEN** 显示贴纸徽章；普通状态 SHALL NOT 使用贴纸徽章

#### Scenario: 普通对象卡片

- **WHEN** 渲染品种或奖励卡片
- **THEN** 卡片最多出现一条和纸胶带，位置与角度符合统一规格

#### Scenario: 页面级标题

- **WHEN** 页面渲染页面级大标题
- **THEN** 每屏最多出现一条手绘下划线

### Requirement: 区块头与中文标签

学生端 SHALL 只使用一种区块头：楷体标题加可选右侧中文链接；SHALL NOT 使用卷号、英文标签或第二套区块头写法。

#### Scenario: 首页六区块

- **WHEN** 首页渲染六个区块
- **THEN** 每个区块头的结构与「我的绿植」完全一致

#### Scenario: 详情页区块

- **WHEN** 打开任一详情页
- **THEN** 区块头不出现编号、英文标签或手写第二套标题样式

### Requirement: 字段行与状态标记

学生端 SHALL 只使用一种字段行（12px 中文标签、右对齐值、1px 纸线）与一种状态标记（彩点加中文词的胶囊）。字段行组 SHALL 由统一收尾组件结束，末行不保留行线；SHALL NOT 使用点引线、方印记号、橡皮章或英文状态缩写。

#### Scenario: 我的资料行

- **WHEN** 「我的」显示院系、班级、手机号和邮箱
- **THEN** 使用统一字段行，长值不横向溢出

#### Scenario: 状态显示

- **WHEN** 显示在养、审核中或已驳回
- **THEN** 显示彩点加中文词，且中文文字始终存在，颜色不是唯一区分手段

#### Scenario: 行组收尾

- **WHEN** 一个字段行组结束
- **THEN** 最后一行不保留行线

### Requirement: 中文优先与编号纪律

学生端 SHALL 以中文作为界面主语言。业务编号（如 `SP-004`、`ADP-xxxx`）SHALL 只作为「编号 xxx」小字出现在辅助位置，SHALL NOT 进入页面标题、区块标题或正文主句。

#### Scenario: 品种编号

- **WHEN** 显示品种编号
- **THEN** 以「编号 SP-004」小字出现在画框底部或字段行辅助位

#### Scenario: 详情页标题

- **WHEN** 打开打卡详情或领养详情
- **THEN** 页面标题是中文业务名称，编号只出现在辅助位

## MODIFIED Requirements

### Requirement: 颜色角色分离

学生端 SHALL 为页面底、卡片表面、正文、次级文字、主色、主色浅底、次级强调、成就色、警示、装饰线和交互边界分别定义独立语义角色；SHALL 按 palette → semantic 两层组织，原始十六进制只允许出现在 `tokens.css`。

#### Scenario: 页面纸色与表面

- **WHEN** 渲染页面背景、输入框或对话框
- **THEN** 页面底使用 paper，卡片与浮层使用 surface，二者不互换

#### Scenario: 待处理与失败

- **WHEN** 显示待处理或失败
- **THEN** 待处理使用 sticker 彩点与中文文字，失败使用 blush 与中文说明，不只靠颜色区分

#### Scenario: 主色

- **WHEN** 渲染主按钮、链接或当前导航项
- **THEN** 使用 leaf；leaf 作为文字色仅用于 14px 以上的粗体或带下划线的链接

#### Scenario: 暗夜纸色

- **WHEN** 页面处于暗夜模式
- **THEN** 只替换 palette 值，semantic token 名称和组件引用保持不变

### Requirement: 排版三角色

学生端 SHALL 区分标题、正文与数据三种排版角色。页面标题与区块标题 SHALL 使用楷体栈 400，页面标题为 `clamp(1.75rem, 3vw, 2.25rem)`；正文 SHALL 使用系统黑体 15px / 1.7；读数 SHALL 使用黑体 700、`tabular-nums` 和 `clamp(1.5rem, 2.5vw, 2rem)`，且页面标题在任意断点都大于读数；SHALL NOT 加载中文 webfont。

#### Scenario: 页面标题

- **WHEN** 渲染首页或「我的」页面标题
- **THEN** 使用楷体标题角色，字号大于同屏任何读数

#### Scenario: 读数

- **WHEN** 显示积分或在养数量
- **THEN** 使用 `tabular-nums` 数字和 12px 中文单位

#### Scenario: 中文正文

- **WHEN** 显示中文正文
- **THEN** 使用 15px 系统黑体、1.7 行高，不加载中文 webfont

### Requirement: 表面与形状

页面 SHALL 使用圆角卡片与两级阴影：卡片 16px 圆角配纸片感 `0 2px 0` 阴影，浮层 16px 圆角配单一浮层阴影；输入与小卡使用 12px 圆角，chip 与按钮为胶囊。虚线框 SHALL 只用于可参与或可书写的容器；卡片表面 SHALL NOT 使用纸面点纹或渐变。

#### Scenario: 默认表面

- **WHEN** 渲染品种、奖励或任务对象卡
- **THEN** 使用白色表面、16px 圆角和纸片感阴影

#### Scenario: 对话框

- **WHEN** 打开退出确认或撤销确认对话框
- **THEN** 对话框呈便签卡样式，使用 16px 圆角和唯一允许的浮层阴影

#### Scenario: 虚线容器

- **WHEN** 渲染打卡日历、表单组或空态
- **THEN** 使用 1.5px 虚线框；普通对象卡片不使用虚线

#### Scenario: 焦点

- **WHEN** 键盘聚焦按钮、链接或输入框
- **THEN** 显示 2px 叶绿外圈，不写 `outline: none`

### Requirement: 暗夜模式

学生端 SHALL 提供日间/暗夜主题切换。首屏 SHALL 在绘制前根据 `localStorage["student-theme"]` 或 `prefers-color-scheme` 设置 `<html data-theme>`，避免闪白；主题选择 SHALL 持久化；两套色板 SHALL 通过正文、次级文字、主色、警示和交互边界的对比度校验；暗夜纸纹 SHALL 减弱。

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

按钮 SHALL 提供主（叶绿填充白字胶囊）、次（1px 交互边界白底）、文字（叶绿下划线）和破坏（blush 描边）四种形态以及禁用态；输入框 SHALL 提供默认、焦点、错误和禁用状态，聚焦使用 2px 叶绿外圈。禁用态 SHALL 同时改变底色、边框和文字，SHALL NOT 只降低透明度；错误 SHALL 只通过唯一通道表达：blush 左线便签与字段内红字。

#### Scenario: 禁用输入

- **WHEN** 验证码倒计时或提交中禁用输入
- **THEN** 输入框显示浅色底、虚线边框和 muted 文字

#### Scenario: 字段错误

- **WHEN** 表单字段校验失败
- **THEN** 字段显示 blush 边框和错误文案，错误文案替换 hint，不再叠加第二种错误形态

#### Scenario: 主按钮权重

- **WHEN** 页面出现多个操作
- **THEN** 只有最高权重操作使用叶绿填充，其余使用次按钮或文字按钮

### Requirement: 空态与零值

零值 SHALL NOT 作为孤立的大数字显示。空态 SHALL 使用统一的虚线手帐框，包含楷体标题和一句说明，可选一个主行动；被测试锁定的文案「暂无在养绿植」和「未填写」SHALL 保留。

#### Scenario: 无在养绿植

- **WHEN** 在养数量为 0
- **THEN** 显示「暂无在养绿植」说明和虚线空态框，不显示孤立的大号 0

#### Scenario: 缺少可选资料

- **WHEN** 手机号或班级为空
- **THEN** 显示「未填写」占位，不显示空白行

### Requirement: 无图识别与图片兼容

学生端 SHALL NOT 新增图标库或装饰性插画依赖；装饰只使用线条、手帐元素与内联 SVG，图片只承载真实业务内容。品种封面 SHALL 进入固定画框：列表 1:1、详情 4:3，12px 圆角、1px 线框和底部白边「编号 xxx」小字；凭证图片 SHALL 使用 1:1 画框和最多三张的等宽网格，选择后先本机预览再上传。加载中 SHALL 显示静态占位（纸面点纹加内联叶形 SVG），失败 SHALL 显示文字说明与重试；SHALL NOT 使用脉冲骨架、装饰插画或功能性 emoji 图标。

#### Scenario: 当前无图

- **WHEN** 渲染首页、登录页或 404 页
- **THEN** 识别度由奶油纸、楷体标题、胶囊组件和手帐装饰建立，不依赖图片

#### Scenario: 未来图片

- **WHEN** 品种列表出现植物图片
- **THEN** 图片使用 1:1 固定画框，不改变字段行结构

#### Scenario: 图片加载中

- **WHEN** 品种封面仍在读取
- **THEN** 画框保持最终尺寸并显示纸纹与叶形静态占位，不出现脉冲或位移动画

#### Scenario: 图片加载失败

- **WHEN** 品种封面读取失败
- **THEN** 画框内显示「图片加载失败」文字和重试入口，品种名称与数量仍可阅读

#### Scenario: 上传前预览

- **WHEN** 学生选择了一张合法凭证图片
- **THEN** 表单在 1:1 画框中显示本地预览和移除操作

#### Scenario: 凭证图片展示

- **WHEN** 打卡详情显示一张或多张凭证图片
- **THEN** 图片按 1:1 画框排列，最多三张时保持等宽网格，状态文字不被图片替代

#### Scenario: 装饰性图片

- **WHEN** 渲染任意学生端页面
- **THEN** 不出现装饰插画或功能性 emoji 图标，上传入口只为业务凭证服务

### Requirement: Token 架构与校验

颜色 SHALL 按 palette → semantic 两层定义，并同时提供日间和暗夜两套 palette；原始十六进制 SHALL 只出现在 token 定义中。字号、间距、圆角、阴影和动效 SHALL 全部经 token 消费，组件 SHALL NOT 使用裸字号或魔法值；断点 SHALL 统一为 `48rem` 一档，SHALL NOT 保留别名层、死 token 或组件私有断点。校验 SHALL 覆盖未定义变量、组件裸色值，以及日间/暗夜关键对比度。

#### Scenario: 组件颜色

- **WHEN** 组件设置颜色
- **THEN** 引用语义 token，不写十六进制

#### Scenario: 裸字号

- **WHEN** 扫描 `app/` 下的 `.vue` 与 `.css`
- **THEN** `tokens.css` 之外不存在 `font-size` 原始值

#### Scenario: 未定义 token

- **WHEN** CSS 使用了 `var(--*)`
- **THEN** 该变量必须在 `tokens.css` 中有定义；校验失败时指出变量名

#### Scenario: 暗夜对比度

- **WHEN** 运行 token 测试
- **THEN** 日间和暗夜的正文、次级文字、主色、警示、交互边界均达到约定阈值

### Requirement: 动效克制

动效 SHALL 只解释状态变化，总时长 SHALL 不超过 240ms，位移 SHALL 不超过 8px；贴纸「盖上」落定动画 SHALL 只用于打卡成功瞬间。SHALL NOT 使用数字滚动、进度环生长、庆祝、抖动、骨架脉冲或持续装饰动画；所有过渡 SHALL 使用 CSS transition，以便自动继承 `prefers-reduced-motion` 降级。

#### Scenario: 按钮按下

- **WHEN** 按下按钮
- **THEN** 仅发生 120ms 的缩放或颜色变化

#### Scenario: 浮层

- **WHEN** 打开对话框
- **THEN** 160ms 淡入和 4px 上移，关闭 120ms

#### Scenario: 打卡成功

- **WHEN** 养护打卡提交成功
- **THEN** 贴纸以 240ms 落定动画盖上，不出现彩带或进度环

#### Scenario: 减少动态效果

- **WHEN** 用户启用减少动态效果
- **THEN** 不出现位移动画与贴纸落定动画

### Requirement: 视觉升级不改变交互契约

视觉升级 SHALL NOT 改变现有 URL、表单字段、认证流程、数据流或无障碍语义；被测试断言的类名和文案可以在同一变更内同步更新 spec 与测试，但 SHALL NOT 削弱 `aria-current`、`role="alert"`、`aria-describedby`、焦点可见性和主题按钮的 `aria-pressed`。

#### Scenario: 路由与表单

- **WHEN** 学生登录、注册、刷新或退出
- **THEN** 路径、字段和提交行为与升级前一致

#### Scenario: 测试契约

- **WHEN** 运行现有测试
- **THEN** 被断言的类名与文案要么仍然存在，要么在同一变更内完成 spec 与测试的同步更新

#### Scenario: 无障碍

- **WHEN** 使用键盘或辅助技术
- **THEN** `aria-current`、`role="alert"`、`aria-describedby`、焦点可见性和主题按钮的 `aria-pressed` 保持可用
