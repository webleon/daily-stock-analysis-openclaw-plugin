/**
 * Installation Verifier
 * Verifies that DSA service is properly installed
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface VerificationResult {
  success: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  nextSteps: string[];
}

/**
 * Verify DSA installation
 */
export function verifyInstallation(installDir: string): VerificationResult {
  const checks: Array<{ name: string; passed: boolean; message: string }> = [];
  
  // Check 1: Virtual environment exists
  const venvPath = path.join(installDir, 'venv');
  const venvExists = fs.existsSync(venvPath);
  checks.push({
    name: '虚拟环境',
    passed: venvExists,
    message: venvExists ? '✅ 已创建' : '❌ 未找到'
  });
  
  // Check 2: Python executable exists
  const pythonPath = process.platform === 'win32'
    ? path.join(venvPath, 'Scripts', 'python.exe')
    : path.join(venvPath, 'bin', 'python');
  const pythonExists = fs.existsSync(pythonPath);
  checks.push({
    name: 'Python 可执行文件',
    passed: pythonExists,
    message: pythonExists ? '✅ 存在' : '❌ 未找到'
  });
  
  // Check 3: Key packages installed
  let packagesInstalled = false;
  if (pythonExists) {
    try {
      execSync(`${pythonPath} -c "import fastapi, uvicorn"`, {
        cwd: installDir,
        stdio: 'pipe'
      });
      packagesInstalled = true;
    } catch {
      packagesInstalled = false;
    }
  }
  checks.push({
    name: '核心依赖',
    passed: packagesInstalled,
    message: packagesInstalled ? '✅ 已安装' : '❌ 未安装'
  });
  
  // Check 4: .env file exists
  const envPath = path.join(installDir, '.env');
  const envExists = fs.existsSync(envPath);
  checks.push({
    name: '配置文件',
    passed: envExists,
    message: envExists ? '✅ 已创建' : '❌ 未创建'
  });
  
  // Check 5: requirements.txt exists
  const requirementsPath = path.join(installDir, 'requirements.txt');
  const requirementsExists = fs.existsSync(requirementsPath);
  checks.push({
    name: '依赖列表',
    passed: requirementsExists,
    message: requirementsExists ? '✅ 存在' : '❌ 未找到'
  });
  
  const allPassed = checks.every(c => c.passed);
  
  return {
    success: allPassed,
    checks,
    nextSteps: allPassed ? [
      '1. 编辑 .env 配置股票代码和 API Key',
      '2. 运行 deploy_dsa(action="start") 启动服务',
      '3. 运行 deploy_dsa(action="status") 验证状态'
    ] : [
      '安装未完成，请检查上述失败项',
      '可尝试重新运行 deploy_dsa(action="install")'
    ]
  };
}
