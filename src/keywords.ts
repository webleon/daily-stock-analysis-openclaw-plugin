/**
 * 关键词定义 - 用于股票相关任务检测
 * Simple keyword matching (no weights needed)
 */

export const CHINESE_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "分析", "股票", "买点", "卖点", "目标价", "止损价",
    "这股", "个股", "能买吗", "能卖吗",
    "如何操作", "走势", "行情", "茅台", "腾讯", "苹果", "宁德时代"
  ],
  "batch_analysis": [
    "批量", "多只", "持仓", "这些股", "我的持仓"
  ],
  "market_review": [
    "大盘", "复盘", "市场概览", "上证指数", "创业板", "板块",
    "行情", "涨跌"
  ],
  "ask_stock": [
    "问股", "缠论", "均线", "波浪", "技术面", "基本面"
  ]
};

export const ENGLISH_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "analyze stock", "stock analysis", "analyze aapl", "stock trend",
    "buy point", "sell point", "target price"
  ],
  "batch_analysis": [
    "batch analyze", "portfolio analysis", "my stocks"
  ],
  "market_review": [
    "market review", "market overview", "sector", "market today"
  ],
  "ask_stock": [
    "ask stock", "strategy", "technical analysis"
  ]
};

export function detectRelevantTools(prompt: string): string[] {
  const relevant = new Set<string>();

  for (const [toolName, keywords] of Object.entries(CHINESE_KEYWORDS)) {
    if (keywords.some(kw => prompt.includes(kw))) {
      relevant.add(toolName);
    }
  }

  const promptLower = prompt.toLowerCase();
  for (const [toolName, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    if (keywords.some(kw => promptLower.includes(kw.toLowerCase()))) {
      relevant.add(toolName);
    }
  }

  return Array.from(relevant);
}
