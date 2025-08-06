"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDisplay = updateDisplay;
exports.startMonitoring = startMonitoring;
const log_reader_1 = require("./log-reader");
const formatter_1 = require("./formatter");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    if (gb >= 1) {
        return `${gb.toFixed(1)}GB`;
    }
    else {
        return `${mb.toFixed(1)}MB`;
    }
}
function displayLogFileSizeWarning() {
    try {
        const homeDir = os_1.default.homedir();
        const logFile = path_1.default.join(homeDir, '.claude-code-router', 'claude-code-router.log');
        if (fs_1.default.existsSync(logFile)) {
            const stats = fs_1.default.statSync(logFile);
            const fileSize = stats.size;
            const maxFileSize = 3 * 1024 * 1024 * 1024; // 3GB
            const warningThreshold = maxFileSize * 0.8; // 80% of 3GB
            console.log(`\x1b[90mCCR Log File Size: ${formatFileSize(fileSize)}\x1b[0m`);
            if (fileSize >= warningThreshold) {
                console.log(`\x1b[33m⚠️  Please wipe CCR Logfile to maintain performance with ccr-monitor --clear\x1b[0m`);
            }
        }
    }
    catch (error) {
        // Silently ignore errors for file size monitoring
    }
}
async function calculateCost(tokenCount, model, provider, inputTokens, outputTokens) {
    try {
        const config = (0, log_reader_1.readConfigFile)();
        const modelKey = `${provider},${model}`;
        // Check if pricing exists in config
        if (config && config.Pricing && config.Pricing[modelKey]) {
            const pricing = config.Pricing[modelKey];
            // Use actual input/output tokens if available, otherwise estimate
            const actualInputTokens = inputTokens || 0;
            const actualOutputTokens = outputTokens || 0;
            let inputCost, outputCost;
            if (actualInputTokens > 0 && actualOutputTokens > 0) {
                // Use actual tokens
                inputCost = (actualInputTokens / 1000000) * pricing.inputCostPerMToken;
                outputCost = (actualOutputTokens / 1000000) * pricing.outputCostPerMToken;
            }
            else {
                // Estimate based on typical ratio (60/40 is more realistic than 50/50)
                const estimatedInputTokens = Math.floor(tokenCount * 0.6);
                const estimatedOutputTokens = tokenCount - estimatedInputTokens;
                inputCost = (estimatedInputTokens / 1000000) * pricing.inputCostPerMToken;
                outputCost = (estimatedOutputTokens / 1000000) * pricing.outputCostPerMToken;
            }
            return inputCost + outputCost;
        }
    }
    catch (error) {
        console.error("Error reading config for pricing:", error);
    }
    // Default fallback cost calculation - use more realistic average
    return (tokenCount / 1000000) * 0.002; // $0.002 per million tokens as fallback
}
async function aggregateUsageData(data) {
    const result = {
        totalTokens: 0,
        totalCost: 0,
        byModel: {},
        byProvider: {}
    };
    for (const entry of data) {
        const cost = entry.cost || await calculateCost(entry.tokenCount, entry.model, entry.provider, entry.inputTokens, entry.outputTokens);
        result.totalTokens += entry.tokenCount;
        result.totalCost += cost;
        // Aggregate by model
        if (!result.byModel[entry.model]) {
            result.byModel[entry.model] = { tokens: 0, cost: 0, count: 0 };
        }
        result.byModel[entry.model].tokens += entry.tokenCount;
        result.byModel[entry.model].cost += cost;
        result.byModel[entry.model].count += 1;
        // Aggregate by provider
        if (!result.byProvider[entry.provider]) {
            result.byProvider[entry.provider] = { tokens: 0, cost: 0 };
        }
        result.byProvider[entry.provider].tokens += entry.tokenCount;
        result.byProvider[entry.provider].cost += cost;
    }
    return result;
}
function displaySummary(data, aggregated) {
    console.log("\x1b[1mSummary:\x1b[0m");
    console.log(`  Total API Calls: \x1b[33m${data.length.toString()}\x1b[0m`);
    console.log(`  Total Tokens: \x1b[33m${(0, formatter_1.formatTokenCount)(aggregated.totalTokens)}\x1b[0m`);
    console.log(`  Total Estimated Cost: \x1b[33m${(0, formatter_1.formatCost)(aggregated.totalCost)}\x1b[0m`);
    console.log();
}
function displayByModel(aggregated) {
    console.log("\x1b[1mUsage by Model:\x1b[0m");
    const models = Object.entries(aggregated.byModel);
    if (models.length === 0) {
        console.log("  No data available");
        return;
    }
    // Sort by cost descending
    models.sort((a, b) => b[1].cost - a[1].cost);
    for (const [model, stats] of models) {
        console.log(`  \x1b[32m${model}\x1b[0m:`);
        console.log(`    Requests: \x1b[36m${stats.count.toString()}\x1b[0m`);
        console.log(`    Tokens: \x1b[36m${(0, formatter_1.formatTokenCount)(stats.tokens)}\x1b[0m`);
        console.log(`    Estimated Cost: \x1b[36m${(0, formatter_1.formatCost)(stats.cost)}\x1b[0m`);
    }
    console.log();
}
function displayByProvider(aggregated) {
    console.log("\x1b[1mUsage by Provider:\x1b[0m");
    const providers = Object.entries(aggregated.byProvider);
    if (providers.length === 0) {
        console.log("  No data available");
        return;
    }
    // Sort by cost descending
    providers.sort((a, b) => b[1].cost - a[1].cost);
    for (const [provider, stats] of providers) {
        console.log(`  \x1b[35m${provider}\x1b[0m:`);
        console.log(`    Tokens: \x1b[36m${(0, formatter_1.formatTokenCount)(stats.tokens)}\x1b[0m`);
        console.log(`    Estimated Cost: \x1b[36m${(0, formatter_1.formatCost)(stats.cost)}\x1b[0m`);
    }
    console.log();
}
async function displayRecentCalls(data) {
    console.log("\x1b[1mRecent API Calls:\x1b[0m");
    if (data.length === 0) {
        console.log("  No recent calls");
        return;
    }
    // Show last 10 calls
    const recentCalls = data.slice(-10).reverse();
    for (const call of recentCalls) {
        const cost = call.cost || await calculateCost(call.tokenCount, call.model, call.provider, call.inputTokens, call.outputTokens);
        console.log(`  \x1b[2m[${(0, formatter_1.formatTimeAgo)(call.timestamp)}]\x1b[0m` +
            ` \x1b[32m${call.model}\x1b[0m` +
            ` (\x1b[34m${call.provider}\x1b[0m)` +
            ` ${(0, formatter_1.formatTokenCount)(call.tokenCount)} tokens` +
            ` \x1b[33m${(0, formatter_1.formatCost)(cost)}\x1b[0m`);
    }
    console.log();
}
function getContextWindowInfo(model, provider) {
    try {
        const config = (0, log_reader_1.readConfigFile)();
        const modelKey = `${provider},${model}`;
        if (config && config.Pricing && config.Pricing[modelKey]) {
            return config.Pricing[modelKey].contextWindow;
        }
    }
    catch (error) {
        console.error("Error reading config for context window:", error);
    }
    // Default context window sizes
    if (model.includes("qwen3-coder")) {
        return 262144;
    }
    else if (model.includes("glm-4.5")) {
        return 131072;
    }
    else if (model.includes("gemini-2.5-pro")) {
        return 2097152;
    }
    else if (model.includes("gemini-2.5-flash")) {
        return 1048576;
    }
    else if (model.includes("claude-3-5-haiku")) {
        return 200000;
    }
    else if (model.includes("claude-3-5-sonnet")) {
        return 200000;
    }
    else if (model.includes("claude-3-opus")) {
        return 200000;
    }
    // Default fallback
    return 32768;
}
function findMostRecentValidCall(data) {
    // Look for the most recent entry with a valid model name
    for (let i = data.length - 1; i >= 0; i--) {
        const call = data[i];
        if (call.model && call.model !== "unknown" && call.model.trim() !== "") {
            return call;
        }
    }
    // If no valid model found, return the most recent entry if it exists
    if (data.length > 0) {
        return data[data.length - 1];
    }
    return null;
}
function renderLastApiCallSection(data) {
    if (data.length === 0) {
        return;
    }
    // Find the most recent call with a valid model name
    const recentCall = findMostRecentValidCall(data);
    if (!recentCall) {
        return;
    }
    // Find the maximum token count among the last two calls with the same model and provider
    const callsWithSameModel = data
        .filter(call => call.model === recentCall.model && call.provider === recentCall.provider)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    // Get the last two calls (or all if less than two)
    const lastTwoCalls = callsWithSameModel.slice(0, 2);
    const maxTokenCount = lastTwoCalls.length > 0
        ? Math.max(...lastTwoCalls.map(call => call.tokenCount))
        : recentCall.tokenCount;
    const contextWindow = getContextWindowInfo(recentCall.model, recentCall.provider);
    (0, formatter_1.displayLastApiCall)(maxTokenCount, contextWindow, recentCall.model, recentCall.provider);
}
// Function to check if log parser is running by looking for recent updates
function checkLogParserStatus() {
    try {
        const data = (0, log_reader_1.getUsageData)();
        if (data && data.length > 0) {
            const latestEntry = data[data.length - 1];
            const lastUpdate = latestEntry.timestamp;
            // Check if the last update was within the last 2 minutes
            const lastUpdateTime = new Date(lastUpdate).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastUpdateTime;
            // If less than 2 minutes old, consider it running
            if (timeDiff < 120000) {
                return { isRunning: true, lastUpdate };
            }
            else {
                return { isRunning: false, lastUpdate };
            }
        }
    }
    catch (error) {
        console.error("Error checking log parser status:", error);
    }
    return { isRunning: false, lastUpdate: null };
}
function displayLogParserWarning() {
    const status = checkLogParserStatus();
    if (!status.isRunning) {
        console.log("\x1b[1m\x1b[31m⚠️  Warning: Log parser may not be running\x1b[0m");
        if (status.lastUpdate) {
            console.log(`  Last update: ${(0, formatter_1.formatTimeAgo)(status.lastUpdate)}`);
        }
        else {
            console.log("  No usage data found.");
        }
        console.log("  Please ensure 'ccr-log-parser' is running to get real-time updates.");
        console.log();
    }
}
let lastData = [];
let lastUpdateTime = 0;
async function updateDisplay() {
    try {
        const rawData = (0, log_reader_1.getUsageData)();
        if (!rawData || rawData.length === 0) {
            // If we get no data, stick with the last known good data
            (0, formatter_1.clearScreen)();
            (0, formatter_1.displayHeader)();
            console.log("No usage data available yet. Waiting for API calls...");
            console.log();
            console.log("Make sure claude-code-router is running and logging is enabled.");
            console.log("You can enable logging by setting LOG=true in your config.");
            console.log();
            displayLogParserWarning();
            displayLogFileSizeWarning();
            (0, formatter_1.displayFooter)();
            return;
        }
        const data = Array.from(new Set(rawData.map(e => JSON.stringify(e)))).map(e => JSON.parse(e));
        // Check if data has changed or if enough time has passed to warrant an update
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        if (JSON.stringify(data) !== JSON.stringify(lastData) || timeSinceLastUpdate > 5000) {
            (0, formatter_1.clearScreen)();
            (0, formatter_1.displayHeader)();
            if (data.length > 0) {
                const aggregated = await aggregateUsageData(data);
                await displayRecentCalls(data);
                displayByProvider(aggregated);
                displayByModel(aggregated);
                displaySummary(data, aggregated);
                renderLastApiCallSection(data);
            }
            else {
                console.log("No usage data available yet. Waiting for API calls...");
                console.log();
                console.log("Make sure claude-code-router is running and logging is enabled.");
                console.log("You can enable logging by setting LOG=true in your config.");
            }
            displayLogParserWarning();
            displayLogFileSizeWarning();
            (0, formatter_1.displayFooter)();
            lastData = data;
            lastUpdateTime = currentTime;
        }
    }
    catch (error) {
        console.error("Error updating display:", error);
    }
}
async function startMonitoring(shutdownCallback) {
    console.log("Starting Claude Code Router monitoring service...");
    // Clear screen and display initial data
    (0, formatter_1.clearScreen)();
    (0, formatter_1.displayHeader)();
    // Initial update
    await updateDisplay();
    // Update every 10 seconds
    setInterval(() => {
        updateDisplay().catch(error => {
            console.error("Error in monitoring update:", error);
        });
    }, 10000);
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n\nMonitoring service stopped.');
        if (shutdownCallback) {
            shutdownCallback();
        }
        process.exit(0);
    });
}
