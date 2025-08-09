#!/usr/bin/env node
import { updateUsageData } from "./openrouter-monitor";
import { startMonitoring, updateDisplay } from "./openrouter-display";
import { loadUsageData } from "./openrouter-monitor";

let lastData: any[] = [];
let lastUpdateTime: number = 0;

async function monitorLoop() {
    try {
        // Update usage data
        await updateUsageData();
        
        // Load the latest data for display
        const currentData = loadUsageData();
        
        // Update display
        await updateDisplay(currentData);
        
        lastData = currentData;
        lastUpdateTime = Date.now();
    } catch (error) {
        console.error("Error in monitor loop:", error);
    }
}

export async function startOpenRouterMonitor(shutdownCallback?: () => void) {
    console.log("Starting OpenRouter Monitor...");
    
    // Start the display system
    await startMonitoring(shutdownCallback);
    
    // Initial data fetch and display
    await monitorLoop();
    
    // Set up monitoring loop (every 5 minutes)
    const monitorInterval = setInterval(async () => {
        await monitorLoop();
    }, 300000); // 5 minutes
    
    // Also update display every 30 seconds even if data hasn't changed
    const displayInterval = setInterval(async () => {
        const currentData = loadUsageData();
        await updateDisplay(currentData);
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