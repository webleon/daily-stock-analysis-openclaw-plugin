/**
 * 关键词定义 - 严格模式
 * 只有明确提及 DSA 时才触发 DSA 工具
 */

// DSA 触发前缀（必须包含这些词之一）
const DSA_TRIGGER_PREFIXES = [
  'dsa',
  'daily stock',
  '股票分析',
  '股票插件',
  '用插件'
];

// DSA 工具关键词（在前缀之后需要包含的词）
const DSA_TOOL_KEYWORDS: Record<string, string[]> = {
  "stock_analysis": [
    "分析", "走势", "行情", "买点", "卖点",
    "茅台", "腾讯", "苹果", "宁德", "股票", "股"
  ],
  "batch_analysis": [
    "批量", "持仓", "多只", "组合"
  ],
  "market_review": [
    "大盘", "复盘", "市场", "板块", "行情"
  ],
  "ask_stock": [
    "问股", "缠论", "均线", "波浪", "策略"
  ]
};

/**
 * Check if prompt explicitly mentions DSA
 */
function mentionsDSA(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return DSA_TRIGGER_PREFIXES.some(prefix => 
    lower.includes(prefix.toLowerCase())
  );
}

/**
 * Detect relevant tools (strict mode)
 * Only triggers DSA tools if user explicitly mentions DSA
 */
export function detectRelevantTools(prompt: string): string[] {
  const relevant = new Set<string>();
  
  // Check if user explicitly mentioned DSA
  const isDSAContext = mentionsDSA(prompt);
  
  // If not DSA context, don't trigger any DSA tools
  if (!isDSAContext) {
    return [];
  }
  
  // DSA context detected, match specific tools
  const promptLower = prompt.toLowerCase();
  
  for (const [toolName, keywords] of Object.entries(DSA_TOOL_KEYWORDS)) {
    if (keywords.some(kw => promptLower.includes(kw.toLowerCase()))) {
      relevant.add(toolName);
    }
  }
  
  return Array.from(relevant);
}

/**
 * Get detection explanation (for debugging)
 */
export function getDetectionExplanation(prompt: string): string {
  const isDSA = mentionsDSA(prompt);
  const tools = detectRelevantTools(prompt);
  
  if (!isDSA) {
    return '未提及 DSA，不触发 DSA 工具';
  }
  
  if (tools.length === 0) {
    return '提及 DSA 但未匹配到具体工具';
  }
  
  return `触发工具：${tools.join(', ')}`;
}
