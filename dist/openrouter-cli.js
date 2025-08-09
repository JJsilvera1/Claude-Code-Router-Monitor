#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOpenRouterMonitor = startOpenRouterMonitor;
const openrouter_monitor_1 = require("./openrouter-monitor");
const openrouter_display_1 = require("./openrouter-display");
const openrouter_monitor_2 = require("./openrouter-monitor");
let lastData = [];
let lastUpdateTime = 0;
async function monitorLoop() {
    try {
        // Update usage data
        await (0, openrouter_monitor_1.updateUsageData)();
        // Load the latest data for display
        const currentData = (0, openrouter_monitor_2.loadUsageData)();
        // Update display
        await (0, openrouter_display_1.updateDisplay)(currentData);
        lastData = currentData;
        lastUpdateTime = Date.now();
    }
    catch (error) {
        console.error("Error in monitor loop:", error);
    }
}
async function startOpenRouterMonitor(shutdownCallback) {
    console.log("Starting OpenRouter Monitor...");
    // Start the display system
    await (0, openrouter_display_1.startMonitoring)(shutdownCallback);
    // Initial data fetch and display
    await monitorLoop();
    // Set up monitoring loop (every 5 minutes)
    const monitorInterval = setInterval(async () => {
        await monitorLoop();
    }, 300000); // 5 minutes
    // Also update display every 30 seconds even if data hasn't changed
    const displayInterval = setInterval(async () => {
        const currentData = (0, openrouter_monitor_2.loadUsageData)();
        await (0, openrouter_display_1.updateDisplay)(currentData);
    }, 30000); // 30 seconds
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        clearInterval(monitorInterval);
        clearInterval(displayInterval);
        console.log('\n\nOpenRouter Monitor stopped.');
        if (shutdownCallback) {
            shutdownCallback();
        }
        process.exit(0);
    });
}
// If this file is run directly
if (require.main === module) {
    startOpenRouterMonitor();
}
