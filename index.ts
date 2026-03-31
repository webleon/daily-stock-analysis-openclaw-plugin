/**
 * Daily Stock Analysis OpenClaw Plugin
 * 
 * Bridge to Daily Stock Analysis (https://github.com/ZhuLinsen/daily_stock_analysis)
 * AI-powered stock analysis with Docker deployment
 * 
 * Features:
 * - Auto-detect stock-related tasks
 * - Docker deployment with one command
 * - Support A/H/US markets
 * - Decision dashboard with buy/sell points
 * - Agent-based strategy Q&A
 * 
 * @packageDocumentation
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { detectRelevantTools } from "./src/keywords.js";
import { DSAClient, DSAConfig } from "./src/api-client.js";

// ============================================================================
// Types
// ============================================================================

interface PluginConfig {
  enabled?: boolean;
  dsaBaseUrl?: string;
  autoDeploy?: boolean;
  dockerInstallDir?: string;
  autoDetectStock?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const PLUGIN_NAME = "Daily Stock Analysis OpenClaw Plugin";
const CACHE_DIR_NAME = ".dsa-cache";

const DEFAULT_CONFIG: PluginConfig = {
  enabled: true,
  dsaBaseUrl: "http://localhost:8000",
  autoDeploy: false,
  dockerInstallDir: "~/.openclaw/external-services/daily_stock_analysis",
  autoDetectStock: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getPluginDir(): string {
  return path.dirname(new URL(import.meta.url).pathname);
}

function getCacheDir(): string {
  const pluginDir = getPluginDir();
  return path.join(pluginDir, CACHE_DIR_NAME);
}

function ensureCacheDir(): string {
  const cacheDir = getCacheDir();
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function expandHome(dir: string): string {
  if (dir.startsWith('~')) {
    return path.join(process.env.HOME || '', dir.slice(1));
  }
  return dir;
}

function runCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

function checkDSAService(baseUrl: string): boolean {
  try {
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${baseUrl}/api/health`, {
      encoding: 'utf-8'
    });
    return response.trim() === '200';
  } catch {
    return false;
  }
}

// ============================================================================
// Tool Implementations
// ============================================================================

function createTools(config: PluginConfig) {
  const dsaConfig: DSAConfig = {
    baseUrl: config.dsaBaseUrl || DEFAULT_CONFIG.dsaBaseUrl!,
  };
  
  const client = new DSAClient(dsaConfig);

  return {
    /**
     * Analyze single stock
     */
    stock_analysis: async ({ code }: { code: string }) => {
      const serviceRunning = checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return {
          error: "DSA 服务未运行，请先部署服务",
          hint: "使用 deploy_dsa(action='install') 部署服务"
        };
      }

      try {
        const result = await client.analyzeStock(code);
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
      } catch (error: any) {
        return { error: error.message };
      }
    },

    /**
     * Batch analyze stocks
     */
    batch_analysis: async ({ codes }: { codes: string[] }) => {
      const serviceRunning = checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return {
          error: "DSA 服务未运行，请先部署服务",
          hint: "使用 deploy_dsa(action='install') 部署服务"
        };
      }

      try {
        const result = await client.batchAnalyze(codes);
        return result;
      } catch (error: any) {
        return { error: error.message };
      }
    },

    /**
     * Market review
     */
    market_review: async ({ market }: { market?: 'cn' | 'us' | 'both' }) => {
      const serviceRunning = checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return {
          error: "DSA 服务未运行",
          hint: "使用 deploy_dsa(action='install') 部署服务"
        };
      }

      try {
        const result = await client.marketReview(market || 'cn');
        return result;
      } catch (error: any) {
        return { error: error.message };
      }
    },

    /**
     * Ask stock with strategy
     */
    ask_stock: async ({ question, code }: { question: string; code?: string }) => {
      const serviceRunning = checkDSAService(dsaConfig.baseUrl);
      if (!serviceRunning) {
        return {
          error: "DSA 服务未运行",
          hint: "使用 deploy_dsa(action='install') 部署服务"
        };
      }

      try {
        const result = await client.askStock(question, code);
        return result;
      } catch (error: any) {
        return { error: error.message };
      }
    },

    /**
     * Deploy DSA service (Python, no Docker required)
     */
    deploy_dsa: async ({ action }: { action: string }) => {
      const installDir = expandHome(config.dockerInstallDir || DEFAULT_CONFIG.dockerInstallDir!);
      const venvDir = path.join(installDir, 'venv');
      const python = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'python.exe') : path.join(venvDir, 'bin', 'python');
      const pip = process.platform === 'win32' ? path.join(venvDir, 'Scripts', 'pip.exe') : path.join(venvDir, 'bin', 'pip');

      switch (action) {
        case 'install':
          try {
            // Check Python
            try {
              execSync('python3 --version', { stdio: 'pipe' });
            } catch {
              return { 
                error: 'Python 3.10+ not found',
                hint: 'Please install Python from https://www.python.org/downloads/'
              };
            }

            // Clone repository
            if (!fs.existsSync(installDir)) {
              console.log('📦 Cloning repository...');
              runCommand(`git clone https://github.com/ZhuLinsen/daily_stock_analysis.git ${installDir}`);
            }

            // Create virtual environment
            if (!fs.existsSync(venvDir)) {
              console.log('🐍 Creating virtual environment...');
              runCommand('python3 -m venv venv', installDir);
            }

            // Install dependencies
            console.log('📦 Installing dependencies (this may take a few minutes)...');
            runCommand(`${pip} install --upgrade pip`, installDir);
            runCommand(`${pip} install -r requirements.txt`, installDir);

            // Create .env from example
            const envExample = path.join(installDir, '.env.example');
            const envFile = path.join(installDir, '.env');
            if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
              fs.copyFileSync(envExample, envFile);
            }

            return {
              status: 'success',
              message: 'DSA 服务已安装（Python 模式）',
              nextSteps: [
                `1. 编辑 ${envFile} 配置：`,
                '   - STOCK_LIST=600519,hk00700,AAPL (你的股票代码)',
                '   - GEMINI_API_KEY=your_key (至少配置一个 AI API Key)',
                '2. 运行 deploy_dsa(action="start") 启动服务',
                '3. 访问 http://localhost:8000 使用 Web 界面'
              ],
              installDir: installDir,
              python: python
            };
          } catch (error: any) {
            return { error: error.message };
          }

        case 'start':
          try {
            if (!fs.existsSync(python)) {
              return {
                error: '虚拟环境未找到',
                hint: '请先运行 deploy_dsa(action="install") 安装服务'
              };
            }

            const running = checkDSAService(dsaConfig.baseUrl);
            if (running) {
              return {
                status: 'already_running',
                message: 'DSA 服务已在运行',
                url: dsaConfig.baseUrl
              };
            }

            console.log('🚀 Starting DSA service (Python)...');
            console.log('💡 服务将在后台运行，访问 http://localhost:8000');
            console.log('⚠️  按 Ctrl+C 可停止服务');
            
            // Start in background
            const { spawn } = await import('child_process');
            const child = spawn(python, ['main.py'], {
              cwd: installDir,
              stdio: 'inherit',
              detached: true
            });

            child.unref();

            setTimeout(() => {
              if (checkDSAService(dsaConfig.baseUrl)) {
                console.log('✅ 服务启动成功！');
                console.log('🌐 访问：http://localhost:8000');
              }
            }, 5000);

            return {
              status: 'starting',
              message: 'DSA 服务启动中...',
              url: 'http://localhost:8000',
              pid: child.pid
            };
          } catch (error: any) {
            return { error: error.message };
          }

        case 'stop':
          try {
            // Find and kill python process
            if (process.platform === 'win32') {
              runCommand('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *daily_stock_analysis*"');
            } else {
              runCommand("pkill -f 'python.*main.py'");
            }
            return {
              status: 'success',
              message: 'DSA 服务已停止'
            };
          } catch (error: any) {
            return { error: error.message };
          }

        case 'status':
          try {
            const running = checkDSAService(dsaConfig.baseUrl);
            const venvExists = fs.existsSync(venvDir);
            const envExists = fs.existsSync(path.join(installDir, '.env'));
            
            return {
              status: running ? 'running' : 'stopped',
              apiHealth: running ? 'healthy' : 'unhealthy',
              installed: venvExists,
              configured: envExists,
              installDir: installDir,
              url: dsaConfig.baseUrl
            };
          } catch (error: any) {
            return { error: error.message };
          }

        case 'uninstall':
          try {
            // Stop service first
            try {
              if (process.platform === 'win32') {
                runCommand('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *daily_stock_analysis*"');
              } else {
                runCommand("pkill -f 'python.*main.py'");
              }
            } catch {}
            
            fs.rmSync(installDir, { recursive: true, force: true });
            return {
              status: 'success',
              message: 'DSA 服务已卸载'
            };
          } catch (error: any) {
            return { error: error.message };
          }

        default:
          return { error: `Unknown action: ${action}` };
      }
    },

    /**
     * Check plugin version and service status
     */
    dsa_version: async () => {
      const serviceRunning = checkDSAService(dsaConfig.baseUrl);
      let serviceVersion = 'unknown';
      
      if (serviceRunning) {
        try {
          const health = await client.healthCheck();
          serviceVersion = health.version || 'running';
        } catch {
          serviceVersion = 'running';
        }
      }

      return {
        plugin: '1.0.0',
        service: serviceVersion,
        serviceStatus: serviceRunning ? 'running' : 'stopped',
        serviceUrl: dsaConfig.baseUrl
      };
    }
  };
}

