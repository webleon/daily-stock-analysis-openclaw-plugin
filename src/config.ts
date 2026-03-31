/**
 * Plugin Configuration
 * Centralized configuration management
 */

export const CONFIG = {
  // Plugin metadata
  PLUGIN_NAME: 'Daily Stock Analysis OpenClaw Plugin',
  VERSION: '1.0.0',
  
  // DSA Service defaults
  DEFAULT_PORT: 8009,
  DEFAULT_BASE_URL: 'http://localhost:8009',
  INSTALL_DIR: '~/.openclaw/external-services/daily_stock_analysis',
  
  // Timeouts (milliseconds)
  API_TIMEOUT: 30000,        // 30 seconds
  SERVICE_START_TIMEOUT: 10000, // 10 seconds wait for service start
  
  // Validation
  MIN_PORT: 1024,
  MAX_PORT: 65535,
  
  // Paths
  CACHE_DIR_NAME: '.dsa-cache',
  VENV_DIR: 'venv',
  
  // Keywords
  KEYWORD_THRESHOLD: 0.7,
  
  // Logging
  LOG_LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  }
} as const;

export type Config = typeof CONFIG;

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  enabled?: boolean;
  dsaBaseUrl?: string;
  dsaPort?: number;
  autoDeploy?: boolean;
  installDir?: string;
  autoDetectStock?: boolean;
  apiTimeout?: number;
  logLevel?: string;
}

/**
 * Default plugin configuration
 */
export const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  dsaBaseUrl: CONFIG.DEFAULT_BASE_URL,
  dsaPort: CONFIG.DEFAULT_PORT,
  autoDeploy: false,
  installDir: CONFIG.INSTALL_DIR,
  autoDetectStock: true,
  apiTimeout: CONFIG.API_TIMEOUT,
  logLevel: CONFIG.LOG_LEVELS.INFO
};

/**
 * Validate plugin configuration
 */
export function validateConfig(config: PluginConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.dsaPort !== undefined) {
    if (config.dsaPort < CONFIG.MIN_PORT || config.dsaPort > CONFIG.MAX_PORT) {
      errors.push(`Port must be between ${CONFIG.MIN_PORT} and ${CONFIG.MAX_PORT}`);
    }
  }
  
  if (config.dsaBaseUrl !== undefined) {
    try {
      new URL(config.dsaBaseUrl);
    } catch {
      errors.push('Invalid base URL format');
    }
  }
  
  if (config.apiTimeout !== undefined && (config.apiTimeout < 1000 || config.apiTimeout > 300000)) {
    errors.push('API timeout must be between 1000ms and 300000ms');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: PluginConfig): PluginConfig {
  const merged = { ...DEFAULT_CONFIG, ...userConfig };
  
  // Ensure base URL matches port
  if (merged.dsaPort && !merged.dsaBaseUrl) {
    merged.dsaBaseUrl = `http://localhost:${merged.dsaPort}`;
  }
  
  return merged;
}
