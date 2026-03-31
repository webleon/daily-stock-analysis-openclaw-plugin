# DSA 原项目可配置外部服务分析

**分析日期：** 2026-03-31  
**分析方法：** Superpowers systematic-debugging  
**配置文件：** `src/config.py` (217 个环境变量)

---

## 📊 可配置的外部服务分类

### 1️⃣ AI 大模型服务

| 服务 | 环境变量 | 用途 | 当前状态 |
|------|---------|------|---------|
| **Google Gemini** | `GEMINI_API_KEY`<br>`GEMINI_API_KEYS`<br>`GEMINI_MODEL` | 主 AI 模型 | ✅ 已配置 |
| **Anthropic Claude** | `ANTHROPIC_API_KEY`<br>`ANTHROPIC_API_KEYS`<br>`ANTHROPIC_MODEL` | 备选 AI 模型 | ❌ 未配置 |
| **OpenAI GPT** | `OPENAI_API_KEY`<br>`OPENAI_API_KEYS`<br>`OPENAI_MODEL`<br>`OPENAI_BASE_URL` | 兼容接口 | ✅ 已配置 (通义千问) |
| **DeepSeek** | `DEEPSEEK_API_KEY`<br>`DEEPSEEK_API_KEYS`<br>`DEEPSEEK_MODEL` | 国产 AI 模型 | ❌ 未配置 |
| **AIHubMix** | `AIHUBMIX_KEY` | 聚合平台 | ❌ 未配置 |
| **Moonshot Kimi** | `MOONSHOT_API_KEY` | 月之暗面 | ❌ 未配置 |
| **通义千问** | `DASHSCOPE_API_KEY` | 阿里云 | ❌ 未配置 |

**高级配置：**
| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| 主模型 | `LITELLM_MODEL` | LiteLLM 统一接口 |
| 备选模型 | `LITELLM_FALLBACK_MODELS` | 故障转移 |
| 渠道模式 | `LLM_CHANNELS` | 多渠道配置 |
| Agent 模型 | `AGENT_LITELLM_MODEL` | Agent 专用模型 |
| 温度参数 | `LLM_TEMPERATURE` | 0.0-2.0，默认 0.7 |

---

### 2️⃣ 数据源服务

| 服务 | 环境变量 | 用途 | 当前状态 |
|------|---------|------|---------|
| **Tushare Pro** | `TUSHARE_TOKEN` | A 股数据 | ❌ 未配置 |
| **TickFlow** | `TICKFLOW_API_KEY` | 增强数据 | ❌ 未配置 |
| **东方财富** | (内置) | 免费数据源 | ✅ 自动使用 |
| **AkShare** | (内置) | 免费数据源 | ✅ 自动使用 |
| **YFinance** | (内置) | 美股数据 | ✅ 自动使用 |
| **Pytdx** | (内置) | 行情数据 | ✅ 自动使用 |
| **Baostock** | (内置) | 免费数据 | ✅ 自动使用 |

**高级配置：**
| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| 数据源优先级 | `DATA_PROVIDER_PRIORITY` | 自定义顺序 |
| 东财补丁 | `ENABLE_EASTMONEY_PATCH` | 反爬注入 |

---

### 3️⃣ 新闻搜索服务

| 服务 | 环境变量 | 用途 | 当前状态 |
|------|---------|------|---------|
| **Tavily** | `TAVILY_API_KEYS` | AI 搜索 | ❌ 未配置 |
| **SerpAPI** | `SERPAPI_API_KEYS` | 全渠道搜索 | ❌ 未配置 |
| **Bocha 博查** | `BOCHA_API_KEYS` | 中文搜索 | ❌ 未配置 |
| **Brave Search** | `BRAVE_API_KEYS` | 隐私搜索 | ❌ 未配置 |
| **MiniMax** | `MINIMAX_API_KEYS` | 结构化搜索 | ❌ 未配置 |
| **SearXNG** | `SEARXNG_BASE_URLS` | 自建聚合 | ⚠️ 公共实例 |

**高级配置：**
| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| 公共实例 | `SEARXNG_PUBLIC_INSTANCES_ENABLED` | 自动发现 |
| 新闻时效 | `NEWS_MAX_AGE_DAYS` | 最大天数，默认 3 天 |
| 新闻策略 | `NEWS_STRATEGY_PROFILE` | ultra_short/short/medium/long |

