#!/usr/bin/env node

import { startMonitoring } from "./monitor";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Claude Code Router Monitor - Standalone Terminal Monitoring Tool

Usage: ccr-monitor [options]

Options:
  -h, --help     Show help information
  
Description:
  This tool provides real-time monitoring of Claude Code Router usage,
  including API calls, token counts, and cost estimates.

  Make sure claude-code-router is running with logging enabled for
  this tool to display data.

Examples:
  ccr-monitor        Start monitoring in real-time
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