// ============================================================================
// Plugin Entry
// ============================================================================

export default definePluginEntry((api: OpenClawPluginApi) => {
  const config: PluginConfig = { ...DEFAULT_CONFIG, ...api.pluginConfig };
  
  if (!config.enabled) {
    api.logger.info(`${PLUGIN_NAME} is disabled`);
    return;
  }

  const tools = createTools(config);

  // Register tools
  api.registerTool('stock_analysis', tools.stock_analysis, {
    description: '分析单只股票，返回 AI 决策仪表盘',
    parameters: Type.Object({
      code: Type.String({ description: '股票代码，如 600519, AAPL' })
    })
  });

  api.registerTool('batch_analysis', tools.batch_analysis, {
    description: '批量分析多只股票',
    parameters: Type.Object({
      codes: Type.Array(Type.String(), { description: '股票代码列表' })
    })
  });

  api.registerTool('market_review', tools.market_review, {
    description: '大盘复盘，查看市场概览',
    parameters: Type.Object({
      market: Type.Optional(Type.Union([
        Type.Literal('cn'),
        Type.Literal('us'),
        Type.Literal('both')
      ], { description: '市场：cn(A 股), us(美股), both(两者)' }))
    })
  });

  api.registerTool('ask_stock', tools.ask_stock, {
    description: 'Agent 策略问股，多轮对话分析',
    parameters: Type.Object({
      question: Type.String({ description: '问题，如"用缠论分析 600519"' }),
      code: Type.Optional(Type.String({ description: '股票代码' }))
    })
  });

  api.registerTool('deploy_dsa', tools.deploy_dsa, {
    description: '部署 Daily Stock Analysis 服务（Docker）',
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal('install'),
        Type.Literal('start'),
        Type.Literal('stop'),
        Type.Literal('status'),
        Type.Literal('uninstall')
      ], { description: '操作类型' })
    })
  });

  api.registerTool('dsa_version', tools.dsa_version, {
    description: '检查插件版本和服务状态',
    parameters: Type.Object({})
  });

  api.logger.info(`${PLUGIN_NAME} loaded with ${Object.keys(tools).length} tools`);

  // Auto-detection hook (optional)
  if (config.autoDetectStock) {
    api.onMessage(async (message) => {
      const prompt = message.content;
      const relevantTools = detectRelevantTools(prompt);
      
      if (relevantTools.length > 0) {
        api.logger.debug(`Detected stock-related tools: ${relevantTools.join(', ')}`);
        // Note: Auto-loading would require additional OpenClaw API support
      }
    });
  }
});