---

### 4️⃣ 通知推送服务

| 服务 | 环境变量 | 用途 | 当前状态 |
|------|---------|------|---------|
| **企业微信** | `WECHAT_WEBHOOK_URL` | 群机器人 | ❌ 未配置 |
| **飞书** | `FEISHU_WEBHOOK_URL`<br>`FEISHU_APP_ID`<br>`FEISHU_APP_SECRET` | 群机器人/API | ❌ 未配置 |
| **Telegram** | `TELEGRAM_BOT_TOKEN`<br>`TELEGRAM_CHAT_ID` | Bot 推送 | ❌ 未配置 |
| **Discord** | `DISCORD_WEBHOOK_URL`<br>`DISCORD_BOT_TOKEN`<br>`DISCORD_MAIN_CHANNEL_ID` | 群推送 | ❌ 未配置 |
| **Slack** | `SLACK_BOT_TOKEN`<br>`SLACK_CHANNEL_ID`<br>`SLACK_WEBHOOK_URL` | 群推送 | ❌ 未配置 |
| **钉钉** | `DINGTALK_WEBHOOK_URL` | 群机器人 | ❌ 未配置 |
| **邮件** | `EMAIL_SENDER`<br>`EMAIL_PASSWORD`<br>`EMAIL_RECEIVERS` | SMTP 推送 | ❌ 未配置 |
| **PushPlus** | `PUSHPLUS_TOKEN`<br>`PUSHPLUS_TOPIC` | 微信推送 | ❌ 未配置 |
| **Server 酱** | `SERVERCHAN3_SENDKEY` | 微信推送 | ❌ 未配置 |

**高级配置：**
| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| 消息类型 | `WECHAT_MSG_TYPE` | markdown/text |
| 最大字节 | `WECHAT_MAX_BYTES` | 企业微信限制 |
| 分组推送 | `STOCK_GROUP_N` | 股票分组 |
| 合并推送 | `MERGE_EMAIL_NOTIFICATION` | 个股 + 大盘合并 |

---

### 5️⃣ 定时任务配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| 定时模式 | `SCHEDULE_MODE` | `false` | 启用定时任务 |
| Cron 表达式 | `SCHEDULE` | `0 18 * * 1-5` | 工作日 18:00 |
| 启动立即执行 | `SCHEDULE_RUN_IMMEDIATELY` | `false` | 启动时执行一次 |
| 非定时立即执行 | `RUN_IMMEDIATELY` | `false` | 非定时模式启动时执行 |
| 交易日检查 | `TRADING_DAY_CHECK_ENABLED` | `true` | 非交易日跳过 |
| 强制运行 | `FORCE_RUN` | `false` | 忽略交易日检查 |

---

### 6️⃣ 分析参数配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| 并发数 | `MAX_WORKERS` | `3` | 最大并发分析数 |
| 分析延迟 | `ANALYSIS_DELAY` | `10` | 个股间延迟（秒） |
| 报告类型 | `REPORT_TYPE` | `full` | simple/full/brief |
| 报告语言 | `REPORT_LANGUAGE` | `zh` | zh/en |
| 仅摘要 | `REPORT_SUMMARY_ONLY` | `false` | 只推送汇总 |
| 模板目录 | `REPORT_TEMPLATES_DIR` | `templates` | Jinja2 模板 |
| 模板渲染 | `REPORT_RENDERER_ENABLED` | `false` | 启用模板 |
| 完整性校验 | `REPORT_INTEGRITY_ENABLED` | `true` | 缺失字段重试 |
| 重试次数 | `REPORT_INTEGRITY_RETRY` | `1` | 重试次数 |
| 历史对比 | `REPORT_HISTORY_COMPARE_N` | `0` | 对比历史信号数 |

---

### 7️⃣ 交易策略配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| 乖离率阈值 | `BIAS_THRESHOLD` | `5.0` | 追高判定（%） |
| 强势股放宽 | `STRONG_STOCK_BIAS_RELAX` | `true` | 趋势股放宽 |
| Agent 模式 | `AGENT_MODE` | `false` | 启用策略对话 |
| Agent 技能 | `AGENT_SKILLS` | `bull_trend` | 激活的技能 |
| Agent 步数 | `AGENT_MAX_STEPS` | `10` | 最大推理步数 |
| Agent 架构 | `AGENT_ARCH` | `single` | single/multi |
| Agent 编排 | `AGENT_ORCHESTRATOR_MODE` | `standard` | quick/standard/full |

