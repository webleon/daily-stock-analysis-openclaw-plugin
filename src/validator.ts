/**
 * Stock Code Validator
 * Validates stock codes for A-shares, HK stocks, and US stocks
 */

export interface StockCodeInfo {
  code: string;
  market: 'A' | 'HK' | 'US' | 'UNKNOWN';
  isValid: boolean;
  formattedCode: string;
}

/**
 * Stock market patterns
 */
const STOCK_PATTERNS = {
  // A-shares: 6 digits (600519, 000001, 300750)
  A_SHARE: /^\d{6}$/,
  
  // HK stocks: hk + 4-5 digits (hk00700, hk09988)
  HK_STOCK: /^hk\d{4,5}$/i,
  
  // US stocks: 1-5 letters (AAPL, TSLA, BRK.B)
  US_STOCK: /^[A-Z]{1,5}(\.[A-Z])?$/i
} as const;

/**
 * Validate stock code format
 */
export function isValidStockCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  const trimmed = code.trim();
  
  return (
    STOCK_PATTERNS.A_SHARE.test(trimmed) ||
    STOCK_PATTERNS.HK_STOCK.test(trimmed) ||
    STOCK_PATTERNS.US_STOCK.test(trimmed)
  );
}

/**
 * Get stock market type
 */
export function getStockMarket(code: string): 'A' | 'HK' | 'US' | 'UNKNOWN' {
  if (!code) return 'UNKNOWN';
  
  const trimmed = code.trim();
  
  if (STOCK_PATTERNS.A_SHARE.test(trimmed)) {
    return 'A';
  }
  
  if (STOCK_PATTERNS.HK_STOCK.test(trimmed)) {
    return 'HK';
  }
  
  if (STOCK_PATTERNS.US_STOCK.test(trimmed)) {
    return 'US';
  }
  
  return 'UNKNOWN';
}

/**
 * Format stock code for API
 */
export function formatStockCode(code: string): string {
  if (!code) return code;
  
  const trimmed = code.trim().toUpperCase();
  
  // HK stocks: ensure 'hk' prefix
  if (STOCK_PATTERNS.HK_STOCK.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  // A-shares and US stocks: uppercase
  return trimmed;
}

/**
 * Parse and validate stock code
 */
export function parseStockCode(code: string): StockCodeInfo {
  const trimmed = code.trim();
  const market = getStockMarket(trimmed);
  const isValid = market !== 'UNKNOWN';
  
  return {
    code: trimmed,
    market,
    isValid,
    formattedCode: isValid ? formatStockCode(trimmed) : trimmed
  };
}

/**
 * Validate multiple stock codes
 */
export function validateStockCodes(codes: string[]): { 
  valid: string[]; 
  invalid: Array<{ code: string; reason: string }> 
} {
  const valid: string[] = [];
  const invalid: Array<{ code: string; reason: string }> = [];
  
  for (const code of codes) {
    const info = parseStockCode(code);
    
    if (info.isValid) {
      valid.push(info.formattedCode);
    } else {
      invalid.push({
        code,
        reason: getValidationErrorMessage(code)
      });
    }
  }
  
  return { valid, invalid };
}

/**
 * Get validation error message
 */
function getValidationErrorMessage(code: string): string {
  if (!code || code.trim().length === 0) {
    return '股票代码不能为空';
  }
  
  const trimmed = code.trim();
  
  if (STOCK_PATTERNS.A_SHARE.test(trimmed)) {
    return 'A 股代码格式正确';
  }
  
  if (STOCK_PATTERNS.HK_STOCK.test(trimmed)) {
    return '港股代码格式正确';
  }
  
  if (STOCK_PATTERNS.US_STOCK.test(trimmed)) {
    return '美股代码格式正确';
  }
  
  // Unknown format
  if (/^\d+$/.test(trimmed)) {
    return 'A 股代码应为 6 位数字（如 600519）';
  }
  
  if (/^hk\d+$/i.test(trimmed)) {
    return '港股代码应为 hk + 4-5 位数字（如 hk00700）';
  }
  
  return '无效的股票代码格式。示例：A 股 600519, 港股 hk00700, 美股 AAPL';
}

/**
 * Get stock code examples
 */
export function getStockCodeExamples(market?: 'A' | 'HK' | 'US'): string[] {
  const examples = {
    A: ['600519', '000001', '300750', '601318'],
    HK: ['hk00700', 'hk09988', 'hk01810', 'hk02318'],
    US: ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'BRK.B']
  };
  
  if (market) {
    return examples[market];
  }
  
  return [...examples.A, ...examples.HK, ...examples.US];
}
