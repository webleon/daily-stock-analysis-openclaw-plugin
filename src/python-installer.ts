/**
 * Python Auto-Installer
 * Automatically installs Python 3.10+ on macOS, Windows, and Linux
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PythonInstallResult {
  success: boolean;
  version?: string;
  path?: string;
  error?: string;
  manualInstallRequired?: boolean;
  manualInstallUrl?: string;
}

/**
 * Check if a command exists
 */
function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Python version from executable
 */
function getPythonVersion(pythonPath: string): string {
  try {
    const output = execSync(`${pythonPath} --version`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return output.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Find best Python 3.10+ executable
 */
export function findBestPython(): { path: string; version: string } | null {
  const versions = [
    'python3.12',
    'python3.11',
    'python3.10',
    'python3'
  ];
  
  for (const version of versions) {
    try {
      const output = execSync(`${version} --version`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const versionMatch = output.match(/Python\s+(\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        
        if (major > 3 || (major === 3 && minor >= 10)) {
          return {
            path: version,
            version: output.trim()
          };
        }
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

/**
 * Install Python 3.10 on macOS using Homebrew
 */
function installPythonMacOS(): PythonInstallResult {
  try {
    console.log('🔧 检测到 macOS 系统，使用 Homebrew 安装 Python 3.10...');
    
    // Check if Homebrew is installed
    if (!commandExists('brew')) {
      return {
        success: false,
        error: 'Homebrew 未安装',
        manualInstallRequired: true,
        manualInstallUrl: 'https://brew.sh/'
      };
    }
    
    // Install Python 3.10
    console.log('📦 执行：brew install python@3.10');
    execSync('brew install python@3.10', {
      stdio: 'inherit'
    });
    
    // Verify installation
    const version = getPythonVersion('/usr/local/bin/python3.10');
    
    return {
      success: true,
      version,
      path: '/usr/local/bin/python3.10'
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      manualInstallRequired: true,
      manualInstallUrl: 'https://www.python.org/downloads/macos/'
    };
  }
}

/**
 * Install Python 3.10 on Windows
 */
function installPythonWindows(): PythonInstallResult {
  return {
    success: false,
    manualInstallRequired: true,
    manualInstallUrl: 'https://www.python.org/downloads/',
    error: 'Windows 系统需要手动安装 Python',
    hint: `
请访问 https://www.python.org/downloads/ 下载并安装 Python 3.10+

安装时请勾选：
✅ Add Python to PATH
✅ Install for all users
`
  };
}

/**
 * Install Python 3.10 on Linux
 */
function installPythonLinux(): PythonInstallResult {
  try {
    // Try apt (Debian/Ubuntu)
    if (commandExists('apt')) {
      console.log('🔧 检测到 Debian/Ubuntu 系统...');
      console.log('📦 执行：sudo apt update && sudo apt install python3.10 python3.10-venv python3.10-dev');
      
      execSync('sudo apt update', { stdio: 'inherit' });
      execSync('sudo apt install -y python3.10 python3.10-venv python3.10-dev', {
        stdio: 'inherit'
      });
      
      const version = getPythonVersion('python3.10');
      
      return {
        success: true,
        version,
        path: '/usr/bin/python3.10'
      };
    }
    
    // Try dnf (Fedora/RHEL)
    if (commandExists('dnf')) {
      console.log('🔧 检测到 Fedora/RHEL 系统...');
      console.log('📦 执行：sudo dnf install python3.10 python3.10-devel');
      
      execSync('sudo dnf install -y python3.10 python3.10-devel', {
        stdio: 'inherit'
      });
      
      const version = getPythonVersion('python3.10');
      
      return {
        success: true,
        version,
        path: '/usr/bin/python3.10'
      };
    }
    
    return {
      success: false,
      error: '不支持的 Linux 发行版',
      manualInstallRequired: true,
      manualInstallUrl: 'https://www.python.org/downloads/'
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      manualInstallRequired: true,
      manualInstallUrl: 'https://www.python.org/downloads/'
    };
  }
}

/**
 * Auto-install Python 3.10+
 */
export async function autoInstallPython(): Promise<PythonInstallResult> {
  const platform = process.platform;
  
  console.log('🔍 检测操作系统...');
  console.log(`   系统：${platform}`);
  
  switch (platform) {
    case 'darwin':
      return installPythonMacOS();
    
    case 'win32':
      return installPythonWindows();
    
    case 'linux':
      return installPythonLinux();
    
    default:
      return {
        success: false,
        error: `不支持的操作系统：${platform}`,
        manualInstallRequired: true,
        manualInstallUrl: 'https://www.python.org/downloads/'
      };
  }
}

/**
 * Create virtual environment with specific Python version
 */
export function createVirtualEnv(
  installDir: string,
  pythonPath: string
): { success: boolean; error?: string } {
  try {
    console.log('🐍 创建虚拟环境...');
    console.log(`   Python: ${pythonPath}`);
    console.log(`   目录：${installDir}`);
    
    execSync(`${pythonPath} -m venv venv`, {
      cwd: installDir,
      stdio: 'inherit'
    });
    
    // Verify virtual environment
    const venvPython = process.platform === 'win32'
      ? path.join(installDir, 'venv', 'Scripts', 'python.exe')
      : path.join(installDir, 'venv', 'bin', 'python');
    
    if (!fs.existsSync(venvPython)) {
      return {
        success: false,
        error: '虚拟环境创建失败：找不到 Python 可执行文件'
      };
    }
    
    const version = getPythonVersion(venvPython);
    console.log(`✅ 虚拟环境创建成功：${version}`);
    
    return {
      success: true
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `创建虚拟环境失败：${error.message}`
    };
  }
}

/**
 * Verify virtual environment
 */
export function verifyVirtualEnv(installDir: string): {
  valid: boolean;
  pythonVersion: string;
  error?: string;
} {
  const venvPython = process.platform === 'win32'
    ? path.join(installDir, 'venv', 'Scripts', 'python.exe')
    : path.join(installDir, 'venv', 'bin', 'python');
  
  if (!fs.existsSync(venvPython)) {
    return {
      valid: false,
      pythonVersion: 'unknown',
      error: '虚拟环境 Python 不存在'
    };
  }
  
  try {
    const version = getPythonVersion(venvPython);
    
    // Check Python version >= 3.10
    const versionMatch = version.match(/Python\s+(\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      
      if (major < 3 || (major === 3 && minor < 10)) {
        return {
          valid: false,
          pythonVersion: version,
          error: `Python 版本过低：${version}，需要 3.10+`
        };
      }
    }
    
    return {
      valid: true,
      pythonVersion: version
    };
    
  } catch (error: any) {
    return {
      valid: false,
      pythonVersion: 'unknown',
      error: error.message
    };
  }
}
