#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const monitor_1 = require("./monitor");
const node_fs_1 = __importDefault(require("node:fs"));
const log_reader_1 = require("./log-reader");
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--clear') || args.includes('-c')) {
        try {
            if (node_fs_1.default.existsSync(log_reader_1.LOG_FILE)) {
                node_fs_1.default.writeFileSync(log_reader_1.LOG_FILE, "");
                console.log(`Cleared log file: ${log_reader_1.LOG_FILE}`);
            }
            if (node_fs_1.default.existsSync(log_reader_1.USAGE_DATA_FILE)) {
                node_fs_1.default.writeFileSync(log_reader_1.USAGE_DATA_FILE, "[]");
                console.log(`Cleared usage data file: ${log_reader_1.USAGE_DATA_FILE}`);
            }
            console.log("All data cleared successfully.");
            process.exit(0);
        }
        catch (error) {
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
    await (0, monitor_1.startMonitoring)();
}
main().catch(error => {
    console.error("Error starting monitor:", error);
    process.exit(1);
});
