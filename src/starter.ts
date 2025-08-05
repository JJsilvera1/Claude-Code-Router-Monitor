#!/usr/bin/env node
import { spawn, ChildProcess } from 'child_process';
import { startMonitoring } from './monitor';
import path from 'path';
import fs from 'fs';

let logParserProcess: ChildProcess | null = null;

function startLogParser(): ChildProcess {
  const parserScript = path.resolve(__dirname, 'log-parser.js');
  
  // Check if log parser script exists
  if (!fs.existsSync(parserScript)) {
    throw new Error(`Log parser script not found at: ${parserScript}`);
  }
  
  const child = spawn(process.execPath, [parserScript], {
    detached: false, // Keep attached to detect errors
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Monitor for early exit or errors
  let isProcessStarted = false;
  
  child.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Log parser is running')) {
      isProcessStarted = true;
    }
    // Re-emit the output
    process.stdout.write(output);
  });
  
  child.stderr?.on('data', (data) => {
    const errorOutput = data.toString();
    process.stderr.write(errorOutput);
    // If we get stderr output early, it might indicate a startup error
    if (!isProcessStarted) {
      console.error("Log parser encountered an error during startup:", errorOutput);
    }
  });
  
  child.on('error', (error) => {
    console.error("Failed to start log parser process:", error.message);
  });
  
  child.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.error(`Log parser process exited with code ${code}`);
    }
  });

  return child;
}

function checkLogParserHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!logParserProcess || !logParserProcess.pid) {
      resolve(false);
      return;
    }
    
    // Try to check if process is still running
    try {
      process.kill(logParserProcess.pid, 0); // Signal 0 just checks if process exists
      resolve(true);
    } catch (e) {
      resolve(false);
    }
  });
}

async function waitForLogParser(timeoutMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const isHealthy = await checkLogParserHealth();
    if (isHealthy) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

async function main() {
  console.log("Starting unified CCR service...");
  
  try {
    logParserProcess = startLogParser();
    console.log(`Log parser process started with PID: ${logParserProcess.pid}`);
    
    // Wait a moment to ensure the log parser has started
    const isParserReady = await waitForLogParser(10000);
    if (!isParserReady) {
      console.error("Warning: Log parser may not have started properly. Continuing anyway...");
    } else {
      console.log("Log parser is ready and running.");
    }
    
  } catch (error) {
    console.error("Failed to start log parser:", error instanceof Error ? error.message : error);
    console.error("Please make sure the log parser is running before starting the monitor.");
    process.exit(1);
  }
  
  await startMonitoring(() => {
    if (logParserProcess && logParserProcess.pid) {
      try {
        process.kill(logParserProcess.pid);
        console.log("Log parser process terminated.");
      } catch (e) {
        console.error("Failed to terminate log parser process:", e);
      }
    }
  });
}

main().catch(error => {
  console.error("Error starting unified service:", error);
  if (logParserProcess && logParserProcess.pid) {
    try {
      process.kill(logParserProcess.pid);
    } catch (e) {
      console.error("Failed to terminate log parser process:", e);
    }
  }
  process.exit(1);
});
