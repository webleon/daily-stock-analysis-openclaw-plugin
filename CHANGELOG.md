# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-31

### Added

- 🎉 Initial release
- ✅ Docker deployment with one command (`deploy_dsa`)
- ✅ Stock analysis tool (`stock_analysis`)
- ✅ Batch analysis tool (`batch_analysis`)
- ✅ Market review tool (`market_review`)
- ✅ Agent Q&A tool (`ask_stock`)
- ✅ Smart keyword detection (Chinese & English)
- ✅ Service management (start/stop/status/uninstall)
- ✅ Version check tool (`dsa_version`)
- ✅ Support for A/H/US markets
- ✅ AI decision dashboard with buy/sell points
- ✅ 11 built-in trading strategies

### Features

- **Auto-detection**: Automatically detects stock-related queries
- **Docker deployment**: One-command setup with `deploy_dsa(action="install")`
- **Multi-market**: Support for Chinese A-shares, HK stocks, and US stocks
- **AI-powered**: Integration with multiple LLM providers (Gemini, Claude, OpenAI, etc.)
- **Notification**: Support for Telegram, Enterprise WeChat, Feishu, Email, etc.

### Technical

- Built with TypeScript
- Uses OpenClaw plugin SDK
- Docker Compose for service orchestration
- RESTful API integration

---

## Future Plans

- [ ] Add history query tool
- [ ] Add portfolio management
- [ ] Add price alerts
- [ ] Support for custom strategies
- [ ] Multi-instance deployment
