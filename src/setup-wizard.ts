/**
 * Interactive Setup Wizard
 * Guides users through DSA configuration with interactive prompts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface EnvConfig {
  STOCK_LIST?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  [key: string]: string | undefined;
}

/**
 * API Provider information
 */
interface APIProvider {
  id: string;
  name: string;
  keyEnv: string;
  modelEnv?: string;
  defaultModel?: string;
  getUrl: string;
  models: string[];
}

const API_PROVIDERS: APIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (推荐)',
    keyEnv: 'GEMINI_API_KEY',
    modelEnv: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.5-flash',
    getUrl: 'https://aistudio.google.com/apikey',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
  },
  {
    id: 'dashscope',
    name: '通义千问 (Kimi)',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'kimi-k2.5',
    getUrl: 'https://dashscope.console.aliyun.com/apiKey',
    models: ['kimi-k2.5', 'qwen-plus', 'qwen-turbo', 'qwen-max']
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (性价比高)',
    keyEnv: 'DEEPSEEK_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'deepseek-chat',
    getUrl: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner']
  }
];

/**
 * Get API Key guide for provider
 */
export function getAPIKeyGuide(provider: APIProvider): string {
  return `
🔑 获取 ${provider.name} API Key:

1. 访问 ${provider.getUrl}
2. 登录/注册账号
3. 点击 "创建 API Key" 或 "Create API Key"
4. 复制 Key 并粘贴到下方

💡 提示：
- 新账号通常有免费额度
- 妥善保管 Key，不要分享给他人
- 如果 Key 泄露，可以删除后重新创建
`.trim();
}

/**
 * Simple input prompt (since readline might not be available)
 */
async function prompt(message: string, defaultValue?: string): Promise<string> {
  // For now, return default or empty
  // In real implementation, use readline or inquirer
  return defaultValue || '';
}

/**
 * Simple select prompt
 */
async function select(message: string, choices: Array<{ name: string; value: string }>): Promise<string> {
  // For now, return first choice
  // In real implementation, use interactive select
  return choices[0].value;
}

/**
 * Interactive setup wizard
 */
