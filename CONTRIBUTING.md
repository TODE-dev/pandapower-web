# Contributing to Pandapower Web

Thank you for your interest in contributing to Pandapower Web! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/pandapower-web.git
   cd pandapower-web
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Backend

```bash
cd backend
uv sync          # Install dependencies
uv run python run.py   # Start dev server on port 8000
```

### Frontend

```bash
cd frontend
npm install      # Install dependencies
npm run dev      # Start dev server on port 5173
```

### One-Click Start (Recommended)

```bash
./start.sh -m dev   # Start both backend and frontend in dev mode
./stop.sh           # Stop all services
```

## Code Style

### Python (Backend)

- Follow PEP 8 conventions
- Use type hints for function signatures
- Use Pydantic models for request/response validation
- Use async endpoints where beneficial

### JavaScript (Frontend)

- Functional components with React hooks
- Destructure props in function signatures
- Use Tailwind CSS utility classes for styling
- Use axios for API calls

### UI Text

- All user-facing text should support i18n (English and Chinese)
- Code comments in English
- Variable and function names in English

## Pull Request Process

1. Ensure your code follows the project's coding conventions
2. Update documentation if you've changed APIs or added features
3. Test your changes manually:
   - Upload a pandapower network file
   - Run power flow calculation
   - Verify results display correctly
4. Write a concise commit message (English or Chinese)
5. Open a pull request with a clear description of your changes

### Commit Messages

- Keep commit messages concise and descriptive
- English or Chinese are both acceptable
- Example: `Add support for MATPOWER file format` or `修复电压越限高亮显示问题`

## Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include steps to reproduce for bug reports
- Include the network file (if possible) that triggered the issue
- Mention your browser, OS, Python version, and Node.js version

## Project Structure

See [README.md](README.md) for the full project structure and architecture overview.

---

# 贡献指南

感谢您对 Pandapower Web 项目的关注！本指南将帮助您开始贡献。

## 入门

1. Fork 本仓库
2. 克隆您的 fork：
   ```bash
   git clone https://github.com/your-username/pandapower-web.git
   cd pandapower-web
   ```
3. 创建功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 开发环境配置

### 前置条件

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)（Python 包管理器）

### 后端

```bash
cd backend
uv sync              # 安装依赖
uv run python run.py # 启动开发服务器（端口 8000）
```

### 前端

```bash
cd frontend
npm install    # 安装依赖
npm run dev    # 启动开发服务器（端口 5173）
```

### 一键启动（推荐）

```bash
./start.sh -m dev   # 以开发模式启动前后端
./stop.sh           # 停止所有服务
```

## 代码规范

### Python（后端）

- 遵循 PEP 8 规范
- 函数签名使用类型注解
- 使用 Pydantic 模型进行请求/响应验证
- 适当使用 async 端点

### JavaScript（前端）

- 使用函数式组件和 React hooks
- 在函数签名中解构 props
- 使用 Tailwind CSS 工具类进行样式设计
- 使用 axios 进行 API 调用

### UI 文本

- 所有用户界面文本应支持国际化（中英文）
- 代码注释使用英文
- 变量和函数名使用英文

## Pull Request 流程

1. 确保代码遵循项目编码规范
2. 如果修改了 API 或添加了新功能，请更新文档
3. 手动测试您的更改：
   - 上传 pandapower 网络文件
   - 运行潮流计算
   - 验证结果显示正确
4. 编写简洁的提交信息（中文或英文均可）
5. 提交 Pull Request 并清晰描述您的更改

### 提交信息

- 保持提交信息简洁且具有描述性
- 中文或英文均可
- 示例：`Add support for MATPOWER file format` 或 `修复电压越限高亮显示问题`

## 报告问题

- 使用 GitHub Issues 报告 bug 或提出功能需求
- bug 报告请包含复现步骤
- 如果可能，请附上触发问题的网络文件
- 请注明您的浏览器、操作系统、Python 版本和 Node.js 版本

## 项目结构

完整的项目结构和架构概览请参阅 [README.md](README.md)。
