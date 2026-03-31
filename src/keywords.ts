/**
 * 关键词定义 - 用于股票相关任务检测
 * Simple keyword matching (no weights needed)
 */

export const CHINESE_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "分析股票", "股票分析", "买点", "卖点", "目标价", "止损价",
    "这只股票", "个股分析", "能买吗", "能卖吗"
  ],
  "batch_analysis": [
    "批量分析", "多只股票", "持仓分析", "这些股"
  ],
  "market_review": [
    "大盘", "复盘", "市场概览", "上证指数", "创业板", "板块"
  ],
  "ask_stock": [
    "问股", "缠论", "均线", "波浪", "技术面", "基本面"
  ]
};

export const ENGLISH_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "analyze stock", "stock analysis", "buy point", "sell point"
  ],
  "batch_analysis": [
    "batch analyze", "portfolio analysis"
  ],
  "market_review": [
    "market review", "market overview", "sector"
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
