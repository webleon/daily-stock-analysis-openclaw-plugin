# DSA 插件开箱即用实现计划

**日期：** 2026-03-31  
**目标：** 真正的开箱即用体验

---

## 🎯 目标

用户执行 `deploy_dsa(action="install")` 后：
1. ✅ 自动检测 Python 版本（≥3.10）
2. ✅ 清晰的错误提示和解决步骤
3. ✅ 自动完成所有安装步骤
4. ✅ 安装后自动验证
5. ✅ 引导配置 .env

---

## 📋 实现步骤

### Step 1: Python 版本检测

**文件：** `src/python-check.ts`（新增）

**功能：**
```typescript
function checkPythonVersion(): {
  installed: boolean;
  version: string;
  meetsRequirement: boolean;
  requiredVersion: string;
}
```

**错误消息：**
```
❌ Python 版本过低

当前版本：Python 3.9.6
需要版本：Python 3.10+

解决方法：
1. macOS: brew install python@3.10
2. Windows: 下载 https://www.python.org/downloads/
3. 安装后重新运行 deploy_dsa(action="install")
```

---

### Step 2: 分步安装流程

**文件：** `index.ts` 修改

**流程：**
```typescript
case 'install':
  // Step 1: 检测 Python
  log('🔍 检测 Python 版本...');
  const pythonCheck = checkPythonVersion();
  if (!pythonCheck.meetsRequirement) {
    return errorWithSolution(pythonCheck);
  }
  
  // Step 2: 克隆仓库
  log('📦 克隆仓库...');
  if (!fs.existsSync(INSTALL_DIR)) {
    execSync(`git clone ...`);
  }
  
  // Step 3: 创建虚拟环境
  log('🐍 创建虚拟环境...');
  execSync('python3 -m venv venv');
  
  // Step 4: 安装依赖
  log('📦 安装依赖（可能需要 2-5 分钟）...');
  execSync('venv/bin/pip install -r requirements.txt');
  
  // Step 5: 创建 .env
  log('📝 创建配置文件...');
  if (!fs.existsSync('.env')) {
    fs.copyFileSync('.env.example', '.env');
  }
  
  // Step 6: 验证安装
  log('✅ 验证安装...');
  const verifyResult = verifyInstallation();
  
  return {
    status: 'success',
    message: '安装完成',
    nextSteps: verifyResult.nextSteps
  };
```

---

### Step 3: 友好的错误处理

**文件：** `src/errors.ts`（简化版）

**错误类型：**
```typescript
const ERROR_TEMPLATES = {
  PYTHON_NOT_FOUND: {
    title: '❌ 未找到 Python',
    solution: ['安装 Python: https://www.python.org/downloads/']
  },
  PYTHON_VERSION_TOO_LOW: {
    title: '❌ Python 版本过低',
    solution: ['macOS: brew install python@3.10', 'Windows: 下载最新版']
  },
  PIP_INSTALL_FAILED: {
    title: '❌ 依赖安装失败',
    solution: ['检查网络连接', '尝试使用镜像：pip install -i https://pypi.tuna.tsinghua.edu.cn/simple']
  },
  GIT_CLONE_FAILED: {
    title: '❌ 克隆仓库失败',
    solution: ['检查网络连接', '检查 git 是否安装']
  }
};
```

---

### Step 4: 安装后验证

**文件：** `src/verify.ts`（新增）

**验证项：**
```typescript
function verifyInstallation(): {
  success: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  nextSteps: string[];
}
```

**验证内容：**
- ✅ 虚拟环境存在
- ✅ 关键包已安装（fastapi, uvicorn, pandas）
- ✅ .env 文件存在
- ✅ Python 可执行文件存在

---

### Step 5: 配置引导

**文件：** `index.ts`

**安装完成后提示：**
```
✅ DSA 服务已安装完成！

下一步：
1. 编辑配置文件：
   vim ~/.openclaw/external-services/daily_stock_analysis/.env

2. 配置必要参数：
   - STOCK_LIST=600519,hk00700,AAPL (你的股票代码)
   - GEMINI_API_KEY=your_key (至少配置一个 AI API Key)

3. 启动服务：
   deploy_dsa(action="start")

4. 验证服务：
   deploy_dsa(action="status")
```

---

## 📁 文件结构

```
src/
├── python-check.ts    # ✨ 新增：Python 版本检测
├── verify.ts          # ✨ 新增：安装验证
├── keywords.ts        # 简单关键词
└── api-client.ts      # 简单 API 调用

index.ts               # 🔄 更新：分步安装流程
```

---

## ✅ 验收标准

1. **Python 3.9 用户：** 清晰的版本错误提示
2. **Python 3.10+ 用户：** 一键安装成功
3. **网络问题：** 友好的错误提示 + 解决步骤
4. **安装完成：** 自动验证 + 配置引导
5. **代码量：** 保持 <400 行

---

## 🚀 实施顺序

1. ✅ 创建 `src/python-check.ts`
2. ✅ 创建 `src/verify.ts`
3. ✅ 更新 `index.ts` 安装流程
4. ✅ 测试 Python 3.9 和 3.10+ 场景
5. ✅ 更新 README 文档
