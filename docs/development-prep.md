# Development Prep

## 1. 原型来源

当前网页版应用基于以下原型资产搭建：

- `stitch/aureum_oracle/DESIGN.md`
- `stitch/_1/code.html`
- `stitch/_2/code.html`
- `stitch/_3/code.html`
- `stitch/_4/code.html`
- `stitch/_1/screen.png` 到 `stitch/_4/screen.png`

这些文件仍然保留在目录中，作为后续视觉微调和产品对照依据。

## 2. 已完成落地

已经完成的工程化工作：

- 初始化 `Next.js + TypeScript + Tailwind CSS + pnpm`
- 建立 `app/` 路由结构
- 实现共享页面壳与底部导航
- 将 4 个原型拆成独立页面
- 抽出五行柱状图、资产环图、六爻卦象、气运 K 线等基础组件
- 建立 BigModel Coding 端环境变量、服务端推荐接口与结构化输出解析
- 建立本地状态存储与历史记录/帐籍 API
- 在卜卦页加入真实摇卦流程、自动推演、历史记录和帐籍操作
- 把首页、市道、帐籍改成真实数据驱动
- 完成一次 `pnpm build` 校验

## 3. 当前页面映射

### `/`

首页 / 乾坤页 / 市场总览

对应原型：

- `stitch/_3/code.html`

已实现模块：

- 时辰与天时信息
- 基于历史荐股结果计算的研究气数指数
- 基于帐籍/最新荐股的五行能量分布
- 最新一次 AI 推演摘要
- 底部导航

### `/market`

个股详情页 / 市道页

对应原型：

- `stitch/_1/code.html`

已实现模块：

- 最近一次真实 AI 个股解读
- 研究置信度
- 气运 K 线
- 六爻断卦
- 五行合化
- 天机判词与 CTA
- 风险与催化因素

### `/divination`

卜卦页 / AI 荐股工作台

对应原型：

- `stitch/_2/code.html`

已实现模块：

- 三枚古钱币仪式区
- 立即摇卦
- 六爻逐步生成
- 根据卦象自动生成荐股参数
- 自动触发 BigModel Coding 端推演
- BigModel 荐股表单
- 结构化荐股结果面板
- 推演历史
- 加入/移出帐籍
- 当前卦象状态提示

### `/ledger`

帐籍页 / 持仓页

对应原型：

- `stitch/_4/code.html`

已实现模块：

- 基于已保存帐籍的总览
- 资产五行占比
- 帐籍列表
- 每只股票的 Qi Score
- 来自最近一次 AI 会话的玄学点睛建议

## 4. 设计系统落地方式

基于 `DESIGN.md` 已提炼出首版视觉 token：

- 背景主色：`#0e131e`
- 主金色：`#f2ca50`
- 次绿色：`#59de9b`
- 警示红：`#ff9785`
- 高层容器：`#303541`

已经落到：

- `tailwind.config.ts`
- `app/globals.css`

当前保留的设计原则：

- 深色东方 editorial 视觉
- 少分割线，多靠色块与层级区分
- 玻璃质感卡片
- 金色重点强调
- 移动端优先布局

## 5. 当前工程结构

```text
app/
  api/recommend/route.ts
  api/state/route.ts
  api/watchlist/route.ts
  divination/page.tsx
  ledger/page.tsx
  market/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  charts/
  divination/
  layout/
  ui/
lib/
  app-state.ts
  bigmodel.ts
  divination-ritual.ts
  env.ts
  market-derive.ts
  recommendation-defaults.ts
  recommendation-types.ts
  types.ts
stitch/
docs/
```

## 6. 当前技术决策

### 为什么做成 Web 版

- 原型本身就是 HTML/Tailwind 风格，迁移成本最低
- 当前主要是验证视觉和交互，而不是先做终端能力
- React 组件化更适合快速迭代 4 个页面

### 为什么先让模型基于股票池给出结构化结论

- 这样可以先把真正可运行的 AI 工作流打通
- 前端、接口、错误处理、结构化返回和结果展示都能先产品化
- 后续再接入实时行情时，只需要把行情摘要拼进模型输入即可

### 为什么使用本地状态存储

- 不需要额外数据库就能把产品功能先完整跑通
- 历史记录、自选帐籍、首页摘要和市道页可以共享同一份真实数据
- 当前数据文件可直接查看和备份

### 为什么不用远程字体

- 当前环境下 Google Fonts 拉取受限
- 本地优先字体栈能保证构建稳定

### 为什么构建使用 webpack

- 当前环境中 `Next 16` 默认 `Turbopack` 构建会触发权限限制
- `next build --webpack` 已验证可用

## 7. 下一阶段建议

下一步最值得继续推进的事项：

1. 接入真实行情接口，替换当前“未接入实时行情”的说明
2. 把页面中的演示文案抽成配置数据
3. 为卜卦页补“历史结果 / 收藏 / 导出”流程
4. 增加桌面端适配策略
5. 加入免责声明与风险提示
6. 补充图标、插画或定制 SVG 纹理

## 8. 关键待定问题

正式进入产品化前还需要明确：

- 是否需要登录、收藏、自选股、持仓同步
- “玄学结论”由规则引擎生成还是 AI 生成
- 是否要做 PWA
- 是否要继续扩成多股票详情页而不是单一演示页
- 是否接入后台内容管理
