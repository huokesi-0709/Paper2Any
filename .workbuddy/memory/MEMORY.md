# Paper2Any 项目记事

## 前端设计系统（Neon Lab 霓虹科研实验室）

- **字体系统**：标题 `Orbitron`（科技感），标签/按钮 `JetBrains Mono`（等宽），正文 `Inter`
- **主色**：`#060914` 深空蓝黑背景 / `#00d4ff` 霓虹青 / `#a855f7` 霓虹紫 / `#ec4899` 霓虹粉
- **CSS 工具类**（定义在 `globals.css`）：
  - `.page-shell` / `.page-container` — 页面外层/内层容器
  - `.bento-card` — Bento 风格卡片，深色毛玻璣 + hover 渐变边框
  - `.scan-line` — 扫描线效果
  - `.btn-neon .glow` — 霓虹渐变按钮
  - `.neon-input .neon-select .neon-textarea` — 输入控件
  - `.neon-tab .neon-tab-active` — 标签页
  - `.toolbar-btn` — 工具栏按钮
  - `.neon-chip` — 霓虹标签
  - `.empty-state` — 空状态
  - `.status-error .status-success .status-warning` — 状态提示框
  - `.text-glow-*` — 发光文字
  - `.font-display` — Orbitron 显示字体

## 隐藏页面约定

- 路由隐藏通过 `App.tsx` + `AppSidebar.tsx` + `HomePage.tsx` + `homePageCatalog.ts` 同步调整实现
- Banner 通过 `showBanner` prop 控制，默认 `true`；科研绘图子页传入 `false`

## 布局架构（2026-08-08 重构后）

- **app-shell**：根容器 `w-screen h-screen overflow-hidden relative`，header（`absolute top-0 h-16`）+ footer（`absolute bottom-0 h-8`）固定，main（`absolute top-16 bottom-8`）夹在中间。
- **main 内部**：`flex` 容器，左侧 `<AppSidebar>` 常驻内联（`w-[280px] shrink-0`），右侧 `<div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">` 为内容滚动区。
- **AppSidebar**：不再是 drawer，已改为常驻左侧导航。props = `{ activePage, onPageChange }`。`paper2figure` 子项内联展开（默认展开，可折叠）。nav 自身 `overflow-y-auto`。
- **body 全局** `overflow: hidden`，滚动职责完全落在 main 内的内容区 div 上（`min-h-0` 是关键，打破 flexbox 默认 `min-height: auto`）。

