/**
 * Daily Stock Analysis OpenClaw Plugin
 * 
 * Bridge to Daily Stock Analysis (https://github.com/ZhuLinsen/daily_stock_analysis)
 * AI-powered stock analysis with Python deployment
 * 
 * Features:
 * - Auto-detect stock-related tasks with weighted keywords
 * - Python deployment with virtual environment (no Docker)
 * - Support A/H/US markets with validation
 * - Decision dashboard with buy/sell points
 * - Agent-based strategy Q&A
 * - Comprehensive error handling with user-friendly messages
 * 
 * @packageDocumentation
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG, mergeConfig, validateConfig, type PluginConfig } from "./src/config.js";
import { detectRelevantTools, getDetectionScores } from "./src/keywords.js";
import { DSAClient, type DSAConfig } from "./src/api-client.js";
import { parseStockCode, validateStockCodes, isValidStockCode } from "./src/validator.js";
import { createError, getFriendlyError, detectErrorType, ERROR_CODES, handleApiError, logError } from "./src/errors.js";
import * as deploy from "./src/deploy.js";

// ============================================================================
// Tool Implementations
// ============================================================================

function createTools(api: OpenClawPluginApi, config: PluginConfig) {
  const dsaConfig: DSAConfig = {
    baseUrl: config.dsaBaseUrl || CONFIG.DEFAULT_BASE_URL,
    timeout: config.apiTimeout || CONFIG.API_TIMEOUT
  };
  
  const client = new DSAClient(dsaConfig);
  const installDir = path.expandHome?.(config.installDir || CONFIG.INSTALL_DIR) || 
                     path.join(process.env.HOME || '', config.installDir?.slice(1) || CONFIG.INSTALL_DIR.slice(1));

  return {
    /**
     * Analyze single stock with validation
     */
    stock_analysis: async ({ code }: { code: string }) => {
      // Validate stock code
      const stockInfo = parseStockCode(code);
      if (!stockInfo.isValid) {
        return getFriendlyError(ERROR_CODES.INVALID_STOCK_CODE, {
          code,
          details: `支持格式：A 股 600519, 港股 hk00700, 美股 AAPL`
        });
      }

      const serviceRunning = deploy.checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return getFriendlyError(ERROR_CODES.SERVICE_NOT_RUNNING, {
          hint: '使用 deploy_dsa(action="start") 启动服务'
        });
      }

      return handleApiError(
        async () => {
          const result = await client.analyzeStock(stockInfo.formattedCode);
          return {
            code: result.code,
            name: result.name,
            conclusion: result.conclusion,
            buyPrice: result.buyPrice,
            stopLossPrice: result.stopLossPrice,
            targetPrice: result.targetPrice,
            checklist: result.checklist,
            riskAlerts: result.riskAlerts,
            opportunities: result.opportunities
          };
        },
        { operationName: 'stock_analysis' }
      );
    },

    /**
     * Batch analyze stocks with validation
     */
    batch_analysis: async ({ codes }: { codes: string[] }) => {
      // Validate all codes
      const validation = validateStockCodes(codes);
      
      if (validation.invalid.length > 0) {
        return {
          error: '部分股票代码格式错误',
          invalid: validation.invalid,
          valid: validation.valid,
          hint: '格式示例：A 股 600519, 港股 hk00700, 美股 AAPL'
        };
      }

      const serviceRunning = deploy.checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return getFriendlyError(ERROR_CODES.SERVICE_NOT_RUNNING);
      }

      return handleApiError(
        async () => await client.batchAnalyze(validation.valid),
        { operationName: 'batch_analysis' }
      );
    },

    /**
     * Market review
     */
    market_review: async ({ market }: { market?: 'cn' | 'us' | 'both' }) => {
      const serviceRunning = deploy.checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return getFriendlyError(ERROR_CODES.SERVICE_NOT_RUNNING);
      }

      return handleApiError(
        async () => await client.marketReview(market || 'cn'),
        { operationName: 'market_review' }
      );
    },

    /**
     * Ask stock with strategy
     */
    ask_stock: async ({ question, code }: { question: string; code?: string }) => {
      // Validate code if provided
      if (code) {
        const stockInfo = parseStockCode(code);
        if (!stockInfo.isValid) {
          return getFriendlyError(ERROR_CODES.INVALID_STOCK_CODE, { code });
        }
        code = stockInfo.formattedCode;
      }

      const serviceRunning = deploy.checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return getFriendlyError(ERROR_CODES.SERVICE_NOT_RUNNING);
      }

      return handleApiError(
        async () => await client.askStock(question, code),
        { operationName: 'ask_stock' }
      );
    },

    /**
     * Deploy DSA service (uses split functions from deploy module)
     */
    deploy_dsa: async ({ action }: { action: string }) => {
      switch (action) {
        case 'install':
          api.logger.info('Installing DSA service...');
          return deploy.installDSA(api, config);
        
        case 'start':
          api.logger.info('Starting DSA service...');
          return deploy.startDSA(api, config);
        
        case 'stop':
          api.logger.info('Stopping DSA service...');
          return deploy.stopDSA(api);
        
        case 'status':
          return deploy.statusDSA(api, config);
        
        case 'uninstall':
          api.logger.info('Uninstalling DSA service...');
          return deploy.uninstallDSA(api, config);
        
        default:
          return createError({
            message: `未知操作：${action}`,
            code: ERROR_CODES.UNKNOWN
          });
      }
    },

    /**
     * Check plugin version and service status
     */
    dsa_version: async () => {
      const serviceRunning = deploy.checkDSAService(dsaConfig.baseUrl);
      let serviceVersion = 'unknown';
      
      if (serviceRunning) {
        const result = await handleApiError(
          async () => await client.healthCheck(),
          { operationName: 'healthCheck' }
        );
        
        if ('status' in result) {
          serviceVersion = result.version || 'running';
        }
      }

      const venvDir = path.join(installDir, CONFIG.VENV_DIR);
      
      return {
        plugin: CONFIG.VERSION,
        service: serviceVersion,
        serviceStatus: serviceRunning ? 'running' : 'stopped',
        serviceUrl: dsaConfig.baseUrl,
        port: config.dsaPort || CONFIG.DEFAULT_PORT,
        virtualEnv: fs.existsSync(venvDir)
      };
    }
  };
}

