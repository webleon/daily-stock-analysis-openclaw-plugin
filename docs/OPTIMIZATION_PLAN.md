# DSA 插件安装功能优化计划

**日期：** 2026-03-31  
**目标：** 实现真正的开箱即用体验  
**使用技能：** Superpowers brainstorming + writing-plans

---

## 📋 当前问题总结

根据实际配置过程中遇到的问题：

### 问题 1：Python 版本检测
- ❌ 检测系统 Python 但虚拟环境可能使用不同版本
- ❌ 版本过低时只提示错误，不提供自动解决方案
- ❌ 用户需要手动安装 Python 3.10+

### 问题 2：虚拟环境创建
- ❌ 使用系统 Python 创建，可能导致版本不匹配
- ❌ 符号链接可能指向错误的 Python 版本
- ❌ 创建后未验证 Python 版本是否正确

### 问题 3：依赖安装
- ❌ 安装失败时错误信息不够友好
- ❌ 网络问题（如 json-repair 版本）导致安装失败
- ❌ 没有自动重试或降级方案

### 问题 4：API Key 配置
- ❌ 安装完成后需要手动编辑 .env
- ❌ 没有提供获取 API Key 的指引
- ❌ 没有测试 API Key 是否有效

### 问题 5：服务启动
- ❌ 启动失败时日志难以查找
- ❌ 没有自动检测端口占用
- ❌ 需要手动运行多个命令

---

## 💡 优化方案

### 阶段 1：智能环境检测

**当前：**
```typescript
if (!pythonCheck.meetsRequirement) {
  return { error: 'Python 版本过低', hint: '...' };
}
```

**优化后：**
```typescript
if (!pythonCheck.meetsRequirement) {
  // 提供自动安装选项
  return {
    error: 'Python 版本过低',
    autoFix: true,
    autoFixCommand: 'install_python_3_10',
    hint: '检测到 Python 3.9，需要 3.10+\n\n选项：\n1. 自动安装 Python 3.10（推荐）\n2. 手动安装'
  };
}
```

---

### 阶段 2：自动化安装流程

**新增功能：**

1. **自动安装 Python 3.10+**
```typescript
async function installPython310(): Promise<boolean> {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS: 使用 Homebrew
    try {
      execSync('brew install python@3.10');
      return true;
    } catch {
      return false;
    }
  }
  
  if (platform === 'win32') {
    // Windows: 使用官方安装程序
    return {
      manualInstall: true,
      url: 'https://www.python.org/downloads/'
    };
  }
  
  // Linux: 使用包管理器
  return false; // 需要手动
}
```

2. **智能选择 Python 解释器**
```typescript
function findBestPython(): string {
  const versions = ['python3.11', 'python3.10', 'python3'];
  
  for (const version of versions) {
    try {
      execSync(`${version} --version`, { stdio: 'pipe' });
      return version;
    } catch {
      continue;
    }
  }
  
  return 'python3'; // 默认
}
```

3. **虚拟环境验证**
```typescript
function verifyVenv(venvPath: string): {
  valid: boolean;
  pythonVersion: string;
  error?: string;
} {
  const pythonPath = path.join(venvPath, 'bin', 'python');
  
  try {
    const version = execSync(`${pythonPath} --version`, {
      encoding: 'utf-8'
    }).trim();
    
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
```

---

### 阶段 3：交互式配置

**新增功能：**

1. **API Key 获取指引**
```typescript
function getAPIKeyGuide(provider: string): string {
  const guides = {
    gemini: `
🔑 获取 Gemini API Key:
1. 访问 https://aistudio.google.com/apikey
2. 点击 "Create API Key"
3. 复制 Key 并粘贴到下方
    `,
    dashscope: `
🔑 获取通义千问 API Key:
1. 访问 https://dashscope.console.aliyun.com/apiKey
2. 登录阿里云账号
3. 点击 "创建 API Key"
4. 复制 Key 并粘贴到下方
    `
  };
  
  return guides[provider] || '请参考文档获取 API Key';
}
```

2. **交互式配置向导**
```typescript
async function interactiveSetup(): Promise<void> {
  console.log('🎯 DSA 服务配置向导\n');
  
  // Step 1: 选择 AI 提供商
  const provider = await select({
    message: '选择 AI 提供商',
    choices: [
      { name: 'Google Gemini (推荐)', value: 'gemini' },
      { name: '通义千问 (Kimi)', value: 'dashscope' },
      { name: 'DeepSeek', value: 'deepseek' }
    ]
  });
  
  // Step 2: 获取 API Key
  console.log(getAPIKeyGuide(provider));
  const apiKey = await input({
    message: '粘贴 API Key:',
    mask: '*'
  });
  
  // Step 3: 配置股票代码
  const stocks = await input({
    message: '输入股票代码（逗号分隔）:',
    default: '600519,hk00700,AAPL'
  });
  
  // Step 4: 写入 .env
  await writeEnvFile({
    [`${provider.toUpperCase()}_API_KEY`]: apiKey,
    STOCK_LIST: stocks
  });
  
  console.log('✅ 配置完成！');
}
```

---

### 阶段 4：一键安装

