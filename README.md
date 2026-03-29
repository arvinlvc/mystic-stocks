# 玄学荐股

基于原型页面落地的移动优先网页版应用，当前使用 `Next.js + TypeScript + Tailwind CSS + pnpm`，并已接入 BigModel `coding` 端生成结构化荐股结果。

## 当前状态

- 已完成基础工程脚手架
- 已接入 4 个核心页面
- 已抽离共享布局、底部导航、图表组件和真实状态存储
- 已接入 BigModel 荐股 API
- 已支持本地历史记录与帐籍保存
- 已实现“立即摇卦 -> 六爻生成 -> 自动 AI 推演”完整流程
- 已通过一次生产构建校验

## 页面对应关系

- `/`
  乾坤首页，对应 `stitch/_3/code.html`
- `/market`
  个股市道页，对应 `stitch/_1/code.html`
- `/divination`
  卜卦页，对应 `stitch/_2/code.html`
- `/ledger`
  帐籍页，对应 `stitch/_4/code.html`

## 运行方式

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
pnpm start
```

## 大模型配置

本地开发使用：

```bash
BIGMODEL_API_KEY=...
BIGMODEL_BASE_URL=https://open.bigmodel.cn/api/coding/paas/v4
BIGMODEL_MODEL=glm-4.7
```

接口：

- `POST /api/recommend`
  调用 BigModel 返回结构化荐股结果
- `GET /api/state`
  返回本地历史记录与帐籍
- `POST /api/watchlist`
  把推荐标的加入帐籍
- `DELETE /api/watchlist`
  从帐籍移除标的

## 目录说明

- `app/`
  Next App Router 页面、全局样式和 API 路由
- `components/`
  布局、图表、卦象和荐股工作台组件
- `lib/`
  类型、环境变量、BigModel 调用逻辑和本地状态存储
- `stitch/`
  原始设计文档、HTML 原型和截图
- `docs/development-prep.md`
  开发准备与当前实现说明

## 说明

- 卜卦页支持真实调用 BigModel Coding 端点生成荐股结论
- “立即摇卦”会真实生成六爻、推导卦象、自动填充参数并触发一次 AI 推演
- 首页、市道页、帐籍页都基于本地真实生成的数据联动展示
- 本地状态保存在 `.data/app-state.json`
- 为了保证离线和受限网络环境可构建，字体改为本地优先字体栈
- 生产构建脚本使用 `webpack`，规避当前环境下 `Turbopack` 的构建限制
