# Pandapower Web

A web-based power flow calculator built on [pandapower](https://www.pandapower.org/), providing an intuitive interface for power system analysis.

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)
![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)

[中文版](#中文版)

## Screenshots

| Upload & Example Networks | Power Flow Results |
|:---:|:---:|
| ![Upload](screenshot/first-screen.png) | ![Results](screenshot/powerflow-result.png) |

## Features

- **Multi-format Support**: JSON, Excel (.xlsx/.xls), Pickle (.pkl/.p/.pickle), SQLite (.sqlite/.db)
- **Multiple Algorithms**: Newton-Raphson, Backward/Forward Sweep, Gauss-Seidel, Fast Decoupled
- **Numba Acceleration**: JIT compilation for faster power flow calculations
- **i18n**: Bilingual interface (English / Chinese) with one-click language switching
- **Example Networks**: Built-in example networks for quick exploration
- **Result Visualization**: Bus voltage, line loading, transformer status, and more
- **Smart Tables**: Column resize, frozen columns, virtual scrolling, sorting, and filtering
- **Voltage Highlighting**: Color-coded voltage deviation (normal / warning / critical)
- **Overload Alerts**: Automatic detection of voltage violations and equipment overloads
- **Slack Bus Power**: Display active/reactive power output of slack buses and generators
- **Excel Export**: One-click download of calculation results

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

#### Install uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### One-Click Start (Recommended)

```bash
git clone https://github.com/your-username/pandapower-web.git
cd pandapower-web

# Production mode (default)
./start.sh

# Development mode
./start.sh -m dev

# Custom ports
./start.sh -b 8080 -f 3000

# Specify external IP (for server deployment)
./start.sh -H 192.168.1.100

# Stop all services
./stop.sh
```

**Start script parameters:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-m, --mode` | Run mode: dev / prod | prod |
| `-b, --backend` | Backend port | 8000 |
| `-f, --frontend` | Frontend port | 5173 (dev) / 8080 (prod) |
| `-H, --host` | External IP / hostname | auto-detect |
| `-w, --workers` | Backend worker processes | 4 |

After starting:
- Frontend: http://localhost:5173 (dev) or http://server-ip:8080 (prod)
- API docs: http://localhost:8000/docs

### Manual Setup

**Backend:**
```bash
cd backend
uv sync                    # Install dependencies
uv run python run.py       # Start dev server (port 8000)
```

**Frontend:**
```bash
cd frontend
npm install                # Install dependencies
npm run dev                # Start dev server (port 5173)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 18 + Vite + Tailwind CSS                             │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ FileUpload  │NetworkSummary│CalculationForm│ResultsDisplay│ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (axios)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  FastAPI + Uvicorn                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    API Layer                             ││
│  │  /api/v1/powerflow/upload, /run, /results, /download    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 Service Layer                            ││
│  │  PowerFlowService (session management, calculations)    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 pandapower                               ││
│  │  Network loading, Power flow analysis, Result export    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/powerflow/upload` | Upload and parse a network file |
| POST | `/api/v1/powerflow/run/{session_id}` | Run power flow calculation |
| GET | `/api/v1/powerflow/results/{session_id}` | Get cached results |
| GET | `/api/v1/powerflow/download/{session_id}` | Download Excel results |
| DELETE | `/api/v1/powerflow/session/{session_id}` | Clean up session |

### Calculation Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| algorithm | string | "nr" | Algorithm: nr, bfsw, gs, fdbx, fdxb |
| max_iteration | int | 0 | Max iterations (0 = auto, uses pandapower defaults) |
| tolerance_mva | float | 1e-8 | Convergence tolerance (MVA) |
| enforce_q_lims | bool | false | Enforce reactive power limits |
| calculate_voltage_angles | bool | true | Calculate voltage angles |
| init | string | "auto" | Initialization: auto, flat, dc, results |

## Supported File Formats

| Format | Extensions | Description |
|--------|------------|-------------|
| JSON | .json | pandapower JSON format (recommended) |
| Excel | .xlsx, .xls | Spreadsheet format |
| Pickle | .pkl, .p, .pickle | Python binary format |
| SQLite | .sqlite, .db | Database format |

## Deployment

### Docker

**Backend:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
COPY backend/ .
RUN uv sync --frozen
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/ .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
```

### Manual Deployment

**Backend:**
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ to nginx or any static file server
```

### Nginx Configuration Example

```nginx
server {
    listen 8080;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/pandapower-web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [Mozilla Public License 2.0](LICENSE).

## Acknowledgements

- [pandapower](https://www.pandapower.org/) - Power system analysis library
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

# 中文版

# Pandapower Web

基于 [pandapower](https://www.pandapower.org/) 的电力系统潮流计算 Web 应用，提供直观的用户界面进行电网分析。

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)
![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)

## 截图

| 上传与示例网络 | 潮流计算结果 |
|:---:|:---:|
| ![上传](screenshot/first-screen.png) | ![结果](screenshot/powerflow-result.png) |

## 功能特性

- **多格式文件支持**：JSON、Excel (.xlsx/.xls)、Pickle (.pkl/.p/.pickle)、SQLite (.sqlite/.db)
- **多种算法**：牛顿-拉夫逊、前推回代、高斯-赛德尔、快速解耦
- **Numba 加速**：启用 JIT 编译加速潮流计算
- **国际化**：中英文双语界面，一键切换语言
- **示例网络**：内置示例网络，快速体验
- **结果可视化**：母线电压、线路负载、变压器状态等详细结果展示
- **智能表格**：列宽拖拽调整、首列冻结、虚拟滚动、排序筛选
- **电压高亮**：电压偏差颜色编码（正常 / 告警 / 严重）
- **告警提示**：自动识别电压越限和设备过载
- **平衡节点功率**：显示平衡节点（含发电机）的有功无功输出
- **Excel 导出**：一键下载计算结果

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)（Python 包管理器）

#### 安装 uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 一键启动（推荐）

```bash
git clone https://github.com/your-username/pandapower-web.git
cd pandapower-web

# 生产模式启动（默认）
./start.sh

# 开发模式启动
./start.sh -m dev

# 自定义端口
./start.sh -b 8080 -f 3000

# 指定外部访问 IP（用于服务器部署）
./start.sh -H 192.168.1.100

# 停止服务
./stop.sh
```

**启动参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-m, --mode` | 运行模式：dev / prod | prod |
| `-b, --backend` | 后端端口 | 8000 |
| `-f, --frontend` | 前端端口 | 5173 (dev) / 8080 (prod) |
| `-H, --host` | 外部访问 IP / 主机名 | 自动检测 |
| `-w, --workers` | 后端工作进程数 | 4 |

启动后访问：
- 前端界面：http://localhost:5173（开发）或 http://服务器IP:8080（生产）
- API 文档：http://localhost:8000/docs

### 手动启动

**后端：**
```bash
cd backend
uv sync                    # 安装依赖
uv run python run.py       # 启动开发服务器（端口 8000）
```

**前端：**
```bash
cd frontend
npm install                # 安装依赖
npm run dev                # 启动开发服务器（端口 5173）
```

## API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/powerflow/upload` | 上传网络文件 |
| POST | `/api/v1/powerflow/run/{session_id}` | 运行潮流计算 |
| GET | `/api/v1/powerflow/results/{session_id}` | 获取计算结果 |
| GET | `/api/v1/powerflow/download/{session_id}` | 下载 Excel 结果 |
| DELETE | `/api/v1/powerflow/session/{session_id}` | 清理会话 |

### 计算参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| algorithm | string | "nr" | 算法：nr, bfsw, gs, fdbx, fdxb |
| max_iteration | int | 0 | 最大迭代次数（0 = 自动，使用 pandapower 默认值） |
| tolerance_mva | float | 1e-8 | 收敛精度（MVA） |
| enforce_q_lims | bool | false | 强制无功限制 |
| calculate_voltage_angles | bool | true | 计算电压相角 |
| init | string | "auto" | 初始化方法：auto, flat, dc, results |

## 支持的文件格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| JSON | .json | pandapower JSON 格式，推荐使用 |
| Excel | .xlsx, .xls | 电子表格格式 |
| Pickle | .pkl, .p, .pickle | Python 二进制格式 |
| SQLite | .sqlite, .db | 数据库格式 |

## 生产部署

### 使用 Docker

**后端：**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
COPY backend/ .
RUN uv sync --frozen
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**前端：**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/ .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
```

### 手动部署

**后端：**
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**前端：**
```bash
cd frontend
npm run build
# 将 dist/ 目录部署到 nginx 或其他静态文件服务器
```

### Nginx 配置示例

```nginx
server {
    listen 8080;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/pandapower-web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 贡献

欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 许可证

本项目使用 [Mozilla Public License 2.0](LICENSE) 许可证。

## 致谢

- [pandapower](https://www.pandapower.org/) - 电力系统分析库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代 Python Web 框架
- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
