/**
 * Daily Stock Analysis OpenClaw Plugin
 * Simple bridge to DSA service
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawn } from "node:child_process";
import { detectRelevantTools } from "./src/keywords-strict.js";
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

  // Check installation status
  function checkInstallation(): { installed: boolean; message: string } {
    const venvPath = path.join(INSTALL_DIR, 'venv');
    const venvExists = fs.existsSync(venvPath);
    
    if (!venvExists) {
      return { installed: false, message: '虚拟环境未创建' };
    }
    
    const pythonPath = process.platform === 'win32'
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    
    if (!fs.existsSync(pythonPath)) {
      return { installed: false, message: 'Python 未找到' };
    }
    
    try {
      execSync(`${pythonPath} -c "import fastapi, uvicorn"`, {
        cwd: INSTALL_DIR,
        stdio: 'pipe'
      });
      return { installed: true, message: '已安装' };
    } catch {
      return { installed: false, message: '依赖未安装' };
    }
  }

  // Deploy commands
  function deploy(action: string): any {
    switch (action) {
      case 'install':
        const installStatus = checkInstallation();
        if (installStatus.installed) {
          return { status: 'already_installed', message: 'DSA 服务已安装' };
        }
        
        return {
          status: 'manual_required',
          message: '请运行安装脚本',
          hint: `
📦 DSA 服务需要手动安装

选项 1: 使用安装脚本（推荐）
  bash scripts/install.sh        # macOS/Linux
  powershell scripts/install.ps1 # Windows

选项 2: 手动安装
  1. cd ~/.openclaw/external-services/daily_stock_analysis
  2. python3 -m venv venv
  3. venv/bin/pip install -r requirements.txt
  4. cp .env.example .env
  5. 编辑 .env 配置 API Key 和股票代码

详细指南：查看 docs/INSTALL.md
`
        };
      
      case 'start':
        const status = checkInstallation();
        if (!status.installed) {
          return {
            error: 'DSA 服务未安装',
            hint: '请先运行：deploy_dsa(action="install")'
          };
        }
        
        try {
          const pythonPath = process.platform === 'win32'
            ? path.join(INSTALL_DIR, 'venv', 'Scripts', 'python.exe')
            : path.join(INSTALL_DIR, 'venv', 'bin', 'python');
          
          spawn(pythonPath, ['main.py'], {
            cwd: INSTALL_DIR,
            detached: true,
            stdio: 'ignore'
          }).unref();
          
          setTimeout(() => {
            if (checkService()) {
              api.logger.info('✅ DSA 服务启动成功');
            }
          }, 5000);
          
          return {
            status: 'starting',
            message: 'DSA 服务启动中...',
            url: BASE_URL
          };
        } catch (error: any) {
          return { error: error.message };
        }
      
      case 'stop':
        try {
          if (process.platform === 'win32') {
            execSync('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *daily_stock_analysis*"');
          } else {
            execSync("pkill -f 'python.*main.py'");
          }
          return { status: 'success', message: 'DSA 服务已停止' };
        } catch {
          return { error: '停止失败' };
        }
      
      case 'status':
        const running = checkService();
        const installed = checkInstallation();
        return {
          status: running ? 'running' : 'stopped',
          installed: installed.installed,
          url: BASE_URL,
          port: PORT
        };
      
      case 'uninstall':
        try {
          if (process.platform !== 'win32') {
            execSync("pkill -f 'python.*main.py'");
          }
          fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
          return { status: 'success', message: 'DSA 服务已卸载' };
        } catch (error: any) {
          return { error: error.message };
        }
      
      default:
        return { error: `未知操作：${action}` };
    }
  }

  // Register stock analysis tools
  api.registerTool('stock_analysis', async ({ code }) => {
    if (!checkService()) {
      return {
        error: 'DSA 服务未运行',
        hint: '请运行：deploy_dsa(action="start")'
      };
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
      return { error: 'DSA 服务未运行' };
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
      return { error: 'DSA 服务未运行' };
    }
    try {
      return await client.marketReview(market || 'cn');
    } catch (error: any) {
      return { error: error.message };
    }
  }, {
    description: '大盘复盘',
    parameters: Type.Object({
      market: Type.Optional(Type.Union([
        Type.Literal('cn'),
        Type.Literal('us'),
        Type.Literal('both')
      ]))
    })
  });

  api.registerTool('ask_stock', async ({ question, code }) => {
    if (!checkService()) {
      return { error: 'DSA 服务未运行' };
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

  // Register deploy commands
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

  // Version check
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

  // Auto-detect stock-related queries
  api.onMessage(async (message) => {
    const tools = detectRelevantTools(message.content);
    if (tools.length > 0) {
      api.logger.debug(`Detected DSA tools: ${tools.join(', ')}`);
    }
  });
});
