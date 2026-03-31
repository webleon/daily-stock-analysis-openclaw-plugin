#!/bin/bash
# DSA Service Installer - macOS/Linux
# Usage: bash install.sh

set -e

echo "🚀 DSA 服务安装脚本"
echo "=================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Python
echo "📋 步骤 1/4: 检测 Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ ${PYTHON_VERSION}${NC}"
    
    # Check version >= 3.10
    PYTHON_MINOR=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f2)
    if [ "$PYTHON_MINOR" -lt 10 ]; then
        echo -e "${RED}❌ Python 版本过低，需要 3.10+${NC}"
        echo -e "${YELLOW}💡 请安装 Python 3.10+:${NC}"
        echo "   macOS: brew install python@3.10"
        echo "   Ubuntu: sudo apt install python3.10"
        exit 1
    fi
else
    echo -e "${RED}❌ 未找到 Python 3${NC}"
    echo -e "${YELLOW}💡 请先安装 Python 3.10+${NC}"
    exit 1
fi

# Step 2: Create virtual environment
echo ""
echo "📋 步骤 2/4: 创建虚拟环境..."
if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  虚拟环境已存在，将覆盖${NC}"
    rm -rf venv
fi

python3 -m venv venv
echo -e "${GREEN}✅ 虚拟环境已创建${NC}"

# Activate virtual environment
source venv/bin/activate

# Step 3: Install dependencies
echo ""
echo "📋 步骤 3/4: 安装依赖（这可能需要 2-5 分钟）..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

echo -e "${GREEN}✅ 依赖已安装${NC}"

# Step 4: Configuration
echo ""
echo "📋 步骤 4/4: 配置服务..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 已存在${NC}"
else
    cp .env.example .env
    echo -e "${GREEN}✅ 配置文件已创建${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 安装完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "下一步:"
echo "  1. 编辑配置文件:"
echo "     vim .env"
echo ""
echo "  2. 配置必要参数:"
echo "     GEMINI_API_KEY=your_key_here"
echo "     STOCK_LIST=600519,hk00700,AAPL"
echo ""
echo "  3. 启动服务:"
echo "     deploy_dsa(action=\"start\")"
echo ""
echo "  4. 分析股票:"
echo "     用 DSA 分析贵州茅台"
echo ""
echo "详细指南：查看 docs/INSTALL.md"
echo ""
