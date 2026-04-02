#!/usr/bin/env node

/**
 * Daily Stock Analysis OpenClaw Plugin - Docker Deployment Script
 * 
 * Usage:
 *   node install.js              # Interactive installation
 *   node install.js --install    # Silent install
 *   node install.js --start      # Start service
 *   node install.js --stop       # Stop service
 *   node install.js --status     # Check status
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSTALL_DIR = join(process.env.HOME || '', '.openclaw/external-services/daily_stock_analysis');

const REPO_URL = 'https://github.com/ZhuLinsen/daily_stock_analysis.git';

function runCommand(command, cwd) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker-compose --version', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('❌ Docker or Docker Compose not found');
    console.error('Please install Docker: https://docs.docker.com/get-docker/');
    return false;
  }
}

function checkService() {
  try {
    const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health', {
      encoding: 'utf-8'
    });
    return response.trim() === '200';
  } catch {
    return false;
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function interactiveInstall() {
  console.log('🚀 Daily Stock Analysis OpenClaw Plugin - Docker Installation\n');

  // Check Docker
  if (!checkDocker()) {
    process.exit(1);
  }

  // Check if already installed
  if (existsSync(INSTALL_DIR)) {
    const answer = await askQuestion(`⚠️  ${INSTALL_DIR} already exists. Overwrite? (y/N): `);
    if (answer.toLowerCase() !== 'y') {
      console.log('Installation cancelled');
      process.exit(0);
    }
    execSync(`rm -rf ${INSTALL_DIR}`);
  }

  // Clone repository
  console.log('📦 Cloning repository...');
  mkdirSync(dirname(INSTALL_DIR), { recursive: true });
  runCommand(`git clone ${REPO_URL} ${INSTALL_DIR}`);

  // Create .env
  const envExample = join(INSTALL_DIR, '.env.example');
  const envFile = join(INSTALL_DIR, '.env');
  
  if (existsSync(envExample)) {
    console.log('📝 Creating .env file...');
    copyFileSync(envExample, envFile);
    console.log(`✅ .env created at ${envFile}`);
    console.log('\n📋 Next steps:');
    console.log(`1. Edit ${envFile} to configure:`);
    console.log('   - STOCK_LIST (your stock codes)');
    console.log('   - LLM API Key (Gemini/Claude/OpenAI/etc)');
    console.log('   - Notification channels (optional)');
    console.log('2. Run: node install.js --start');
    console.log('3. Access: http://localhost:8000');
  }

  console.log('\n✅ Installation complete!');
}

async function checkPython() {
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

async function pythonInstall() {
  console.log('🚀 Daily Stock Analysis - Python Installation (No Docker)\n');

  // Check Python
  if (!checkPython()) {
    console.error('❌ Python not found');
    console.error('Please install Python 3.10+: https://www.python.org/downloads/');
    process.exit(1);
  }

  // Check if already installed
  if (existsSync(INSTALL_DIR)) {
    const answer = await askQuestion(`⚠️  ${INSTALL_DIR} already exists. Overwrite? (y/N): `);
    if (answer.toLowerCase() !== 'y') {
      console.log('Installation cancelled');
      process.exit(0);
    }
    execSync(`rm -rf ${INSTALL_DIR}`);
  }

  // Clone repository
  console.log('📦 Cloning repository...');
  mkdirSync(dirname(INSTALL_DIR), { recursive: true });
  runCommand(`git clone ${REPO_URL} ${INSTALL_DIR}`);

  // Create virtual environment
  console.log('🐍 Creating virtual environment...');
  runCommand('python3 -m venv venv', INSTALL_DIR);

  // Install dependencies
  console.log('📦 Installing dependencies (this may take a few minutes)...');
  const pip = process.platform === 'win32' ? 'venv\\Scripts\\pip' : 'venv/bin/pip';
  runCommand(`${pip} install --upgrade pip`, INSTALL_DIR);
  runCommand(`${pip} install -r requirements.txt`, INSTALL_DIR);

  // Create .env
  const envExample = join(INSTALL_DIR, '.env.example');
  const envFile = join(INSTALL_DIR, '.env');
  
  if (existsSync(envExample)) {
    console.log('📝 Creating .env file...');
    copyFileSync(envExample, envFile);
    console.log(`✅ .env created at ${envFile}`);
  }

  console.log('\n✅ Installation complete!');
  console.log('\n📋 Next steps:');
  console.log(`1. Edit ${envFile} to configure:`);
  console.log('   - STOCK_LIST (your stock codes)');
  console.log('   - LLM API Key (Gemini/Claude/OpenAI/etc)');
  console.log('   - Notification channels (optional)');
  console.log(`2. Run: node install.js --start-python`);
  console.log('3. Access: http://localhost:8000');
  console.log('\n💡 Start commands:');
  console.log('   node install.js --start-python    # Start Python service');
  console.log('   node install.js --start-webui     # Start with Web UI');
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || '--install';

  const hasDocker = checkDocker();
  const hasPython = checkPython();

  switch (action) {
    case '--install':
    case '-i':
      // Auto-detect and choose installation method
      if (hasDocker) {
        console.log('✅ Docker detected, using Docker installation...\n');
        await interactiveInstall();
      } else if (hasPython) {
        console.log('✅ Python detected, using Python installation...\n');
        await pythonInstall();
      } else {
        console.error('❌ Neither Docker nor Python found');
        console.error('Please install either:');
        console.error('  - Docker: https://www.docker.com/products/docker-desktop/');
        console.error('  - Python 3.10+: https://www.python.org/downloads/');
        process.exit(1);
      }
      break;

    case '--install-docker':
      await interactiveInstall();
      break;

    case '--install-python':
      await pythonInstall();
      break;

    case '--start':
    case '--start-docker':
      if (!hasDocker) {
        console.error('❌ Docker not found');
        process.exit(1);
      }
      console.log('🚀 Starting DSA service (Docker)...');
      runCommand('docker-compose up -d', INSTALL_DIR);
      setTimeout(() => {
        if (checkService()) {
          console.log('✅ Service started successfully!');
          console.log('🌐 Access: http://localhost:8000');
        } else {
          console.log('⚠️  Service may still be starting, please wait...');
        }
      }, 5000);
      break;

    case '--start-python':
      if (!hasPython) {
        console.error('❌ Python not found');
        process.exit(1);
      }
      console.log('🚀 Starting DSA service (Python)...');
      console.log('📋 Running: python main.py');
      console.log('⚠️  This will run in foreground. Press Ctrl+C to stop.');
      console.log('💡 For background mode, use: nohup venv/bin/python main.py &');
      const pip = process.platform === 'win32' ? 'venv\\Scripts\\python' : 'venv/bin/python';
      runCommand(`${pip} main.py`, INSTALL_DIR);
      break;

    case '--start-webui':
      if (!hasPython) {
        console.error('❌ Python not found');
        process.exit(1);
      }
      console.log('🚀 Starting DSA service with Web UI...');
      console.log('📋 Running: python main.py --webui');
      const pip2 = process.platform === 'win32' ? 'venv\\Scripts\\python' : 'venv/bin/python';
      runCommand(`${pip2} main.py --webui`, INSTALL_DIR);
      break;

    case '--stop':
    case '--stop-docker':
      console.log('🛑 Stopping DSA service...');
      runCommand('docker-compose stop', INSTALL_DIR);
      console.log('✅ Service stopped');
      break;

    case '--status':
      console.log('📊 DSA Service Status:\n');
      try {
        if (hasDocker && existsSync(join(INSTALL_DIR, 'docker-compose.yml'))) {
          console.log('Docker Compose:');
          runCommand('docker-compose ps', INSTALL_DIR);
        }
      } catch {}
      
      const running = checkService();
      console.log(`\nAPI Health: ${running ? '✅ Running' : '❌ Stopped'}`);
      console.log('URL: http://localhost:8000');
      break;

    case '--uninstall':
      const answer = await askQuestion('⚠️  This will remove DSA service and data. Continue? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Uninstall cancelled');
        process.exit(0);
      }
      console.log('🗑️  Uninstalling...');
      try {
        runCommand('docker-compose down', INSTALL_DIR);
      } catch {}
      execSync(`rm -rf ${INSTALL_DIR}`);
      console.log('✅ Uninstall complete');
      break;

    case '--help':
    case '-h':
      console.log(`
Daily Stock Analysis OpenClaw Plugin - Installation Script

Usage:
  node install.js [option]

Options:
  --install, -i       Auto-detect and install (Docker or Python)
  --install-docker    Install with Docker
  --install-python    Install with Python (no Docker required)
  --start             Start Docker service
  --start-docker      Start Docker service
  --start-python      Start Python service (foreground)
  --start-webui       Start with Web UI
  --stop              Stop Docker service
  --status            Check service status
  --uninstall         Uninstall service
  --help, -h          Show this help

Quick Start (Docker):
  1. node install.js --install
  2. Edit ~/.openclaw/external-services/daily_stock_analysis/.env
  3. node install.js --start
  4. Access http://localhost:8000

Quick Start (Python):
  1. node install.js --install-python
  2. Edit ~/.openclaw/external-services/daily_stock_analysis/.env
  3. node install.js --start-python
  4. Access http://localhost:8000
`);
      break;

    default:
      console.error(`Unknown option: ${action}`);
      console.error('Run: node install.js --help');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