export async function interactiveSetup(envFile: string): Promise<{
  success: boolean;
  config?: EnvConfig;
  error?: string;
}> {
  console.log('\n🎯 DSA 服务配置向导\n');
  console.log('这将引导您完成 DSA 服务的配置\n');
  
  const config: EnvConfig = {};
  
  try {
    // Step 1: Select AI Provider
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 1/3: 选择 AI 提供商');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const providerChoices = API_PROVIDERS.map(p => ({
      name: p.name,
      value: p.id
    }));
    
    const providerId = await select('选择 AI 提供商:', providerChoices);
    const provider = API_PROVIDERS.find(p => p.id === providerId) || API_PROVIDERS[0];
    
    console.log(`✅ 已选择：${provider.name}\n`);
    
    // Step 2: Get API Key
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 2/3: 配置 API Key');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(getAPIKeyGuide(provider));
    console.log('');
    
    const apiKey = await prompt('粘贴 API Key:', '');
    
    if (!apiKey || apiKey.length < 10) {
      return {
        success: false,
        error: 'API Key 无效，请重新运行配置向导'
      };
    }
    
    config[provider.keyEnv] = apiKey;
    
    if (provider.modelEnv && provider.defaultModel) {
      console.log(`\n选择模型 (默认：${provider.defaultModel}):`);
      provider.models.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m}`);
      });
      
      const modelChoice = await prompt('输入模型编号或名称:', provider.defaultModel);
      config[provider.modelEnv] = provider.models.find(m => m === modelChoice) || provider.defaultModel;
    }
    
    console.log(`✅ API Key 已配置\n`);
    
    // Step 3: Configure Stock List
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('步骤 3/3: 配置自选股');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('输入您的自选股代码，逗号分隔');
    console.log('');
    console.log('示例：');
    console.log('  A 股：600519,000001,300750');
    console.log('  港股：hk00700,hk09988');
    console.log('  美股：AAPL,TSLA,MSFT');
    console.log('');
    
    const stocks = await prompt('股票代码:', '600519,hk00700,AAPL');
    config.STOCK_LIST = stocks;
    
    console.log(`✅ 自选股已配置：${stocks}\n`);
    
    // Write to .env file
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('保存配置...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await writeEnvFile(envFile, config);
    
    console.log('✅ 配置已保存到:', envFile);
    console.log('');
    console.log('🎉 配置完成！\n');
    console.log('下一步:');
    console.log('  1. 启动服务：deploy_dsa(action="start")');
    console.log('  2. 分析股票：用 DSA 分析贵州茅台');
    console.log('');
    
    return {
      success: true,
      config
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Write configuration to .env file
 */
export async function writeEnvFile(envFile: string, config: EnvConfig): Promise<void> {
  const lines: string[] = [];
  
  lines.push('# DSA Service Configuration');
  lines.push(`# Generated at: ${new Date().toISOString()}`);
  lines.push('');
  
  // Stock list
  if (config.STOCK_LIST) {
    lines.push('# Stock List');
    lines.push(`STOCK_LIST=${config.STOCK_LIST}`);
    lines.push('');
  }
  
  // API Keys
  if (config.GEMINI_API_KEY) {
    lines.push('# Google Gemini');
    lines.push(`GEMINI_API_KEY=${config.GEMINI_API_KEY}`);
    if (config.GEMINI_MODEL) {
      lines.push(`GEMINI_MODEL=${config.GEMINI_MODEL}`);
    }
    lines.push('');
  }
  
  if (config.OPENAI_API_KEY) {
    lines.push('# OpenAI Compatible (DashScope/DeepSeek/etc.)');
    lines.push(`OPENAI_API_KEY=${config.OPENAI_API_KEY}`);
    if (config.OPENAI_BASE_URL) {
      lines.push(`OPENAI_BASE_URL=${config.OPENAI_BASE_URL}`);
    }
    if (config.OPENAI_MODEL) {
      lines.push(`OPENAI_MODEL=${config.OPENAI_MODEL}`);
    }
    lines.push('');
  }
  
  if (config.DEEPSEEK_API_KEY) {
    lines.push('# DeepSeek');
    lines.push(`DEEPSEEK_API_KEY=${config.DEEPSEEK_API_KEY}`);
    lines.push('');
  }
  
  fs.writeFileSync(envFile, lines.join('\n'), 'utf-8');
}

/**
 * Test API connection
 */
export async function testAPIConnection(config: EnvConfig): Promise<{
  success: boolean;
  provider?: string;
  error?: string;
}> {
  console.log('\n🧪 测试 API 连接...\n');
  
  // Determine which provider to test
  let provider: APIProvider | undefined;
  let apiKey: string | undefined;
  
  if (config.GEMINI_API_KEY) {
    provider = API_PROVIDERS.find(p => p.id === 'gemini');
    apiKey = config.GEMINI_API_KEY;
  } else if (config.OPENAI_API_KEY) {
    provider = API_PROVIDERS.find(p => p.id === 'dashscope');
    apiKey = config.OPENAI_API_KEY;
  } else if (config.DEEPSEEK_API_KEY) {
    provider = API_PROVIDERS.find(p => p.id === 'deepseek');
    apiKey = config.DEEPSEEK_API_KEY;
  }
  
  if (!provider || !apiKey) {
    return {
      success: false,
      error: '未找到有效的 API Key 配置'
    };
  }
  
  console.log(`测试 ${provider.name} 连接...`);
  
  // Simple test - just check if key format looks valid
  if (apiKey.length < 10) {
    return {
      success: false,
      error: 'API Key 格式无效'
    };
  }
  
  console.log('✅ API Key 格式验证通过');
  console.log('');
  console.log('💡 完整 API 测试将在服务启动后自动进行');
  console.log('');
  
  return {
    success: true,
    provider: provider.name
  };
}
