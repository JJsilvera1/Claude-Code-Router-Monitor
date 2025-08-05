#!/usr/bin/env node

import { startMonitoring } from "./monitor";
import fs from "node:fs";
import { USAGE_DATA_FILE, LOG_FILE } from "./log-reader";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--clear') || args.includes('-c')) {
    try {
      if (fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, "");
        console.log(`Cleared log file: ${LOG_FILE}`);
      }
      if (fs.existsSync(USAGE_DATA_FILE)) {
        fs.writeFileSync(USAGE_DATA_FILE, "[]");
        console.log(`Cleared usage data file: ${USAGE_DATA_FILE}`);
      }
      console.log("All data cleared successfully.");
      process.exit(0);
    } catch (error) {
      console.error("Error clearing data:", error);
      process.exit(1);
    }
  }
  
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Claude Code Router Monitor - Standalone Terminal Monitoring Tool

Usage: ccr-monitor [options]

Options:
  -h, --help     Show help information
  -c, --clear    Clear all log and usage data
  
Description:
  This tool provides real-time monitoring of Claude Code Router usage,
  including API calls, token counts, and cost estimates.

  Make sure claude-code-router is running with logging enabled for
  this tool to display data.

Examples:
  ccr-monitor        Start monitoring in real-time
  ccr-monitor --clear  Clear all log and usage data
    `);
    process.exit(0);
  }
  
  // Start the monitoring service
  await startMonitoring();
}

main().catch(error => {
  console.error("Error starting monitor:", error);
  process.exit(1);
});