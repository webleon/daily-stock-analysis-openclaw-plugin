/**
 * 关键词定义 - 用于股票相关任务检测
 * With weighted detection to reduce false positives
 */

import { CONFIG } from './config.js';

/** Chinese keywords with weights for stock-related task detection */
export const CHINESE_KEYWORDS: Record<string, Array<{ keyword: string; weight: number }>> = {
  "stock_analysis": [
    { keyword: "分析股票", weight: 1.0 },
    { keyword: "股票分析", weight: 1.0 },
    { keyword: "买点", weight: 0.9 },
    { keyword: "卖点", weight: 0.9 },
    { keyword: "目标价", weight: 0.9 },
    { keyword: "止损价", weight: 0.9 },
    { keyword: "这只股票", weight: 0.8 },
    { keyword: "个股分析", weight: 0.9 },
    { keyword: "能买吗", weight: 0.8 },
    { keyword: "能卖吗", weight: 0.8 },
    { keyword: "如何操作", weight: 0.7 },
    { keyword: "分析一下", weight: 0.5 }
  ],
  "batch_analysis": [
    { keyword: "批量分析", weight: 1.0 },
    { keyword: "多只股票", weight: 0.9 },
    { keyword: "持仓分析", weight: 0.9 },
    { keyword: "分析我的股票", weight: 0.8 },
    { keyword: "这些股", weight: 0.6 }
  ],
  "market_review": [
    { keyword: "大盘", weight: 1.0 },
    { keyword: "复盘", weight: 0.9 },
    { keyword: "市场概览", weight: 0.9 },
    { keyword: "上证指数", weight: 0.9 },
    { keyword: "创业板", weight: 0.8 },
    { keyword: "板块", weight: 0.7 },
    { keyword: "行情", weight: 0.6 }
  ],
  "ask_stock": [
    { keyword: "问股", weight: 1.0 },
    { keyword: "缠论", weight: 0.9 },
    { keyword: "均线", weight: 0.8 },
    { keyword: "波浪", weight: 0.8 },
    { keyword: "技术面", weight: 0.8 },
    { keyword: "基本面", weight: 0.8 },
    { keyword: "金叉", weight: 0.7 },
    { keyword: "死叉", weight: 0.7 },
    { keyword: "支撑位", weight: 0.7 },
    { keyword: "压力位", weight: 0.7 }
  ]
};

/** English keywords with weights for stock-related task detection */
export const ENGLISH_KEYWORDS: Record<string, Array<{ keyword: string; weight: number }>> = {
  "stock_analysis": [
    { keyword: "analyze stock", weight: 1.0 },
    { keyword: "stock analysis", weight: 1.0 },
    { keyword: "buy point", weight: 0.9 },
    { keyword: "sell point", weight: 0.9 },
    { keyword: "target price", weight: 0.9 },
    { keyword: "stop loss", weight: 0.9 },
    { keyword: "should i buy", weight: 0.8 },
    { keyword: "this stock", weight: 0.6 }
  ],
  "batch_analysis": [
    { keyword: "batch analyze", weight: 1.0 },
    { keyword: "portfolio analysis", weight: 0.9 },
    { keyword: "my stocks", weight: 0.7 }
  ],
  "market_review": [
    { keyword: "market review", weight: 1.0 },
    { keyword: "market overview", weight: 0.9 },
    { keyword: "shanghai composite", weight: 0.9 },
    { keyword: "nasdaq", weight: 0.8 },
    { keyword: "sector", weight: 0.7 }
  ],
  "ask_stock": [
    { keyword: "ask stock", weight: 1.0 },
    { keyword: "strategy", weight: 0.7 },
    { keyword: "technical analysis", weight: 0.8 },
    { keyword: "fundamental analysis", weight: 0.8 },
    { keyword: "support", weight: 0.7 },
    { keyword: "resistance", weight: 0.7 }
  ]
};

/**
 * Detect relevant tools based on user prompt keywords with weighted scoring
 * @param prompt - User's input prompt
 * @returns Array of relevant tool names (only those above threshold)
 */
export function detectRelevantTools(prompt: string): string[] {
  const scores: Map<string, number> = new Map();
  const threshold = CONFIG.KEYWORD_THRESHOLD;

  // Detect by Chinese keywords (no case conversion)
  for (const [toolName, keywords] of Object.entries(CHINESE_KEYWORDS)) {
    let score = 0;
    for (const { keyword, weight } of keywords) {
      if (prompt.includes(keyword)) {
        score += weight;
      }
    }
    if (score > 0) {
      scores.set(toolName, score);
    }
  }

  // Detect by English keywords (lowercase comparison)
  const promptLower = prompt.toLowerCase();
  for (const [toolName, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    let score = 0;
    for (const { keyword, weight } of keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    const existingScore = scores.get(toolName) || 0;
    if (score > 0) {
      scores.set(toolName, existingScore + score);
    }
  }

  const relevant = Array.from(scores.entries())
    .filter(([_, score]) => score >= threshold)
    .map(([toolName, _]) => toolName);

  return relevant;
}

/**
 * Get detection score for debugging
 */
export function getDetectionScores(prompt: string): Record<string, number> {
  const scores: Record<string, number> = {};
  
  for (const [toolName, keywords] of Object.entries(CHINESE_KEYWORDS)) {
    let score = 0;
    for (const { keyword, weight } of keywords) {
      if (prompt.includes(keyword)) {
        score += weight;
      }
    }
    if (score > 0) scores[toolName] = score;
  }
  
  const promptLower = prompt.toLowerCase();
  for (const [toolName, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    let score = 0;
    for (const { keyword, weight } of keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }
    if (score > 0) {
      scores[toolName] = (scores[toolName] || 0) + score;
    }
  }
  
  return scores;
}