// ============================================================================
// Plugin Entry
// ============================================================================

export default definePluginEntry((api: OpenClawPluginApi) => {
  const userConfig = api.pluginConfig || {};
  const config = mergeConfig(userConfig);
  
  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    api.logger.error(`Invalid configuration: ${validation.errors.join(', ')}`);
    return;
  }
  
  if (!config.enabled) {
    api.logger.info(`${CONFIG.PLUGIN_NAME} is disabled`);
    return;
  }

  const tools = createTools(api, config);

  // Register tools with descriptions
  api.registerTool('stock_analysis', tools.stock_analysis, {
    description: '分析单只股票，返回 AI 决策仪表盘（买卖点位 + 检查清单）',
    parameters: Type.Object({
      code: Type.String({ 
        description: '股票代码，如 600519 (A 股), hk00700 (港股), AAPL (美股)',
        minLength: 4,
        maxLength: 10
      })
    })
  });

  api.registerTool('batch_analysis', tools.batch_analysis, {
    description: '批量分析多只股票',
    parameters: Type.Object({
      codes: Type.Array(
        Type.String({ 
          description: '股票代码',
          minLength: 4,
          maxLength: 10
        }),
        { 
          description: '股票代码列表，如 ["600519", "hk00700", "AAPL"]',
          minItems: 1,
          maxItems: 20
        }
      )
    })
  });

  api.registerTool('market_review', tools.market_review, {
    description: '大盘复盘，查看市场概览和板块涨跌',
    parameters: Type.Object({
      market: Type.Optional(Type.Union([
        Type.Literal('cn', { description: 'A 股市场' }),
        Type.Literal('us', { description: '美股市场' }),
        Type.Literal('both', { description: 'A 股 + 美股' })
      ]))
    })
  });

  api.registerTool('ask_stock', tools.ask_stock, {
    description: 'Agent 策略问股，多轮对话分析（支持缠论/均线/波浪等 11 种策略）',
    parameters: Type.Object({
      question: Type.String({ 
        description: '问题，如"用缠论分析 600519"',
        minLength: 1,
        maxLength: 1000
      }),
      code: Type.Optional(Type.String({ 
        description: '股票代码（可选）',
        minLength: 4,
        maxLength: 10
      }))
    })
  });

  api.registerTool('deploy_dsa', tools.deploy_dsa, {
    description: '部署 Daily Stock Analysis 服务（Python 虚拟环境，开箱即用）',
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal('install', { description: '安装服务' }),
        Type.Literal('start', { description: '启动服务' }),
        Type.Literal('stop', { description: '停止服务' }),
        Type.Literal('status', { description: '查看状态' }),
        Type.Literal('uninstall', { description: '卸载服务' })
      ])
    })
  });

  api.registerTool('dsa_version', tools.dsa_version, {
    description: '检查插件版本和服务状态',
    parameters: Type.Object({})
  });

  // Log startup info with appropriate levels
  api.logger.info(`${CONFIG.PLUGIN_NAME} v${CONFIG.VERSION} loaded`);
  api.logger.info(`Port: ${config.dsaPort || CONFIG.DEFAULT_PORT}`);
  api.logger.info(`Auto-detect: ${config.autoDetectStock ? 'Enabled' : 'Disabled'}`);
  api.logger.info(`Virtual Env Auto-Install: Enabled`);

  // Auto-detection hook with weighted keywords
  if (config.autoDetectStock) {
    api.onMessage(async (message) => {
      const prompt = message.content;
      const relevantTools = detectRelevantTools(prompt);
      
      if (relevantTools.length > 0) {
        const scores = getDetectionScores(prompt);
        api.logger.debug(`Detected stock tools: ${relevantTools.join(', ')}`);
        api.logger.debug(`Detection scores: ${JSON.stringify(scores)}`);
      }
    });
  }
});
