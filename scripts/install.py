#!/usr/bin/env python3
"""
DSA Service Installer - Cross-platform
Usage: python install.py
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header():
    print("🚀 DSA 服务安装脚本")
    print("=" * 50)
    print()

def check_python():
    """Check Python version"""
    print("📋 步骤 1/4: 检测 Python...")
    
    try:
        version_output = subprocess.check_output(
            ['python3', '--version'] if sys.platform != 'win32' else ['python', '--version'],
            stderr=subprocess.STDOUT,
            text=True
        ).strip()
        
        print(f"✅ {version_output}")
        
        # Check version >= 3.10
        import re
        match = re.search(r'Python (\d+)\.(\d+)', version_output)
        if match:
            major, minor = int(match.group(1)), int(match.group(2))
            if major < 3 or (major == 3 and minor < 10):
                print(f"❌ Python 版本过低，需要 3.10+")
                print(f"💡 当前版本：{major}.{minor}")
                return None
        
        return 'python3' if sys.platform != 'win32' else 'python'
    
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ 未找到 Python 3.10+")
        print("💡 请先安装 Python 3.10+")
        if sys.platform == 'darwin':
            print("   macOS: brew install python@3.10")
        elif sys.platform == 'linux':
            print("   Ubuntu: sudo apt install python3.10")
        else:
            print("   Windows: https://www.python.org/downloads/")
        return None

def create_venv(python_path):
    """Create virtual environment"""
    print()
    print("📋 步骤 2/4: 创建虚拟环境...")
    
    venv_path = Path('venv')
    if venv_path.exists():
        print("⚠️  虚拟环境已存在，将覆盖")
        import shutil
        shutil.rmtree(venv_path)
    
    subprocess.run([python_path, '-m', 'venv', 'venv'], check=True)
    print("✅ 虚拟环境已创建")

def install_deps(python_path):
    """Install dependencies"""
    print()
    print("📋 步骤 3/4: 安装依赖（这可能需要 2-5 分钟）...")
    
    pip = str(Path('venv', 'Scripts', 'pip')) if sys.platform == 'win32' else str(Path('venv', 'bin', 'pip'))
    
    subprocess.run([pip, 'install', '--upgrade', 'pip'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([pip, 'install', '-r', 'requirements.txt'], check=True)
    
    print("✅ 依赖已安装")

def create_env():
    """Create .env file"""
    print()
    print("📋 步骤 4/4: 配置服务...")
    
    env_file = Path('.env')
    env_example = Path('.env.example')
    
    if env_file.exists():
        print("⚠️  .env 已存在")
    elif env_example.exists():
        import shutil
        shutil.copy(env_example, env_file)
        print("✅ 配置文件已创建")
    else:
        print("⚠️  .env.example 不存在")

def print_summary():
    """Print installation summary"""
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🎉 安装完成！")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    print("下一步:")
    print("  1. 编辑配置文件:")
    print("     vim .env  (macOS/Linux)")
    print("     notepad .env  (Windows)")
    print()
    print("  2. 配置必要参数:")
    print("     GEMINI_API_KEY=your_key_here")
    print("     STOCK_LIST=600519,hk00700,AAPL")
    print()
    print("  3. 启动服务:")
    print('     deploy_dsa(action="start")')
    print()
    print("  4. 分析股票:")
    print("     用 DSA 分析贵州茅台")
    print()
    print("详细指南：查看 docs/INSTALL.md")
    print()

def main():
    print_header()
    
    python = check_python()
    if not python:
        sys.exit(1)
    
    create_venv(python)
    install_deps(python)
    create_env()
    
    print_summary()

if __name__ == '__main__':
    main()
