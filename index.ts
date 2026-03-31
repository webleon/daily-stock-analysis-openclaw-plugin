/**
 * Daily Stock Analysis OpenClaw Plugin
 * Simple bridge to Daily Stock Analysis service with out-of-the-box experience
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawn } from "node:child_process";
import { detectRelevantTools } from "./src/keywords-strict.js";
import { DSAClient } from "./src/api-client.js";
import { checkPythonVersion, getPythonErrorMessage } from "./src/python-check.js";
import { verifyInstallation } from "./src/verify.js";

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

  // Get Python executable
  function getPython(): string {
    try {
      execSync('python3 --version', { stdio: 'pipe' });
      return 'python3';
    } catch {
      return 'python';
    }
  }

  // Deploy function with step-by-step progress
  function deploy(action: string): any {
    const python = getPython();
    
    switch (action) {
      case 'install':
        api.logger.info('🚀 开始安装 DSA 服务...');
        
        try {
          // Step 1: Check Python version
          api.logger.info('🔍 检测 Python 版本...');
          const pythonCheck = checkPythonVersion();
          
          if (!pythonCheck.installed) {
            return {
              error: '未找到 Python',
              hint: getPythonErrorMessage(pythonCheck)
            };
          }
          
          if (!pythonCheck.meetsRequirement) {
            return {
              error: `Python 版本过低 (当前：${pythonCheck.version}, 需要：${pythonCheck.requiredVersion}+)`,
              hint: getPythonErrorMessage(pythonCheck)
            };
          }
          
          api.logger.info(`✅ Python ${pythonCheck.version} 符合要求`);
          
          // Step 2: Clone repository
          api.logger.info('📦 克隆仓库...');
          if (!fs.existsSync(INSTALL_DIR)) {
            execSync(`git clone https://github.com/ZhuLinsen/daily_stock_analysis.git ${INSTALL_DIR}`, {
              stdio: ['pipe', 'inherit', 'inherit']
            });
          } else {
            api.logger.info('ℹ️  仓库已存在，跳过克隆');
          }
          
          // Step 3: Create virtual environment
          api.logger.info('🐍 创建虚拟环境...');
          execSync(`${python} -m venv venv`, { 
            cwd: INSTALL_DIR,
            stdio: ['pipe', 'inherit', 'inherit']
          });
          
          // Step 4: Install dependencies
          api.logger.info('📦 安装依赖（可能需要 2-5 分钟）...');
          const pip = process.platform === 'win32' 
            ? 'venv\\Scripts\\pip' 
            : 'venv/bin/pip';
          
          execSync(`${pip} install --upgrade pip`, { 
            cwd: INSTALL_DIR,
            stdio: ['pipe', 'inherit', 'inherit']
          });
          
          execSync(`${pip} install -r requirements.txt`, { 
            cwd: INSTALL_DIR,
            stdio: ['pipe', 'inherit', 'inherit']
          });
          
          // Step 5: Create .env
          api.logger.info('📝 创建配置文件...');
          const envExample = path.join(INSTALL_DIR, '.env.example');
          const envFile = path.join(INSTALL_DIR, '.env');
          
          if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
            fs.copyFileSync(envExample, envFile);
            api.logger.info(`✅ .env 已创建`);
          } else {
            api.logger.info('ℹ️  .env 已存在，跳过创建');
          }
          
          // Step 6: Verify installation
          api.logger.info('✅ 验证安装...');
          const verifyResult = verifyInstallation(INSTALL_DIR);
          
          if (!verifyResult.success) {
            api.logger.warn('⚠️  安装验证未完全通过:');
            verifyResult.checks.forEach(check => {
              api.logger.warn(`  ${check.name}: ${check.message}`);
            });
          }
          
          return {
            status: 'success',
            message: '✅ DSA 服务已安装完成',
            verification: verifyResult,
            nextSteps: [
              `1. 编辑配置文件：vim ${envFile}`,
              '',
              '2. 配置必要参数：',
              '   - STOCK_LIST=600519,hk00700,AAPL (你的股票代码)',
              '   - GEMINI_API_KEY=your_key (至少配置一个 AI API Key)',
              '',
              '3. 启动服务：deploy_dsa(action="start")',
              '4. 验证状态：deploy_dsa(action="status")'
            ]
          };
          
        } catch (error: any) {
          api.logger.error(`❌ 安装失败：${error.message}`);
          
          // Provide specific error messages
          if (error.message.includes('git')) {
            return {
              error: '克隆仓库失败',
              hint: '请检查：\n1. 是否已安装 git\n2. 网络连接是否正常\n3. 尝试手动执行：git clone https://github.com/ZhuLinsen/daily_stock_analysis.git'
            };
          }
          
          if (error.message.includes('pip')) {
            return {
              error: '安装依赖失败',
              hint: '请检查：\n1. 网络连接是否正常\n2. 尝试使用镜像：pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt'
            };
          }
          
          return {
            error: error.message,
            hint: '请检查日志或重新尝试安装'
          };
        }

      case 'start':
        try {
          api.logger.info('🚀 启动 DSA 服务...');
          
          const venvPath = path.join(INSTALL_DIR, 'venv');
          if (!fs.existsSync(venvPath)) {
            return { 
              error: '虚拟环境未找到', 
              hint: '请先运行 deploy_dsa(action="install") 安装服务' 
            };
          }
          
          const pythonPath = process.platform === 'win32'
            ? path.join(venvPath, 'Scripts', 'python.exe')
            : path.join(venvPath, 'bin', 'python');
          
          if (!fs.existsSync(pythonPath)) {
            return { error: 'Python 可执行文件未找到' };
          }
          
          const running = checkService();
          if (running) {
            return {
              status: 'already_running',
              message: 'DSA 服务已在运行',
              url: BASE_URL
            };
          }
          
          api.logger.info('ℹ️  服务将在后台运行');
          
          spawn(pythonPath, ['main.py'], {
            cwd: INSTALL_DIR,
            detached: true,
            stdio: 'ignore'
          }).unref();
          
          // Wait for service to start
          setTimeout(() => {
            if (checkService()) {
              api.logger.info('✅ 服务启动成功！');
            } else {
              api.logger.warn('⚠️  服务可能还在启动中，请稍后检查状态');
            }
          }, 5000);
          
          return { 
            status: 'starting', 
            message: '服务启动中...', 
            url: BASE_URL,
            hint: '等待 5-10 秒后运行 deploy_dsa(action="status") 验证状态'
          };
          
        } catch (error: any) {
          api.logger.error(`❌ 启动失败：${error.message}`);
          return { error: error.message };
        }

      case 'stop':
        try {
          api.logger.info('🛑 停止 DSA 服务...');
          if (process.platform === 'win32') {
            execSync('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *daily_stock_analysis*"');
          } else {
            execSync("pkill -f 'python.*main.py'");
          }
          return { status: 'success', message: '服务已停止' };
        } catch {
          return { error: '停止失败' };
        }

      case 'status':
        const running = checkService();
        return {
          status: running ? 'running' : 'stopped',
          url: BASE_URL,
          port: PORT,
          health: running ? 'healthy' : 'unhealthy'
        };

      case 'uninstall':
        try {
          api.logger.info('🗑️  卸载 DSA 服务...');
          try {
            if (process.platform === 'win32') {
              execSync('taskkill /F /IM python.exe /FI "WINDOWTITLE eq *daily_stock_analysis*"');
            } else {
              execSync("pkill -f 'python.*main.py'");
            }
          } catch {}
          
          fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
          return { status: 'success', message: '服务已卸载' };
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
    description: '部署 DSA 服务（开箱即用）',
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
  api.logger.info(`Install dir: ${INSTALL_DIR}`);

  // Auto-detect
  api.onMessage(async (message) => {
    const tools = detectRelevantTools(message.content);
    if (tools.length > 0) {
      api.logger.debug(`Detected: ${tools.join(', ')}`);
    }
  });
});
