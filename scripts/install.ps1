# DSA Service Installer - Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1

Write-Host "🚀 DSA 服务安装脚本" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

# Step 1: Check Python
Write-Host "📋 步骤 1/4: 检测 Python..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    Write-Host " ✅ $pythonVersion" -ForegroundColor Green
    
    # Check version >= 3.10
    $version = python --version 2>&1 | Select-String "Python (\d+)\.(\d+)"
    if ($version.Matches.Groups[2].Value -lt 10) {
        Write-Host "❌ Python 版本过低，需要 3.10+" -ForegroundColor Red
        Write-Host "💡 请访问 https://www.python.org/downloads/ 安装 Python 3.10+" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host " ❌ 未找到 Python" -ForegroundColor Red
    Write-Host "💡 请访问 https://www.python.org/downloads/ 安装 Python 3.10+" -ForegroundColor Yellow
    Write-Host "   安装时请勾选：Add Python to PATH"
    exit 1
}

# Step 2: Create virtual environment
Write-Host ""
Write-Host "📋 步骤 2/4: 创建虚拟环境..." -NoNewline
if (Test-Path "venv") {
    Write-Host " ⚠️ 虚拟环境已存在，将覆盖" -ForegroundColor Yellow
    Remove-Item -Recurse -Force venv
}

python -m venv venv
Write-Host " ✅ 虚拟环境已创建" -ForegroundColor Green

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Step 3: Install dependencies
Write-Host ""
Write-Host "📋 步骤 3/4: 安装依赖（这可能需要 2-5 分钟）..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt

Write-Host "✅ 依赖已安装" -ForegroundColor Green

# Step 4: Configuration
Write-Host ""
Write-Host "📋 步骤 4/4: 配置服务..." -NoNewline
if (Test-Path ".env") {
    Write-Host " ⚠️ .env 已存在" -ForegroundColor Yellow
} else {
    Copy-Item .env.example .env
    Write-Host " ✅ 配置文件已创建" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 安装完成！" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "  1. 编辑配置文件:"
Write-Host "     notepad .env"
Write-Host ""
Write-Host "  2. 配置必要参数:"
Write-Host "     GEMINI_API_KEY=your_key_here"
Write-Host "     STOCK_LIST=600519,hk00700,AAPL"
Write-Host ""
Write-Host "  3. 启动服务:"
Write-Host "     deploy_dsa(action=`"start`")"
Write-Host ""
Write-Host "  4. 分析股票:"
Write-Host "     用 DSA 分析贵州茅台"
Write-Host ""
Write-Host "详细指南：查看 docs/INSTALL.md"
Write-Host ""
