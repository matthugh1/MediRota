#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface DemoOptions {
  schedule?: string;
  outputDir?: string;
}

class DemoRunner {
  private options: DemoOptions;
  private timestamp: string;
  private bundlePath: string;

  constructor(options: DemoOptions = {}) {
    this.options = {
      schedule: 'sched-demo-14d',
      ...options
    };
    
    // Generate timestamp for bundle directory
    const now = new Date();
    this.timestamp = now.toISOString()
      .replace(/[:.]/g, '')
      .replace('T', '-')
      .slice(0, 15); // YYYYMMDD-HHMMSS format
    
    this.bundlePath = join(process.cwd(), 'debug', 'demo-bundle', this.timestamp);
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
      info: 'ℹ',
      success: '✔',
      error: '✖',
      warn: '⚠'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  private runCommand(command: string, description: string): void {
    this.log(`Running: ${description}`);
    try {
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      this.log(`Completed: ${description}`, 'success');
    } catch (error) {
      this.log(`Failed: ${description}`, 'error');
      throw error;
    }
  }

  private checkEnvironment(): void {
    this.log('Checking environment...');
    
    // Guard against production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot run demo in production environment');
    }
    
    // Check if we're in the backend directory
    if (!existsSync('package.json')) {
      throw new Error('Must run from backend directory');
    }
    
    this.log('Environment check passed', 'success');
  }

  private async checkBackendHealth(): Promise<void> {
    this.log('Checking backend health...');
    
    try {
      // Try to ping the health endpoint
      execSync('curl -s http://localhost:3000/healthz > /dev/null', { stdio: 'pipe' });
      this.log('Backend is running', 'success');
    } catch (error) {
      this.log('Backend not running, starting it...', 'warn');
      this.runCommand('npm run start:dev', 'Starting backend server');
      
      // Wait a bit for the server to start
      this.log('Waiting for backend to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check again
      try {
        execSync('curl -s http://localhost:3000/healthz > /dev/null', { stdio: 'pipe' });
        this.log('Backend started successfully', 'success');
      } catch (error) {
        throw new Error('Failed to start backend server');
      }
    }
  }

  private resetDatabase(): void {
    this.log('Resetting database...');
    
    // Clear database
    this.runCommand('npm run db:clear', 'Clearing database');
    
    // Run migrations
    this.runCommand('npx prisma migrate deploy', 'Running database migrations');
    
    // Seed database
    this.runCommand('npm run db:seed', 'Seeding database with demo data');
  }

  private runSolverTest(): void {
    this.log(`Running solver test for schedule: ${this.options.schedule}`);
    
    // Create the bundle directory
    mkdirSync(this.bundlePath, { recursive: true });
    
    // Run the e2e test
    const pythonCommand = `python3 ../e2e_tests/run_e2e_test.py --schedule ${this.options.schedule} --outdir "${this.bundlePath}"`;
    this.runCommand(pythonCommand, 'Running end-to-end solver test');
  }

  private copyArtifacts(): void {
    this.log('Copying artifacts to bundle...');
    
    const sourceFiles = [
      'solver_request.json',
      'solver_response.json', 
      'solver_debug_last.json',
      'summary.txt'
    ];
    
    const csvFiles = [
      'per_cell_coverage.csv',
      'per_date_coverage.csv',
      'staff_hours.csv'
    ];
    
    let copiedCount = 0;
    
    // Copy main files
    for (const file of sourceFiles) {
      const sourcePath = join(process.cwd(), file);
      const destPath = join(this.bundlePath, file);
      
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        copiedCount++;
        this.log(`Copied: ${file}`);
      } else {
        this.log(`Warning: ${file} not found`, 'warn');
      }
    }
    
    // Copy CSV files from csv subdirectory
    for (const file of csvFiles) {
      const sourcePath = join(process.cwd(), 'csv', file);
      const destPath = join(this.bundlePath, file);
      
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        copiedCount++;
        this.log(`Copied: csv/${file}`);
      } else {
        this.log(`Warning: csv/${file} not found`, 'warn');
      }
    }
    
    this.log(`Copied ${copiedCount} files to bundle`, 'success');
  }

  private async generateBundleSummary(): Promise<void> {
    this.log('Generating bundle summary...');
    
    const files = readdirSync(this.bundlePath);
    const summary = {
      timestamp: this.timestamp,
      schedule: this.options.schedule,
      bundlePath: this.bundlePath,
      fileCount: files.length,
      files: files
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('🗄️  DATABASE RESET SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Bundle Path: ${this.bundlePath}`);
    console.log(`📅 Timestamp: ${this.timestamp}`);
    console.log(`📋 Schedule: ${this.options.schedule}`);
    console.log(`📄 Files: ${summary.fileCount}`);
    
    if (files.length > 0) {
      console.log(`📊 Contents:`);
      const fs = await import('fs');
      for (const file of files) {
        const size = fs.statSync(join(this.bundlePath, file)).size;
        console.log(`   • ${file} (${size} bytes)`);
      }
    } else {
      console.log(`📊 Contents: No files (database reset only)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database reset completed successfully!');
    console.log(`📦 Bundle ready at: ${this.bundlePath}`);
    console.log('='.repeat(60) + '\n');
  }

  async run(): Promise<void> {
    try {
      this.log('🚀 Starting MediRota Demo Pipeline');
      this.log(`📋 Schedule: ${this.options.schedule}`);
      this.log(`📁 Bundle: ${this.bundlePath}`);
      
      // Step 1: Environment check
      this.checkEnvironment();
      
      // Step 2: Check/start backend
      await this.checkBackendHealth();
      
      // Step 3: Reset database
      this.resetDatabase();
      
      // Step 4: Skip solver test (user requested)
      this.log('Skipping solver test as requested');
      
      // Create bundle directory for summary
      mkdirSync(this.bundlePath, { recursive: true });
      
      // Step 5: Run audit
      this.log('Running seed audit...');
      this.runCommand('npm run db:audit:seed', 'Running seed audit');
      
      // Step 6: Generate summary
      await this.generateBundleSummary();
      
    } catch (error) {
      this.log(`Demo failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): DemoOptions {
  const args = process.argv.slice(2);
  const options: DemoOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--schedule' && i + 1 < args.length) {
      options.schedule = args[i + 1];
      i++; // Skip next argument
    } else if (args[i] === '--output' && i + 1 < args.length) {
      options.outputDir = args[i + 1];
      i++; // Skip next argument
    }
  }
  
  return options;
}

// Main execution
async function main() {
  console.log('🚀 Starting make-demo script...');
  const options = parseArgs();
  console.log('Options:', options);
  const runner = new DemoRunner(options);
  await runner.run();
}

// Always run main
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { DemoRunner };
