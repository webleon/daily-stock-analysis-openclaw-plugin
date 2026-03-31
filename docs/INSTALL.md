# DSA 服务安装指南

**最后更新：** 2026-03-31

---

## 🎯 选择安装方式

### 方式 1：快速安装（推荐新手）⭐⭐⭐⭐⭐

**适用：** 所有用户

```bash
# macOS/Linux
bash scripts/install.sh

# Windows
powershell scripts/install.ps1

# 跨平台
python scripts/install.py
```

**优点：**
- ✅ 自动检测环境
- ✅ 一键完成所有步骤
- ✅ 友好的错误提示

---

### 方式 2：手动安装（推荐老手）⭐⭐⭐⭐

**适用：** 有 Python 经验的用户

#### 步骤 1：安装 Python 3.10+

**macOS:**
```bash
brew install python@3.10
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3.10-dev
```

**Windows:**
1. 访问 https://www.python.org/downloads/
2. 下载 Python 3.10+
3. 安装时勾选 "Add Python to PATH"

#### 步骤 2：克隆仓库

```bash
cd ~/.openclaw/external-services/daily_stock_analysis
```

#### 步骤 3：创建虚拟环境

```bash
python3 -m venv venv
```

#### 步骤 4：激活虚拟环境

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```powershell
venv\Scripts\activate
```

#### 步骤 5：安装依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 步骤 6：配置环境

```bash
cp .env.example .env
vim .env  # 编辑配置
```

---

## 🔧 配置说明

### 必要配置

**1. AI API Key（至少配置一个）**

**Google Gemini（推荐）:**
```env
GEMINI_API_KEY=AIzaSy...your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

获取：https://aistudio.google.com/apikey

**通义千问:**
```env
OPENAI_API_KEY=sk-...your_key_here
OPENAI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
OPENAI_MODEL=kimi-k2.5
```

获取：https://dashscope.console.aliyun.com/apiKey

**DeepSeek:**
```env
DEEPSEEK_API_KEY=sk-...your_key_here
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

获取：https://platform.deepseek.com/api_keys

**2. 股票代码**

```env
STOCK_LIST=600519,hk00700,AAPL,TSLA
```

格式：
- A 股：`600519`
- 港股：`hk00700`
- 美股：`AAPL`

---

### 可选配置

**通知渠道:**

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# 企业微信
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx

# 飞书
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

# 邮件
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_RECEIVERS=recipient@example.com
```

**其他选项:**

```env
# API 端口（默认 8009）
API_PORT=8009

# 并发数（默认 3）
MAX_WORKERS=3

# 报告语言（默认 zh）
REPORT_LANGUAGE=zh

# 报告类型：simple/full/brief
REPORT_TYPE=full
```

---

## 🚀 启动服务

```bash
# 启动
deploy_dsa(action="start")

# 查看状态
deploy_dsa(action="status")

# 停止
deploy_dsa(action="stop")
```

---

## 🧪 测试安装

**1. 检查服务状态**

```bash
curl http://localhost:8009/api/health
```

**2. 分析股票**

```
用 DSA 分析贵州茅台
```

**3. 查看日志**

```bash
tail -f logs/stock_analysis_*.log
```

---

## ❓ 常见问题

### Q: Python 版本过低

**错误：** `Python 3.9.6 is not supported`

**解决：**
```bash
# macOS
brew install python@3.10

# Ubuntu
sudo apt install python3.10

# 然后重新运行安装脚本
bash scripts/install.sh
```

---

### Q: 依赖安装失败

**错误：** `Could not find a version that satisfies the requirement xxx`

**解决：**
```bash
# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

### Q: 端口被占用

**错误：** `Address already in use`

**解决：**
1. 编辑 `.env`
2. 修改 `API_PORT=8010`（或其他端口）
3. 重启服务

---

### Q: API Key 无效

**错误：** `Invalid API Key`

**解决：**
1. 检查 `.env` 中的 API Key 是否正确
2. 确保没有多余的空格
3. 测试 API Key 是否有效

---

### Q: 服务启动失败

**解决：**
```bash
# 查看详细日志
tail -100 logs/stock_analysis_*.log

# 检查 Python 版本
python3 --version

# 检查虚拟环境
source venv/bin/activate
python -c "import fastapi, uvicorn"
```

---

## 📚 相关文档

- [README.md](README.md) - 快速开始
- [CONFIG.md](CONFIG.md) - 配置说明
- [CHANGELOG.md](CHANGELOG.md) - 更新日志

---

## 💡 提示

1. **首次安装需要 2-5 分钟**（下载依赖）
2. **建议使用 Python 3.10 或 3.11**（兼容性最好）
3. **定期更新依赖**：`pip install --upgrade -r requirements.txt`
4. **备份配置文件**：`cp .env .env.backup`

---

**安装完成后，试试：`用 DSA 分析贵州茅台`** 🎉
