/**
 * DSA Deployment Module
 * Split deployment logic into independent, testable functions
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/plugin-entry';
import { CONFIG, type PluginConfig } from './config.js';
import { createError, getFriendlyError, detectErrorType, ERROR_CODES, handleApiError, logError } from './errors.js';

/**
 * Check if Python is installed
 */
export function checkPython(): boolean {
  try {
    execSync('python3 --version', { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execSync('python --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Ensure virtual environment exists
 */
export function ensureVirtualEnv(installDir: string, api: OpenClawPluginApi): boolean {
  const venvDir = path.join(installDir, CONFIG.VENV_DIR);
  
  if (!fs.existsSync(venvDir)) {
    api.logger.info('Creating virtual environment...');
    runCommand('python3 -m venv venv', installDir);
  }
  
  return true;
}

/**
 * Ensure dependencies are installed
 */
export function ensureDependencies(
  installDir: string,
  api: OpenClawPluginApi
): { success: boolean; error?: string } {
  const venvDir = path.join(installDir, CONFIG.VENV_DIR);
  const python = getPythonPath(venvDir);
  const pip = getPipPath(venvDir);
  
  try {
    // Ensure venv exists
    ensureVirtualEnv(installDir, api);
    
    // Try to import key packages
    try {
      execSync(`${python} -c "import fastapi, uvicorn, pandas"`, {
        cwd: installDir,
        stdio: 'pipe'
      });
      api.logger.info('Dependencies already installed');
      return { success: true };
    } catch {
      api.logger.info('Installing dependencies (this may take a few minutes)...');
      runCommand(`${pip} install --upgrade pip`, installDir);
      runCommand(`${pip} install -r requirements.txt`, installDir);
      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Clone DSA repository
 */
export function cloneRepository(installDir: string, api: OpenClawPluginApi): boolean {
  if (!fs.existsSync(installDir)) {
    api.logger.info('Cloning repository...');
    runCommand(`git clone https://github.com/ZhuLinsen/daily_stock_analysis.git ${installDir}`);
  }
  return true;
}

/**
 * Create .env from example
 */
export function createEnvFile(installDir: string, api: OpenClawPluginApi): string | null {
  const envExample = path.join(installDir, '.env.example');
  const envFile = path.join(installDir, '.env');
  
  if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
    fs.copyFileSync(envExample, envFile);
    api.logger.info(`Created .env at ${envFile}`);
    return envFile;
  }
  
  return envFile;
}

/**
 * Install DSA service
 */
export async function installDSA(
  api: OpenClawPluginApi,
  config: PluginConfig
): Promise<any> {
  const installDir = expandHome(config.installDir || CONFIG.INSTALL_DIR);
  
  try {
    // Step 1: Check Python
    if (!checkPython()) {
      return getFriendlyError(ERROR_CODES.PYTHON_NOT_FOUND);
    }
    
    // Step 2: Clone repository
    cloneRepository(installDir, api);
    
    // Step 3: Ensure dependencies
    const depResult = ensureDependencies(installDir, api);
    if (!depResult.success) {
      return createError({
        message: '依赖安装失败',
        details: depResult.error,
        code: ERROR_CODES.DEPLOYMENT_FAILED
      });
    }
    
    // Step 4: Create .env
    const envFile = createEnvFile(installDir, api);
    
    return {
      status: 'success',
      message: 'DSA 服务已安装（Python 模式，虚拟环境）',
      autoInstall: true,
      virtualEnv: true,
      nextSteps: [
        `1. 编辑 ${envFile} 配置：`,
        '   - STOCK_LIST=600519,hk00700,AAPL (你的股票代码)',
        '   - GEMINI_API_KEY=your_key (至少配置一个 AI API Key)',
        '2. 运行 deploy_dsa(action="start") 启动服务',
        `3. 访问 http://localhost:${config.dsaPort || CONFIG.DEFAULT_PORT} 使用 Web 界面`
      ],
      installDir,
      port: config.dsaPort || CONFIG.DEFAULT_PORT
    };
  } catch (error: any) {
    logError(api.logger, error, 'installDSA');
    return getFriendlyError(detectErrorType(error), { details: error.message });
  }
}

/**
 * Start DSA service
 */
export async function startDSA(
  api: OpenClawPluginApi,
  config: PluginConfig
): Promise<any> {
  const installDir = expandHome(config.installDir || CONFIG.INSTALL_DIR);
  const venvDir = path.join(installDir, CONFIG.VENV_DIR);
  const python = getPythonPath(venvDir);
  const baseUrl = config.dsaBaseUrl || CONFIG.DEFAULT_BASE_URL;
  
  try {
    // Auto-install if needed
    if (!fs.existsSync(venvDir)) {
      api.logger.info('Virtual environment not found, auto-installing...');
      const installResult = await installDSA(api, config);
      if ('error' in installResult) {
        return installResult;
      }
    }
    
    if (!fs.existsSync(python)) {
      return createError({
        message: '虚拟环境未找到',
        hint: '请先运行 deploy_dsa(action="install") 安装服务',
        code: ERROR_CODES.SERVICE_NOT_INSTALLED
      });
    }
    
    // Check if already running
    if (checkDSAService(baseUrl)) {
      return {
        status: 'already_running',
        message: 'DSA 服务已在运行',
        url: baseUrl
      };
    }
    
    api.logger.info('Starting DSA service (Python)...');
    
    // Start in background
    const child = spawn(python, ['main.py'], {
      cwd: installDir,
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    child.unref();
    
    // Wait for service to start
    setTimeout(() => {
      if (checkDSAService(baseUrl)) {
        api.logger.info('DSA service started successfully!');
      }
    }, CONFIG.SERVICE_START_TIMEOUT);
    
    return {
      status: 'starting',
      message: 'DSA 服务启动中...',
      url: baseUrl,
      port: config.dsaPort || CONFIG.DEFAULT_PORT,
      pid: child.pid,
      autoInstall: true
    };
  } catch (error: any) {
    logError(api.logger, error, 'startDSA');
    return getFriendlyError(detectErrorType(error), { details: error.message });
  }
}

/**
 * Stop DSA service
 */
export function stopDSA(api: OpenClawPluginApi): any {
  try {
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
    logError(api.logger, error, 'stopDSA');
    return getFriendlyError(detectErrorType(error), { details: error.message });
  }
}

/**
 * Get DSA service status
 */
export function statusDSA(
  api: OpenClawPluginApi,
  config: PluginConfig
): any {
  const installDir = expandHome(config.installDir || CONFIG.INSTALL_DIR);
  const venvDir = path.join(installDir, CONFIG.VENV_DIR);
  const python = getPythonPath(venvDir);
  const baseUrl = config.dsaBaseUrl || CONFIG.DEFAULT_BASE_URL;
  
  try {
    const running = checkDSAService(baseUrl);
    const venvExists = fs.existsSync(venvDir);
    const envExists = fs.existsSync(path.join(installDir, '.env'));
    const pythonExists = fs.existsSync(python);
    const requirementsFile = fs.existsSync(path.join(installDir, 'requirements.txt'));
    
    return {
      status: running ? 'running' : 'stopped',
      apiHealth: running ? 'healthy' : 'unhealthy',
      installed: venvExists,
      configured: envExists,
      pythonReady: pythonExists,
      requirementsReady: requirementsFile,
      installDir,
      url: baseUrl,
      port: config.dsaPort || CONFIG.DEFAULT_PORT,
      autoInstallReady: venvExists && pythonExists,
      message: venvExists && pythonExists ? '✅ 已就绪，可以启动' : '⚠️ 需要先安装'
    };
  } catch (error: any) {
    logError(api.logger, error, 'statusDSA');
    return getFriendlyError(detectErrorType(error), { details: error.message });
  }
}

/**
 * Uninstall DSA service
 */
export function uninstallDSA(api: OpenClawPluginApi, config: PluginConfig): any {
  const installDir = expandHome(config.installDir || CONFIG.INSTALL_DIR);
  
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
    logError(api.logger, error, 'uninstallDSA');
    return getFriendlyError(detectErrorType(error), { details: error.message });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function expandHome(dir: string): string {
  if (dir.startsWith('~')) {
    return path.join(process.env.HOME || '', dir.slice(1));
  }
  return dir;
}

function getPythonPath(venvDir: string): string {
  return process.platform === 'win32'
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
}

function getPipPath(venvDir: string): string {
  return process.platform === 'win32'
    ? path.join(venvDir, 'Scripts', 'pip.exe')
    : path.join(venvDir, 'bin', 'pip');
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