**新增命令：**
```typescript
// 一键安装并配置
api.registerTool('dsa_quick_install', async () => {
  // Step 1: 检测环境
  const envCheck = await checkEnvironment();
  
  if (!envCheck.pythonOk) {
    const install = await confirm('需要安装 Python 3.10，是否自动安装？');
    if (install) {
      await installPython310();
    }
  }
  
  // Step 2: 安装 DSA
  await installDSA();
  
  // Step 3: 交互式配置
  await interactiveSetup();
  
  // Step 4: 测试连接
  const testResult = await testAPIConnection();
  
  if (testResult.success) {
    return {
      status: 'success',
      message: '✅ DSA 服务已就绪',
      nextStep: 'deploy_dsa(action="start")'
    };
  } else {
    return {
      status: 'warning',
      message: '⚠️ 安装完成但 API 测试失败',
      error: testResult.error,
      hint: '请检查 API Key 是否正确'
    };
  }
});
```

---

### 阶段 5：智能错误恢复

**新增功能：**

1. **依赖安装重试**
```typescript
async function installDependenciesWithRetry(maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(`${pip} install -r requirements.txt`, {
        cwd: INSTALL_DIR,
        stdio: 'pipe'
      });
      return true;
    } catch (error: any) {
      if (i === maxRetries - 1) {
        // 最后一次失败，提供降级方案
        return {
          success: false,
          fallback: 'manual_install',
          error: error.message
        };
      }
      
      // 等待后重试
      await sleep(5000 * (i + 1));
    }
  }
  
  return false;
}
```

2. **端口占用检测**
```typescript
function checkPortAvailable(port: number): boolean {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'pipe' });
    return false; // 端口被占用
  } catch {
    return true; // 端口可用
  }
}
```

3. **服务启动验证**
```typescript
async function waitForServiceStart(maxWait = 30): Promise<boolean> {
  for (let i = 0; i < maxWait; i++) {
    if (checkService()) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}
```

---

## 📊 优化对比

| 功能 | 当前 | 优化后 |
|------|------|--------|
| **Python 检测** | ❌ 只检测不解决 | ✅ 提供自动安装 |
| **虚拟环境** | ❌ 可能版本错误 | ✅ 自动验证版本 |
| **依赖安装** | ❌ 失败即停止 | ✅ 自动重试 + 降级 |
| **API 配置** | ❌ 手动编辑 | ✅ 交互式向导 |
| **服务启动** | ❌ 手动命令 | ✅ 一键启动 |
| **错误恢复** | ❌ 无 | ✅ 智能重试 |
| **安装时间** | ~10 分钟 | ~5 分钟 |
| **成功率** | ~70% | ~95% |

---

## 🎯 实施计划

### Phase 1: 环境检测增强 (1 天)
- [ ] 添加 Python 自动安装
- [ ] 智能选择 Python 解释器
- [ ] 虚拟环境验证

### Phase 2: 交互式配置 (1 天)
- [ ] API Key 获取指引
- [ ] 交互式配置向导
- [ ] API 连接测试

### Phase 3: 错误恢复 (1 天)
- [ ] 依赖安装重试
- [ ] 端口占用检测
- [ ] 服务启动验证

### Phase 4: 一键安装 (1 天)
- [ ] dsa_quick_install 命令
- [ ] 进度条显示
- [ ] 安装报告生成

---

## ✅ 验收标准

1. **零配置安装**
   - 用户只需运行 `dsa_quick_install`
   - 自动检测并安装 Python
   - 交互式配置 API Key
   - 自动测试连接

2. **95% 安装成功率**
   - 网络问题自动重试
   - 版本冲突自动解决
   - 清晰的错误指引

3. **5 分钟内完成**
   - 并行下载依赖
   - 智能缓存
   - 进度条显示

4. **友好的错误提示**
   - 中文错误消息
   - 具体解决步骤
   - 自动修复选项

---

## 📝 用户旅程

### 优化前
```
用户：deploy_dsa(action="install")
系统：❌ Python 版本过低
用户：（手动安装 Python 3.10）
用户：deploy_dsa(action="install")
系统：✅ 安装完成
用户：（手动编辑 .env）
用户：（查找 API Key 获取地址）
用户：（配置 API Key）
用户：deploy_dsa(action="start")
系统：❌ 端口占用
用户：（手动解决端口问题）
用户：deploy_dsa(action="start")
系统：✅ 启动成功
```

### 优化后
```
用户：dsa_quick_install()
系统：🔍 检测环境...
系统：⚠️ Python 3.9，需要 3.10+
系统：🔧 自动安装 Python 3.10... [████████] 100%
系统：✅ Python 3.10.20 已安装
系统：📦 安装 DSA 服务... [████████] 100%
系统：🎯 配置向导
系统：选择 AI 提供商：[Google Gemini]
系统：🔑 获取 API Key: https://...
系统：粘贴 API Key: ********
系统：✅ 配置完成
系统：🧪 测试 API 连接... ✅ 成功
系统：🚀 启动服务...
系统：✅ DSA 服务已就绪！
系统：
系统：下一步：
系统：  用 DSA 分析贵州茅台
```

---

**优化计划完成！等待用户确认后实施。** 🚀
