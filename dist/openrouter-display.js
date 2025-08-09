"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDisplay = updateDisplay;
exports.startMonitoring = startMonitoring;
const formatter_1 = require("./formatter");
function aggregateStats(data) {
    if (data.length === 0) {
        return {
            totalRequests: 0,
            totalUsage: 0,
            totalLimit: 0,
            averageUsagePerKey: 0,
            keysWithUsage: 0,
            disabledKeys: 0,
            byKeyStatus: {
                active: { count: 0, usage: 0, limit: 0 },
                disabled: { count: 0, usage: 0, limit: 0 }
            }
        };
    }
    // Use the most recent data for current stats
    const latest = data[data.length - 1];
    const keysWithUsage = latest.keys.filter(key => key.usage > 0).length;
    const disabledKeys = latest.keys.filter(key => key.disabled).length;
    const activeKeys = latest.keys.filter(key => !key.disabled);
    const disabledKeysList = latest.keys.filter(key => key.disabled);
    return {
        totalRequests: data.length,
        totalUsage: latest.totalUsage,
        totalLimit: latest.totalLimit,
        averageUsagePerKey: latest.totalKeys > 0 ? latest.totalUsage / latest.totalKeys : 0,
        keysWithUsage,
        disabledKeys,
        byKeyStatus: {
            active: {
                count: activeKeys.length,
                usage: activeKeys.reduce((sum, key) => sum + key.usage, 0),
                limit: activeKeys.reduce((sum, key) => sum + key.limit, 0)
            },
            disabled: {
                count: disabledKeysList.length,
                usage: disabledKeysList.reduce((sum, key) => sum + key.usage, 0),
                limit: disabledKeysList.reduce((sum, key) => sum + key.limit, 0)
            }
        }
    };
}
function displayHeader() {
    console.log("\x1b[1m\x1b[34m");
    console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
    console.log("║                         OpenRouter Usage Monitor                                 ║");
    console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
    console.log("\x1b[0m");
}
function displayFooter() {
    const timestamp = new Date().toLocaleString();
    console.log(`\x1b[90mLast updated: ${timestamp}\x1b[0m`);
}
function displaySummary(data, aggregated) {
    console.log("\x1b[1mSummary:\x1b[0m");
    console.log(`  Total Monitoring Requests: \x1b[33m${aggregated.totalRequests.toString()}\x1b[0m`);
    console.log(`  Total API Keys: \x1b[33m${data.length > 0 ? data[data.length - 1].totalKeys.toString() : '0'}\x1b[0m`);
    console.log(`  Total Usage: \x1b[33m${(0, formatter_1.formatCost)(aggregated.totalUsage)}\x1b[0m`);
    console.log(`  Total Limit: \x1b[33m${(0, formatter_1.formatCost)(aggregated.totalLimit)}\x1b[0m`);
    console.log(`  Credits Remaining: \x1b[33m${(0, formatter_1.formatCost)(data.length > 0 ? data[data.length - 1].creditsRemaining : 0)}\x1b[0m`);
    console.log();
}
function displayKeyBreakdown(data, aggregated) {
    console.log("\x1b[1mKey Status Breakdown:\x1b[0m");
    if (data.length === 0) {
        console.log("  No data available");
        return;
    }
    const latest = data[data.length - 1];
    console.log(`  \x1b[32mActive Keys (${aggregated.byKeyStatus.active.count}):\x1b[0m`);
    console.log(`    Usage: \x1b[36m${(0, formatter_1.formatCost)(aggregated.byKeyStatus.active.usage)}\x1b[0m`);
    console.log(`    Limit: \x1b[36m${(0, formatter_1.formatCost)(aggregated.byKeyStatus.active.limit)}\x1b[0m`);
    console.log(`    Available: \x1b[36m${(0, formatter_1.formatCost)(aggregated.byKeyStatus.active.limit - aggregated.byKeyStatus.active.usage)}\x1b[0m`);
    if (aggregated.byKeyStatus.disabled.count > 0) {
        console.log(`  \x1b[31mDisabled Keys (${aggregated.byKeyStatus.disabled.count}):\x1b[0m`);
        console.log(`    Usage: \x1b[36m${(0, formatter_1.formatCost)(aggregated.byKeyStatus.disabled.usage)}\x1b[0m`);
        console.log(`    Limit: \x1b[36m${(0, formatter_1.formatCost)(aggregated.byKeyStatus.disabled.limit)}\x1b[0m`);
    }
    console.log();
}
function displayIndividualKeys(data) {
    if (data.length === 0) {
        return;
    }
    const latest = data[data.length - 1];
    const sortedKeys = [...latest.keys]
        .filter(key => !key.disabled)
        .sort((a, b) => b.usage - a.usage);
    if (sortedKeys.length === 0) {
        return;
    }
    console.log("\x1b[1mIndividual Key Usage:\x1b[0m");
    sortedKeys.forEach(key => {
        const remaining = key.limit - key.usage;
        const usagePercent = key.limit > 0 ? (key.usage / key.limit) * 100 : 0;
        const progressBarWidth = 20;
        const filledBars = Math.floor((usagePercent / 100) * progressBarWidth);
        const emptyBars = progressBarWidth - filledBars;
        let progressBar = '\x1b[90m';
        for (let i = 0; i < progressBarWidth; i++) {
            if (i < filledBars) {
                progressBar += usagePercent > 80 ? '\x1b[31m█\x1b[90m' : usagePercent > 50 ? '\x1b[33m█\x1b[90m' : '\x1b[32m█\x1b[90m';
            }
            else {
                progressBar += '░';
            }
        }
        progressBar += '\x1b[0m';
        console.log(`  \x1b[32m${key.name || key.label || 'Unnamed Key'}\x1b[0m:`);
        console.log(`    Usage: \x1b[36m${(0, formatter_1.formatCost)(key.usage)}\x1b[0m / \x1b[36m${(0, formatter_1.formatCost)(key.limit)}\x1b[0m (\x1b[36m${usagePercent.toFixed(1)}%\x1b[0m)`);
        console.log(`    Remaining: \x1b[36m${(0, formatter_1.formatCost)(remaining)}\x1b[0m`);
        console.log(`    ${progressBar}`);
        console.log();
    });
}
function displayUsageHistory(data) {
    if (data.length < 2) {
        return;
    }
    console.log("\x1b[1mRecent Usage History:\x1b[0m");
    // Show last 10 data points
    const recentData = data.slice(-10).reverse();
    recentData.forEach((entry, index) => {
        const usageChange = index < recentData.length - 1 ?
            entry.totalUsage - recentData[index + 1].totalUsage : 0;
        const changeStr = usageChange > 0 ? ` (+${(0, formatter_1.formatCost)(usageChange)})` : '';
        console.log(`  \x1b[2m[${(0, formatter_1.formatTimeAgo)(entry.timestamp)}]\x1b[0m` +
            ` \x1b[36m${(0, formatter_1.formatCost)(entry.totalUsage)}\x1b[0m` +
            ` used of \x1b[36m${(0, formatter_1.formatCost)(entry.totalLimit)}\x1b[0m` +
            ` \x1b[33m${(0, formatter_1.formatCost)(entry.creditsRemaining)}\x1b[0m left` +
            `${changeStr}`);
    });
    console.log();
}
function displayAlerts(data, aggregated) {
    if (data.length === 0) {
        return;
    }
    const latest = data[data.length - 1];
    const usagePercent = latest.totalLimit > 0 ? (latest.totalUsage / latest.totalLimit) * 100 : 0;
    let hasAlerts = false;
    if (usagePercent >= 80) {
        hasAlerts = true;
        console.log(`\x1b[1m\x1b[31m⚠️  HIGH USAGE ALERT: ${usagePercent.toFixed(1)}% of credits used\x1b[0m`);
    }
    if (latest.creditsRemaining < 10) {
        hasAlerts = true;
        console.log(`\x1b[1m\x1b[31m⚠️  LOW CREDITS: Only ${(0, formatter_1.formatCost)(latest.creditsRemaining)} remaining\x1b[0m`);
    }
    // Check for any keys approaching their individual limits
    const nearLimitKeys = latest.keys.filter(key => !key.disabled &&
        key.limit > 0 &&
        (key.usage / key.limit) >= 0.8);
    nearLimitKeys.forEach(key => {
        hasAlerts = true;
        const keyUsagePercent = (key.usage / key.limit) * 100;
        console.log(`\x1b[1m\x1b[33m⚠️  Key '${key.name || key.label}' at ${keyUsagePercent.toFixed(1)}% limit\x1b[0m`);
    });
    if (hasAlerts) {
        console.log();
    }
}
let lastData = [];
let lastUpdateTime = 0;
async function updateDisplay(data) {
    if (!data || data.length === 0) {
        (0, formatter_1.clearScreen)();
        displayHeader();
        console.log("No OpenRouter usage data available yet.");
        console.log();
        console.log("Please ensure you have:");
        console.log("1. Set up your OpenRouter provisioning API key");
        console.log("2. Run: ccr-openrouter-monitor --setup");
        console.log("3. Start the monitoring service");
        console.log();
        displayFooter();
        return;
    }
    // Check if data has changed or if enough time has passed
    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTime;
    if (JSON.stringify(data) !== JSON.stringify(lastData) || timeSinceLastUpdate > 30000) {
        (0, formatter_1.clearScreen)();
        displayHeader();
        const aggregated = aggregateStats(data);
        displayAlerts(data, aggregated);
        displaySummary(data, aggregated);
        displayKeyBreakdown(data, aggregated);
        displayIndividualKeys(data);
        displayUsageHistory(data);
        displayFooter();
        lastData = data;
        lastUpdateTime = currentTime;
    }
}
async function startMonitoring(shutdownCallback) {
    console.log("Starting OpenRouter monitoring display...");
    // Clear screen and display initial data
    (0, formatter_1.clearScreen)();
    displayHeader();
    // Initial update will be called by the monitor
    // Update every 30 seconds for display
    setInterval(() => {
        // The actual data update is handled by the monitor
    }, 30000);
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n\nOpenRouter monitoring display stopped.');
        if (shutdownCallback) {
            shutdownCallback();
        }
        process.exit(0);
    });
}
