/**
 * Python Version Checker
 * Detects Python version and provides user-friendly error messages
 */

export interface PythonCheckResult {
  installed: boolean;
  version: string;
  major: number;
  minor: number;
  meetsRequirement: boolean;
  requiredVersion: string;
}

const REQUIRED_PYTHON_MAJOR = 3;
const REQUIRED_PYTHON_MINOR = 10;

/**
 * Check Python version
 */
export function checkPythonVersion(): PythonCheckResult {
  const { execSync } = require('node:child_process');
  
  try {
    // Try python3 first, then python
    let versionOutput: string;
    try {
      versionOutput = execSync('python3 --version', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      versionOutput = execSync('python --version', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }
    
    // Parse version string (e.g., "Python 3.9.6")
    const match = versionOutput.match(/Python\s+(\d+)\.(\d+)\.(\d+)/i);
    
    if (!match) {
      return {
        installed: false,
        version: 'unknown',
        major: 0,
        minor: 0,
        meetsRequirement: false,
        requiredVersion: `${REQUIRED_PYTHON_MAJOR}.${REQUIRED_PYTHON_MINOR}`
      };
    }
    
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    const patch = parseInt(match[3]);
    
    const meetsRequirement = 
      major > REQUIRED_PYTHON_MAJOR || 
      (major === REQUIRED_PYTHON_MAJOR && minor >= REQUIRED_PYTHON_MINOR);
    
    return {
      installed: true,
      version: `${major}.${minor}.${patch}`,
      major,
      minor,
      meetsRequirement,
      requiredVersion: `${REQUIRED_PYTHON_MAJOR}.${REQUIRED_PYTHON_MINOR}`
    };
    
  } catch (error: any) {
    return {
      installed: false,
      version: 'not found',
      major: 0,
      minor: 0,
      meetsRequirement: false,
      requiredVersion: `${REQUIRED_PYTHON_MAJOR}.${REQUIRED_PYTHON_MINOR}`
    };
  }
}

/**
 * Get user-friendly error message for Python issues
 */
export function getPythonErrorMessage(result: PythonCheckResult): string {
  if (!result.installed) {
    return `
❌ 未找到 Python

需要安装 Python ${result.requiredVersion}+

解决方法：
1. macOS: 
   brew install python@${result.requiredVersion}
   
2. Windows: 
   下载 https://www.python.org/downloads/
   安装时勾选 "Add Python to PATH"
   
3. 安装后重新运行：
   deploy_dsa(action="install")
`.trim();
  }
  
  if (!result.meetsRequirement) {
    return `
❌ Python 版本过低

当前版本：Python ${result.version}
需要版本：Python ${result.requiredVersion}+

解决方法：
1. macOS: 
   brew install python@${result.requiredVersion}
   
2. Windows: 
   下载最新版 https://www.python.org/downloads/
   
3. 安装后重新运行：
   deploy_dsa(action="install")
`.trim();
  }
  
  return '';
}

/**
 * Get Python executable path
 */
export function getPythonPath(): string {
  const { execSync } = require('node:child_process');
  
  try {
    execSync('python3 --version', { stdio: 'pipe' });
    return 'python3';
  } catch {
    return 'python';
  }
}
