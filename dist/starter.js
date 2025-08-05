#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const monitor_1 = require("./monitor");
const path_1 = __importDefault(require("path"));
let logParserProcess = null;
function startLogParser() {
    const parserScript = path_1.default.resolve(__dirname, 'log-parser.js');
    const child = (0, child_process_1.spawn)(process.execPath, [parserScript], {
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
    await (0, monitor_1.startMonitoring)(() => {
        if (logParserProcess && logParserProcess.pid) {
            try {
                process.kill(logParserProcess.pid);
                console.log("Log parser process terminated.");
            }
            catch (e) {
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