---

### 8️⃣ 系统配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| API 端口 | `API_PORT` | `8009` | Web 服务端口 |
| API 主机 | `API_HOST` | `0.0.0.0` | 监听地址 |
| 调试模式 | `DEBUG` | `false` | 启用调试日志 |
| 日志目录 | `LOG_DIR` | `logs` | 日志文件目录 |
| 数据目录 | `DATA_DIR` | `data` | 数据存储目录 |
| 报告目录 | `REPORT_DIR` | `reports` | 报告存储目录 |
| 数据库 | `DATABASE_URL` | `sqlite:///data/stock_analysis.db` | 数据库连接 |
| 环境变量文件 | `ENV_FILE` | `.env` | 自定义.env 路径 |

**代理配置：**
| 配置项 | 环境变量 | 说明 |
|--------|---------|------|
| HTTP 代理 | `HTTP_PROXY`<br>`http_proxy` | HTTP 代理地址 |
| HTTPS 代理 | `HTTPS_PROXY`<br>`https_proxy` | HTTPS 代理地址 |
| 不代理 | `NO_PROXY`<br>`no_proxy` | 绕过代理的域名 |

---

### 9️⃣ 高级功能配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| 筹码分布 | `ENABLE_CHIP_DISTRIBUTION` | `false` | 启用筹码分析 |
| 基本面聚合 | `ENABLE_FUNDAMENTAL_PIPELINE` | `true` | 启用基本面分析 |
| 基本面超时 | `FUNDAMENTAL_STAGE_TIMEOUT_SECONDS` | `300` | 总预算（秒） |
| 单源超时 | `FUNDAMENTAL_FETCH_TIMEOUT_SECONDS` | `30` | 单能力源超时 |
| 重试次数 | `FUNDAMENTAL_RETRY_MAX` | `3` | 基本面重试 |
| 缓存 TTL | `FUNDAMENTAL_CACHE_TTL_SECONDS` | `3600` | 缓存过期时间 |
| 缓存大小 | `FUNDAMENTAL_CACHE_MAX_ENTRIES` | `1000` | 最大缓存条目 |
| 实时行情预取 | `PREFETCH_REALTIME_QUOTES` | `true` | 预取全市场 |

---

### 🔟 回测配置

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| 自动回测 | `AUTO_BACKTEST` | `true` | 启动时自动回测 |
| 回测天数 | `BACKTEST_DAYS` | `30` | 回测天数 |
| 回测股票 | `BACKTEST_STOCKS` | `STOCK_LIST` | 回测股票列表 |

---

## 📋 当前配置状态总结

### ✅ 已配置
- ✅ OPENAI_API_KEY (通义千问 Kimi K2.5)
- ✅ OPENAI_BASE_URL (https://coding.dashscope.aliyuncs.com/v1)
- ✅ OPENAI_MODEL (kimi-k2.5)
- ✅ SEARXNG (公共实例自动发现)

### ❌ 未配置但推荐
- ❌ TUSHARE_TOKEN (财报数据、PE 估值)
- ❌ TELEGRAM_BOT_TOKEN (推送通知)
- ❌ TAVILY_API_KEYS (新闻搜索)
- ❌ GEMINI_API_KEY (备用 AI 模型)

### ⚠️ 可选配置
- ⚠️ MAX_WORKERS (当前默认 3，可根据性能调整)
- ⚠️ REPORT_TYPE (当前默认 full，可改为 simple)
- ⚠️ BIAS_THRESHOLD (当前默认 5.0，可根据风险偏好调整)

---

## 💡 建议补充的配置

**最小可用配置（推荐）：**
```env
# AI 模型（已有）
OPENAI_API_KEY=sk-sp-e83eba41939349b8949a569e7a8ba881
OPENAI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
OPENAI_MODEL=kimi-k2.5

# 数据增强（推荐）
TUSHARE_TOKEN=your_token_here

# 推送通知（可选）
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# 新闻搜索（可选）
TAVILY_API_KEYS=your_key_here
```

---

**完整配置文件模板：** 见 `.env.example` 文件
