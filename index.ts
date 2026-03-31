/**
 * Daily Stock Analysis OpenClaw Plugin
 * Simple bridge to Daily Stock Analysis service
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawn } from "node:child_process";
import { detectRelevantTools } from "./src/keywords.js";
import { DSAClient } from "./src/api-client.js";

const PORT = 8009;
const BASE_URL = `http://localhost:${PORT}`;
const INSTALL_DIR = path.join(process.env.HOME || '', '.openclaw/external-services/daily_stock_analysis');

export default definePluginEntry((api) => {
  const client = new DSAClient({ baseUrl: BASE_URL });

  // Check if DSA service is running
  function checkService(): boolean {
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/health`);
      return response.toString().trim() === '200';
    } catch {
      return false;
    }
  }

  // Simple deploy function
  function deploy(action: string): any {
    switch (action) {
      case 'install':
        try {
          if (!fs.existsSync(INSTALL_DIR)) {
            execSync(`git clone https://github.com/ZhuLinsen/daily_stock_analysis.git ${INSTALL_DIR}`);
          }
          execSync('python3 -m venv venv', { cwd: INSTALL_DIR });
          execSync('venv/bin/pip install -r requirements.txt', { cwd: INSTALL_DIR });
          if (!fs.existsSync(path.join(INSTALL_DIR, '.env'))) {
            fs.copyFileSync(
              path.join(INSTALL_DIR, '.env.example'),
              path.join(INSTALL_DIR, '.env')
            );
          }
          return { status: 'success', message: '已安装', hint: '编辑 .env 配置后运行 deploy_dsa(action="start")' };
        } catch (error: any) {
          return { error: error.message };
        }

      case 'start':
        try {
          if (!fs.existsSync(path.join(INSTALL_DIR, 'venv'))) {
            return { error: '未安装', hint: '请先运行 deploy_dsa(action="install")' };
          }
          spawn(path.join(INSTALL_DIR, 'venv/bin/python'), ['main.py'], {
            cwd: INSTALL_DIR,
            detached: true,
            stdio: 'ignore'
          }).unref();
          return { status: 'starting', message: '服务启动中...', url: BASE_URL };
        } catch (error: any) {
          return { error: error.message };
        }

      case 'stop':
        try {
          execSync("pkill -f 'python.*main.py'");
          return { status: 'success', message: '已停止' };
        } catch {
          return { error: '停止失败' };
        }

      case 'status':
        const running = checkService();
        return {
          status: running ? 'running' : 'stopped',
          url: BASE_URL,
          port: PORT
        };

      case 'uninstall':
        try {
          execSync("pkill -f 'python.*main.py'");
          fs.rmSync(INSTALL_DIR, { recursive: true });
          return { status: 'success', message: '已卸载' };
        } catch (error: any) {
          return { error: error.message };
        }

      default:
        return { error: `未知操作：${action}` };
    }
  }

  // Register tools
  api.registerTool('stock_analysis', async ({ code }) => {
    if (!checkService()) {
      return { error: '服务未运行', hint: 'deploy_dsa(action="start")' };
    }
    try {
      return await client.analyzeStock(code);
    } catch (error: any) {
      return { error: error.message };
    }
  }, {
    description: '分析单只股票',
    parameters: Type.Object({
      code: Type.String({ description: '股票代码，如 600519, AAPL' })
    })
  });

  api.registerTool('batch_analysis', async ({ codes }) => {
    if (!checkService()) {
      return { error: '服务未运行' };
    }
    try {
      return await client.batchAnalyze(codes);
    } catch (error: any) {
      return { error: error.message };
    }
  }, {
    description: '批量分析多只股票',
    parameters: Type.Object({
      codes: Type.Array(Type.String())
    })
  });

  api.registerTool('market_review', async ({ market }) => {
    if (!checkService()) {
      return { error: '服务未运行' };
    }
    try {
      return await client.marketReview(market || 'cn');
    } catch (error: any) {
      return { error: error.message };
    }
  }, {
    description: '大盘复盘',
    parameters: Type.Object({
      market: Type.Optional(Type.Union([Type.Literal('cn'), Type.Literal('us'), Type.Literal('both')]))
    })
  });

  api.registerTool('ask_stock', async ({ question, code }) => {
    if (!checkService()) {
      return { error: '服务未运行' };
    }
    try {
      return await client.askStock(question, code);
    } catch (error: any) {
      return { error: error.message };
    }
  }, {
    description: 'Agent 策略问股',
    parameters: Type.Object({
      question: Type.String(),
      code: Type.Optional(Type.String())
    })
  });

  api.registerTool('deploy_dsa', async ({ action }) => {
    return deploy(action);
  }, {
    description: '部署 DSA 服务',
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal('install'),
        Type.Literal('start'),
        Type.Literal('stop'),
        Type.Literal('status'),
        Type.Literal('uninstall')
      ])
    })
  });

  api.registerTool('dsa_version', async () => {
    return {
      plugin: '1.0.0',
      service: checkService() ? 'running' : 'stopped',
      port: PORT
    };
  }, {
    description: '检查版本',
    parameters: Type.Object({})
  });

  api.logger.info(`DSA Plugin loaded - Port: ${PORT}`);

  // Auto-detect
  api.onMessage(async (message) => {
    const tools = detectRelevantTools(message.content);
    if (tools.length > 0) {
      api.logger.debug(`Detected: ${tools.join(', ')}`);
    }
  });
});
