# Daily Stock Analysis OpenClaw Plugin

🤖 AI-powered stock analysis bridge plugin

**Features:**
- ✅ **Lightweight** - ~300 lines, pure bridge logic
- ✅ **A/H/US Markets** - Support for Chinese A-shares, HK stocks, and US stocks
- ✅ **AI Decision Dashboard** - Buy/sell points + checklist + risk alerts
- ✅ **Agent Q&A** - 11 built-in strategies
- ✅ **Market Review** - Daily market overview and sector analysis
- ✅ **Smart Detection** - Strict trigger mode (only when you mention DSA)

---

## 🚀 Quick Start

### 1. Install Plugin

```bash
npm install -g @webleon/daily-stock-analysis-openclaw-plugin
openclaw plugins install @webleon/daily-stock-analysis-openclaw-plugin
openclaw gateway restart
```

### 2. Install DSA Service

**Option A: Quick Install (Recommended)**

```bash
# macOS/Linux
bash scripts/install.sh

# Windows
powershell scripts/install.ps1

# Cross-platform
python scripts/install.py
```

**Option B: Manual Install**

See [INSTALL.md](docs/INSTALL.md) for detailed guide.

### 3. Configure

Edit `.env` file:

```env
# AI API Key (choose one)
GEMINI_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here

# Stock list
STOCK_LIST=600519,hk00700,AAPL
```

### 4. Start Service

```
deploy_dsa(action="start")
```

### 5. Use

```
用 DSA 分析贵州茅台
用 DSA 分析 600519
用 DSA 复盘大盘
```

---

## ⚠️ Important: Trigger Mode

**Strict Mode** - DSA tools only trigger when you explicitly mention DSA:

**✅ Will trigger DSA:**
- "用 DSA 分析贵州茅台"
- "DSA 分析茅台"
- "用 Daily Stock Analysis 分析"

**❌ Won't trigger DSA:**
- "分析贵州茅台" (handled by Superpowers or AI assistant)
- "看看茅台走势" (handled by Superpowers or AI assistant)

This avoids conflicts with Superpowers skills!

---

## 📋 Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `stock_analysis` | Analyze single stock | `stock_analysis(code="600519")` |
| `batch_analysis` | Analyze multiple stocks | `batch_analysis(codes=["600519", "AAPL"])` |
| `ask_stock` | Agent strategy Q&A | `ask_stock(question="用缠论分析 600519")` |
| `deploy_dsa` | Deploy/manage service | `deploy_dsa(action="start")` |
| `dsa_version` | Check version | `dsa_version()` |

---

## 📈 大盘复盘

大盘复盘功能通过原项目命令行或 Bot 命令使用：

**方式 1: 命令行**
```bash
cd ~/.openclaw/external-services/daily_stock_analysis
source venv/bin/activate
python main.py --market-review
```

**方式 2: Bot 命令**
```
/market  # Telegram/Discord Bot 命令
```

**方式 3: 包含在股票分析中**
配置 `MARKET_REVIEW_ENABLED=true` 后，执行股票分析时会自动包含大盘复盘内容。

---

## 📚 Documentation

- **[INSTALL.md](docs/INSTALL.md)** - Detailed installation guide
- **[CONFIG.md](docs/CONFIG.md)** - Configuration options
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

---

## 🔧 Troubleshooting

### Service not running

```bash
# Check status
deploy_dsa(action="status")

# Start service
deploy_dsa(action="start")
```

### Port already in use

Edit `.env` and change `API_PORT=8009` to another port.

### API Key not working

Check your API Key in `.env` file and ensure it's valid.

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│  Bridge Plugin (~300 lines)         │
│  - index.ts (150 lines)             │
│  - src/api-client.ts (60 lines)     │
│  - src/keywords-strict.ts (80 lines)│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Install Scripts (Optional)         │
│  - scripts/install.sh               │
│  - scripts/install.ps1              │
│  - scripts/install.py               │
└─────────────────────────────────────┘
```

**Design principle:** Separation of concerns - bridge plugin stays minimal, installation scripts are optional tools.

---

## 📝 License

MIT

## 👤 Author

WebLeOn (@webleon)

## 🔗 Links

- [DSA Original Project](https://github.com/ZhuLinsen/daily_stock_analysis)
- [OpenClaw](https://github.com/openclaw/openclaw)
- [Issue Tracker](https://github.com/webleon/daily-stock-analysis-openclaw-plugin/issues)
