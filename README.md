# Daily Stock Analysis OpenClaw Plugin

🤖 AI-powered stock analysis plugin for OpenClaw - bridge to [Daily Stock Analysis](https://github.com/ZhuLinsen/daily_stock_analysis)

**Features:**
- ✅ **Python deployment** - No Docker required!
- ✅ **Out-of-the-box** - Auto-detect Python, auto-create virtual environment
- ✅ **One-command setup** - `deploy_dsa(action="install")` does everything
- ✅ **A/H/US Markets** - Support for Chinese A-shares, HK stocks, and US stocks
- ✅ **AI Decision Dashboard** - Buy/sell points + checklist + risk alerts
- ✅ **Agent Q&A** - 11 built-in strategies (Chan Theory, MA, Elliott Wave, etc.)
- ✅ **Market Review** - Daily market overview and sector analysis
- ✅ **Smart Detection** - Auto-detect stock-related queries with weighted keywords

## Quick Start

### 1. Install Plugin

```bash
npm install -g @webleon/daily-stock-analysis-openclaw-plugin
openclaw plugins install @webleon/daily-stock-analysis-openclaw-plugin
openclaw gateway restart
```

### 2. Deploy DSA Service (Auto-install, Out-of-the-Box!)

**Using OpenClaw tool:**
```
deploy_dsa(action="install")
```

This will automatically:
- ✅ Check if Python is installed (requires Python 3.10+)
- ✅ Clone the repository
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Create .env configuration file

**No manual steps required!** 🎉

---

## ⚠️ Important: Trigger Mode

**Strict Mode** (v1.1+) - DSA tools only trigger when you explicitly mention DSA:

**✅ Will trigger DSA:**
- "用 DSA 分析贵州茅台"
- "DSA 分析茅台"
- "用 Daily Stock Analysis 分析"
- "股票分析插件 分析茅台"

**❌ Won't trigger DSA** (handled by Superpowers or AI assistant):
- "分析贵州茅台"
- "看看茅台走势"
- "写代码分析股票"
- "测试股票策略"

This design avoids conflicts with Superpowers skills!

### 3. Configure

Edit `~/.openclaw/external-services/daily_stock_analysis/.env`:

```env
# Required: Your stock list
STOCK_LIST=600519,hk00700,AAPL,TSLA

# Required: At least one AI API Key
GEMINI_API_KEY=your_gemini_key_here

# Optional: Notification channels
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 4. Start Service

**Using OpenClaw tool:**
```
deploy_dsa(action="start")
```

### 5. Verify

```
dsa_version()
```

Should return:
```json
{
  "plugin": "1.0.0",
  "service": "running",
  "serviceStatus": "running",
  "serviceUrl": "http://localhost:8009",
  "port": 8009
}
```

## Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `stock_analysis` | Analyze single stock with AI decision dashboard | `stock_analysis(code="600519")` |
| `batch_analysis` | Analyze multiple stocks | `batch_analysis(codes=["600519", "AAPL"])` |
| `market_review` | Market overview and sector analysis | `market_review(market="cn")` |
| `ask_stock` | Agent strategy Q&A | `ask_stock(question="用缠论分析 600519")` |
| `deploy_dsa` | Deploy/manage DSA service (Python) | `deploy_dsa(action="install")` |
| `dsa_version` | Check plugin and service status | `dsa_version()` |

## Usage Examples

### Important: Trigger DSA Tools

**DSA tools only trigger when you explicitly mention DSA:**

✅ **Will trigger DSA:**
- "用 DSA 分析贵州茅台"
- "DSA 分析茅台"
- "用 Daily Stock Analysis 分析"
- "股票分析插件 分析茅台"

❌ **Won't trigger DSA (handled by Superpowers):**
- "分析贵州茅台"
- "看看茅台走势"
- "写代码分析股票"
- "测试股票策略"

This avoids conflicts with Superpowers skills!

**Response:**
```
📊 贵州茅台 (600519)

✨ 核心结论：观望 | 评分 65 | 趋势向好但需消化获利盘

🎯 操作建议:
- 买入价：1680-1700 元
- 止损价：1620 元
- 目标价：1850 元

✅ 检查清单:
- 均线多头排列：满足
- 成交量放大：注意
- 主力资金流入：不满足

🚨 风险警报:
- 短期乖离率偏高，不宜追高
```

### Batch Analysis

**User:** 分析我的持仓：茅台、腾讯、苹果

**Plugin:** Calls `batch_analysis(codes=["600519", "hk00700", "AAPL"])`

### Market Review

**User:** 今天大盘怎么样

**Plugin:** Calls `market_review(market="cn")`

**Response:**
```
📊 A 股大盘复盘

主要指数:
- 上证指数：3250.12 (+0.85%)
- 深证成指：10521.36 (+1.02%)
- 创业板指：2156.78 (+1.35%)

市场概况:
上涨：3920 | 下跌：1349 | 涨停：155

板块表现:
领涨：互联网服务、文化传媒、小金属
领跌：保险、航空机场
```

### Agent Q&A

**User:** 用缠论分析宁德时代

**Plugin:** Calls `ask_stock(question="用缠论分析 300750", code="300750")`

## Management Commands

### Check Status

```
deploy_dsa(action="status")
```

Returns:
```json
{
  "status": "running",
  "apiHealth": "healthy",
  "installed": true,
  "configured": true,
  "installDir": "/Users/xxx/.openclaw/external-services/daily_stock_analysis",
  "url": "http://localhost:8009",
  "port": 8009,
  "message": "✅ 已就绪，可以启动"
}
```

### Start/Stop

```
deploy_dsa(action="start")
deploy_dsa(action="stop")
```

### Uninstall

```
deploy_dsa(action="uninstall")
```

## Installation Methods

### Method 1: Python (Recommended for Local)

**Pros:**
- ✅ No Docker required
- ✅ Lightweight and fast
- ✅ Easy to debug and modify

**Requirements:**
- Python 3.10+
- pip
- git

**Install:**
```bash
node install.js --install-python
```

### Method 2: Docker (Optional)

**Pros:**
- ✅ Complete environment isolation
- ✅ Production-ready

**Requirements:**
- Docker Desktop
- Docker Compose

**Install:**
```bash
node install.js --install-docker
```

### Method 3: Auto-detect

Automatically chooses Python or Docker based on availability.

```bash
node install.js --install
```

## Configuration

Plugin config in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "daily-stock-analysis-openclaw-plugin": {
        "config": {
          "enabled": true,
          "dsaBaseUrl": "http://localhost:8009",
          "dsaPort": 8009,
          "autoDetectStock": true
        }
      }
    }
  }
}
```

## Troubleshooting

### Service Not Running

```bash
# Check status
deploy_dsa(action="status")

# Start service
deploy_dsa(action="start")

# View logs
cd ~/.openclaw/external-services/daily_stock_analysis
cat logs/*.log
```

### Python Not Found

```bash
# Check Python version
python3 --version

# Install Python 3.10+
# macOS: brew install python@3.10
# Windows: Download from https://www.python.org/downloads/
```

### Invalid Stock Code

```
Error: 无效的股票代码
Hint: 格式示例：A 股 600519, 港股 hk00700, 美股 AAPL
```

### API Connection Failed

1. Verify service is running: `curl http://localhost:8009/api/health`
2. Check firewall settings
3. Restart service: `deploy_dsa(action="stop")` then `deploy_dsa(action="start")`

### Model Configuration

See [LLM Configuration Guide](https://github.com/ZhuLinsen/daily_stock_analysis/blob/main/docs/LLM_CONFIG_GUIDE.md)

## Requirements

- **Python 3.10+** (for Python deployment)
- **Docker** (optional, for Docker deployment)
- **OpenClaw** v1.0+
- **AI API Key** (Gemini/Claude/OpenAI/etc.)

## License

MIT

## Author

WebLeOn (@webleon)

## Links

- [Daily Stock Analysis](https://github.com/ZhuLinsen/daily_stock_analysis) - Original project
- [OpenClaw](https://github.com/openclaw/openclaw) - Plugin platform
- [Issue Tracker](https://github.com/webleon/daily-stock-analysis-openclaw-plugin/issues)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)
