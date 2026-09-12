# Windows 精简环境部署

这份说明面向当前准备保留的四类能力：Paper2Figure、Paper2Diagram / Image2Drawio、生图模型体验和 Knowledge Base。原项目的 Paper2PPT、PDF2PPT、Poster、Video、Rebuttal、Citation、MindMap 等页面尚未从源码移除；本阶段只完成依赖裁剪。

## 1. 前置条件

- Windows 10/11 64 位
- Miniconda 或 Anaconda
- Python 3.12
- Node.js 18 以上（推荐 Node.js 20 LTS）
- NVIDIA 显卡及可用驱动（仅本地 CUDA/SAM/RMBG 需要）
- Inkscape，并把 `C:\Program Files\Inkscape\bin` 加入 `Path`
- Poppler，并把其 `Library\bin` 或 `bin` 目录加入 `Path`（`pdf2image` 需要）
- wkhtmltopdf，并把其 `bin` 目录加入 `Path`（实验表格转图片需要）

安装系统工具后重新打开 PowerShell，并检查：

```powershell
where.exe inkscape
where.exe pdftoppm
where.exe wkhtmltoimage
nvidia-smi
```

如果只使用远程生图、OCR、MinerU 和 SAM3 服务，可以先不配置本地 GPU 模型，但 Inkscape、Poppler 和 wkhtmltopdf 仍建议安装。

## 2. 创建 Python 环境

在项目根目录打开 PowerShell：

```powershell
conda create -n paper2figure-agent python=3.12 -y
conda activate paper2figure-agent

python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements-win-base.txt
python -m pip install -e . --no-deps
```

`requirements-win-base.txt` 已经递归包含科研绘图、Drawio、图像和 KB 依赖，不需要再单独安装 `requirements-paper.txt`，也不要在 Windows 安装 `requirements-cu12.txt`。

检查 CUDA wheel：

```powershell
python -c "import torch; print('torch=', torch.__version__); print('cuda=', torch.version.cuda); print('available=', torch.cuda.is_available())"
```

没有 NVIDIA GPU 时，不要使用这份 CUDA overlay。可先安装 `requirements-paper.txt`，再根据 PyTorch 官方说明安装匹配本机的 CPU wheel；远程模型链路不要求本地 CUDA。

## 3. 配置后端

复制粗粒度配置：

```powershell
Copy-Item fastapi_app\.env.simple.example fastapi_app\.env
notepad fastapi_app\.env
```

最少需要确认以下配置：

```dotenv
BACKEND_API_KEY=请换成你自己的前后端共享密钥
APP_BILLING_MODE=free
FIGUREMIND_CONFIG_MODE=simple

SIMPLE_TEXT_API_URL=https://xuseny.online/v1
SIMPLE_TEXT_API_KEY=你的LLM中转密钥
SIMPLE_TEXT_MODEL=gpt-5.6-sol
SIMPLE_REASONING_EFFORT=high

SIMPLE_IMAGE_API_URL=https://xuseny.online/v1
SIMPLE_IMAGE_API_KEY=你的生图中转密钥
SIMPLE_IMAGE_MODEL=gpt-image-2

SIMPLE_OCR_API_URL=https://xuseny.online/v1
SIMPLE_OCR_API_KEY=你的LLM中转密钥
SIMPLE_VLM_MODEL=gpt-5.6-sol
SIMPLE_EMBEDDING_MODEL=text-embedding-3-small

MINERU_API_BASE_URL=https://mineru.net/api/v4
MINERU_API_KEY=你的MinerU密钥
PAPER2DRAWIO_ENABLE_VLM_VALIDATION=false
```

补充说明：

- Supabase 只影响登录、历史记录和部分 KB 云端元数据；暂时不用可把三项 `SUPABASE_*` 留空。
- 当前中转站模型列表没有 embedding 模型，因此 KB 的向量入库暂时还需要另一套 OpenAI 兼容 embedding 接口；聊天模型配置不受影响。
- `Image2Drawio` 会优先调用 `SAM3_SERVER_URLS`。没有 SAM3 服务时，代码会退化成视觉背景回退，仍能生成 Drawio，但元素可编辑粒度会明显下降。
- 若已有远程 SAM3 服务，把 `SAM3_SERVER_URLS` 改成其地址；原生 Windows 本地 SAM3 的模型源码、checkpoint 和 BPE 文件需要另行准备，不属于 pip requirements。

## 4. 配置前端

```powershell
Copy-Item frontend-workflow\.env.simple.example frontend-workflow\.env
notepad frontend-workflow\.env
```

至少保证：

```dotenv
VITE_API_KEY=与后端BACKEND_API_KEY完全一致
VITE_API_BASE_URL=
VITE_DEFAULT_LLM_API_URL=https://xuseny.online/v1
VITE_DEFAULT_LLM_MODEL=gpt-5.6-sol
VITE_PAPER2DRAWIO_MODEL=gpt-5.6-sol
VITE_PAPER2FIGURE_MODEL_MODEL_ARCH=gpt-image-2
VITE_PAPER2FIGURE_MODEL_EXP_DATA=gpt-image-2
VITE_PAPER2FIGURE_MODEL_TECH_ROUTE=gpt-5.6-sol
```

以后切换文本模型，修改 `fastapi_app\.env` 中的 `SIMPLE_TEXT_MODEL` 即可，例如改为 `gpt-5.5`；同时把前端 `.env` 中展示用的 `VITE_DEFAULT_LLM_MODEL` 和相关功能模型名改成相同值。修改后重启前后端。

安装前端依赖：

```powershell
Set-Location frontend-workflow
npm ci
Set-Location ..
```

## 5. 启动

原项目的一键脚本主要是 Bash/Linux 脚本。原生 Windows 建议使用两个 PowerShell 窗口。

窗口 1，启动后端：

```powershell
conda activate paper2figure-agent
Set-Location E:\Projects\FigureMind
python -m uvicorn fastapi_app.main:app --host 127.0.0.1 --port 8000
```

窗口 2，启动前端：

```powershell
Set-Location E:\Projects\FigureMind\frontend-workflow
npm run dev -- --host 127.0.0.1
```

访问：

- 后端健康检查：`http://127.0.0.1:8000/health`
- 后端接口文档：`http://127.0.0.1:8000/docs`
- 前端：`http://127.0.0.1:3000`

## 6. 首次部署验证顺序

1. 打开 `/health`，确认后端启动。
2. 测试生图模型体验，确认生图 API URL、Key 和模型名正确。
3. 用纯文本测试 Paper2Diagram，先绕开 PDF/MinerU。
4. 用单页 PNG 测试 Image2Drawio；没有 SAM3 时确认回退结果是否可接受。
5. 测试 Paper2Figure 的模型架构图，再测试技术路线图和实验图表。
6. 最后上传一个小 PDF 测试 KB 解析、embedding 与检索。

## 7. 当前阶段边界

requirements 已精简，但后端入口和前端菜单目前仍包含旧功能。旧页面如果被点击，可能提示缺少已注释的依赖。下一阶段应同时处理：

- 后端只挂载保留功能的 router；
- 前端目录和首页只展示保留功能；
- 解耦 `figuremind_service` 与 Paper2Video、通用 workflow adapter 的顶层导入；
- 将 workflow 注册从按文件顺序扫描改成按名称定向加载。
