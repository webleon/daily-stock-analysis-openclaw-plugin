/**
 * 关键词定义 - 用于股票相关任务检测
 */

/** Chinese keywords for stock-related task detection */
export const CHINESE_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "分析股票", "股票分析", "分析这个股", "看看这个股",
    "买点", "卖点", "目标价", "止损价",
    "这只股票", "个股分析", "股分析", "分析一下",
    "能买吗", "能卖吗", "持仓成本", "如何操作"
  ],
  "batch_analysis": [
    "批量分析", "多只股票", "持仓分析", "分析我的股票",
    "这几只股票", "帮我看看这些股"
  ],
  "market_review": [
    "大盘", "复盘", "市场概览", "行情", "涨跌",
    "板块", "上证指数", "创业板", "美股", "港股",
    "今日市场", "市场表现"
  ],
  "ask_stock": [
    "问股", "策略分析", "缠论", "均线", "波浪",
    "技术面", "基本面", "金叉", "死叉", "多头",
    "空头", "支撑位", "压力位"
  ]
};

/** English keywords for stock-related task detection (lowercase comparison) */
export const ENGLISH_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "analyze stock", "stock analysis", "buy point", "sell point",
    "target price", "stop loss", "this stock", "should i buy"
  ],
  "batch_analysis": [
    "batch analyze", "portfolio analysis", "my stocks"
  ],
  "market_review": [
    "market review", "market overview", "sector",
    "shanghai composite", "nasdaq", "market today"
  ],
  "ask_stock": [
    "ask stock", "strategy", "technical analysis",
    "fundamental analysis", "support", "resistance"
  ]
};

/**
 * Detect relevant tools based on user prompt keywords
 * @param prompt - User's input prompt
 * @returns Array of relevant tool names
 */
export function detectRelevantTools(prompt: string): string[] {
  const relevant = new Set<string>();

  // Detect by Chinese keywords (no case conversion)
  for (const [toolName, keywords] of Object.entries(CHINESE_KEYWORDS)) {
    if (keywords.some(kw => prompt.includes(kw))) {
      relevant.add(toolName);
    }
  }

  // Detect by English keywords (lowercase comparison)
  const promptLower = prompt.toLowerCase();
  for (const [toolName, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    if (keywords.some(kw => promptLower.includes(kw.toLowerCase()))) {
      relevant.add(toolName);
    }
  }

  return Array.from(relevant);
}
