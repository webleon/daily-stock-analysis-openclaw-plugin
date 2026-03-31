/**
 * Error Handling
 * User-friendly error messages and error type detection
 */

export interface DSAError {
  error: string;
  details?: string;
  hint?: string;
  autoFix?: boolean;
  errorCode?: string;
}

/**
 * Error codes
 */
export const ERROR_CODES = {
  SERVICE_NOT_RUNNING: 'SERVICE_NOT_RUNNING',
  SERVICE_NOT_INSTALLED: 'SERVICE_NOT_INSTALLED',
  API_CONNECTION_FAILED: 'API_CONNECTION_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',
  INVALID_STOCK_CODE: 'INVALID_STOCK_CODE',
  API_ERROR: 'API_ERROR',
  PYTHON_NOT_FOUND: 'PYTHON_NOT_FOUND',
  DEPLOYMENT_FAILED: 'DEPLOYMENT_FAILED',
  UNKNOWN: 'UNKNOWN'
} as const;

/**
 * Create user-friendly error response
 */
export function createError(options: {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  autoFix?: boolean;
}): DSAError {
  return {
    error: options.message,
    details: options.details,
    hint: options.hint,
    errorCode: options.code,
    autoFix: options.autoFix || false
  };
}

/**
 * Detect error type from error message or code
 */
export function detectErrorType(error: any): string {
  const message = (error?.message || '').toLowerCase();
  const code = error?.code || '';
  
  // Connection errors
  if (message.includes('econnrefused') || message.includes('connect etimedout')) {
    return ERROR_CODES.API_CONNECTION_FAILED;
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_CODES.API_TIMEOUT;
  }
  
  // Service not running
  if (message.includes('service') && (message.includes('not running') || message.includes('unavailable'))) {
    return ERROR_CODES.SERVICE_NOT_RUNNING;
  }
  
  // Python not found
  if (message.includes('python') && (message.includes('not found') || code === 'ENOENT')) {
    return ERROR_CODES.PYTHON_NOT_FOUND;
  }
  
  // Stock code validation
  if (message.includes('stock code') || message.includes('invalid code')) {
    return ERROR_CODES.INVALID_STOCK_CODE;
  }
  
  return ERROR_CODES.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getFriendlyError(errorType: string, context?: any): DSAError {
  switch (errorType) {
    case ERROR_CODES.SERVICE_NOT_RUNNING:
      return createError({
        message: 'DSA 服务未运行',
        hint: '请运行 deploy_dsa(action="start") 启动服务',
        code: errorType,
        autoFix: true
      });
    
    case ERROR_CODES.SERVICE_NOT_INSTALLED:
      return createError({
        message: 'DSA 服务未安装',
        hint: '请运行 deploy_dsa(action="install") 安装服务',
        code: errorType,
        autoFix: true
      });
    
    case ERROR_CODES.API_CONNECTION_FAILED:
      return createError({
        message: '无法连接到 DSA 服务',
        details: context?.details,
        hint: '请检查服务是否启动：deploy_dsa(action="status")',
        code: errorType,
        autoFix: false
      });
    
    case ERROR_CODES.API_TIMEOUT:
      return createError({
        message: 'API 请求超时',
        details: '请求超过 30 秒未响应',
        hint: '请检查网络连接或服务负载，稍后重试',
        code: errorType,
        autoFix: false
      });
    
    case ERROR_CODES.INVALID_STOCK_CODE:
      return createError({
        message: '无效的股票代码',
        details: context?.code,
        hint: '格式示例：A 股 600519, 港股 hk00700, 美股 AAPL',
        code: errorType,
        autoFix: false
      });
    
    case ERROR_CODES.PYTHON_NOT_FOUND:
      return createError({
        message: '未找到 Python 3.10+',
        hint: '请安装 Python: https://www.python.org/downloads/',
        code: errorType,
        autoFix: false
      });
    
    case ERROR_CODES.DEPLOYMENT_FAILED:
      return createError({
        message: '部署失败',
        details: context?.details,
        hint: '请检查日志或重新运行 deploy_dsa(action="install")',
        code: errorType,
        autoFix: false
      });
    
    default:
      return createError({
        message: '操作失败',
        details: context?.details,
        hint: '如问题持续，请查看日志或提交 Issue',
        code: errorType || ERROR_CODES.UNKNOWN,
        autoFix: false
      });
  }
}

/**
 * Handle API errors with retry logic
 */
export async function handleApiError<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<T | DSAError> {
  const maxRetries = context.maxRetries || 1;
  const retryDelay = context.retryDelay || 1000;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const errorType = detectErrorType(error);
      
      // Don't retry for certain errors
      if ([
        ERROR_CODES.INVALID_STOCK_CODE,
        ERROR_CODES.PYTHON_NOT_FOUND,
        ERROR_CODES.SERVICE_NOT_INSTALLED
      ].includes(errorType)) {
        return getFriendlyError(errorType, { details: error.message });
      }
      
      // Retry for transient errors
      if (attempt <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Final attempt failed
      return getFriendlyError(errorType, { 
        details: error.message,
        attempt
      });
    }
  }
  
  return getFriendlyError(ERROR_CODES.UNKNOWN);
}

/**
 * Log error with appropriate level
 */
export function logError(
  logger: any,
  error: any,
  context: string
): void {
  const errorType = detectErrorType(error);
  
  logger.error(`[${context}] ${errorType}: ${error.message}`);
  
  if (error.stack) {
    logger.debug(`Stack: ${error.stack}`);
  }
}
