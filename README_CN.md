# FigureMind

> 读懂研究，画出方法。

FigureMind 是面向科研场景的多模态生图智能体。它能够理解论文 PDF、截图、文本和主题描述，自主规划视觉结构，生成科研示意图、模型架构图、技术路线图、实验图以及配套演示内容。

[English](README.md)

## 核心能力

- **科研图智能体**：从论文、摘要或方法描述中提取关键对象、关系与流程，自主完成构图。
- **模型结构图**：生成神经网络、系统架构和算法流程图，支持提示词微调与继续编辑。
- **技术路线图**：根据研究目标与方法步骤生成 SVG / PPT 技术路线图，并支持模板和配色。
- **实验结果图**：识别表格与实验数据，生成适合论文和汇报使用的图表。
- **可编辑输出**：支持 PPTX、SVG、DrawIO、PNG 和 PDF 等输出方式。
- **扩展工作流**：提供学术 PPT、海报、视频、思维导图、引用追踪与审稿回复辅助能力。

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- Windows、Linux 或 WSL

### 获取代码

```bash
git clone https://github.com/huokesi-0709/FigureMind.git
cd FigureMind
```

### 后端

```bash
python -m venv .venv
```

Windows：

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-base.txt
python -m fastapi_app.main
```

Linux / WSL：

```bash
source .venv/bin/activate
pip install -r requirements-base.txt
python -m fastapi_app.main
```

### 前端

```bash
cd frontend-workflow
npm install
npm run dev
```

默认访问地址：`http://localhost:3000`。

## 配置

后端配置示例位于：

- `fastapi_app/.env.simple.example`
- `fastapi_app/.env.example`
- `frontend-workflow/.env.simple.example`

复制需要的示例文件为对应的 `.env`，再填写模型 API、存储和可选服务配置。请勿将真实密钥提交到版本库。

## 项目结构

```text
FigureMind/
├── dataflow_agent/                 # 智能体与工作流引擎
│   └── agentroles/figuremind_agents/
├── fastapi_app/                    # FastAPI 服务
│   ├── routers/figuremind.py
│   └── services/figuremind_service.py
├── frontend-workflow/              # React / Vite 前端
├── script/                         # CLI 与运维脚本
├── database/                       # 数据库初始化脚本
├── deploy/                         # 部署配置
└── tests/                          # 自动化测试
```

## Docker

```bash
docker compose up --build
```

详细部署说明见 [DEPLOY.md](DEPLOY.md) 和 [开放部署指南](docs/guides/open_source_deployment.md)。

## 开发与测试

```bash
pytest
```

```bash
cd frontend-workflow
npm run build
```

## 项目主页

- GitHub：[huokesi-0709/FigureMind](https://github.com/huokesi-0709/FigureMind)
- Issues：[问题反馈](https://github.com/huokesi-0709/FigureMind/issues)

## 许可证

本项目使用 [Apache License 2.0](LICENSE)。使用或分发时请遵守许可证以及项目中第三方依赖的相应许可要求。

## 维护者

FigureMind 由 **linkinwise** 维护。
