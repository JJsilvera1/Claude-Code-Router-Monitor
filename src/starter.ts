#!/usr/bin/env node
import { spawn, ChildProcess } from 'child_process';
import { startMonitoring } from './monitor';
import path from 'path';

let logParserProcess: ChildProcess | null = null;

function startLogParser(): ChildProcess {
  const parserScript = path.resolve(__dirname, 'log-parser.js');
  
  const child = spawn(process.execPath, [parserScript], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  return child;
}

async function main() {
  console.log("Starting unified CCR service...");

  logParserProcess = startLogParser();
  console.log(`Log parser process started with PID: ${logParserProcess.pid}`);
  
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
    process.kill(logParserProcess.pid);
  }
  process.exit(1);
});
