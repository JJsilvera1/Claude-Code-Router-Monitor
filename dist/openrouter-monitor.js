#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupConfig = setupConfig;
exports.loadUsageData = loadUsageData;
exports.fetchAPIKeys = fetchAPIKeys;
exports.aggregateUsageData = aggregateUsageData;
exports.updateUsageData = updateUsageData;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const os_1 = __importDefault(require("os"));
const HOME_DIR = node_path_1.default.join(os_1.default.homedir(), ".claude-code-router");
const OPENROUTER_USAGE_FILE = node_path_1.default.join(HOME_DIR, "openrouter-usage-data.json");
const OPENROUTER_CONFIG_FILE = node_path_1.default.join(HOME_DIR, "openrouter-config.json");
// Load OpenRouter config
function loadOpenRouterConfig() {
    try {
        if (node_fs_1.default.existsSync(OPENROUTER_CONFIG_FILE)) {
            const config = node_fs_1.default.readFileSync(OPENROUTER_CONFIG_FILE, "utf8");
            return JSON.parse(config);
        }
    }
    catch (error) {
        console.error("Failed to load OpenRouter config:", error);
    }
    return {};
}
// Save OpenRouter config
function saveOpenRouterConfig(config) {
    try {
        node_fs_1.default.writeFileSync(OPENROUTER_CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error("Failed to save OpenRouter config:", error);
    }
}
// Load existing usage data
function loadUsageData() {
    try {
        if (node_fs_1.default.existsSync(OPENROUTER_USAGE_FILE)) {
            const data = node_fs_1.default.readFileSync(OPENROUTER_USAGE_FILE, "utf8");
            if (data.trim() === "") {
                return [];
            }
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error("Failed to load usage data:", error);
    }
    return [];
}
// Save usage data
function saveUsageData(data) {
    try {
        node_fs_1.default.writeFileSync(OPENROUTER_USAGE_FILE, JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error("Failed to save usage data:", error);
    }
}
// Fetch API keys from OpenRouter
async function fetchAPIKeys(provisioningApiKey) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/keys', {
            headers: {
                'Authorization': `Bearer ${provisioningApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result.data || [];
    }
    catch (error) {
        console.error("Error fetching API keys:", error);
        return [];
    }
}
// Aggregate usage data from API keys
function aggregateUsageData(keys) {
    const totalKeys = keys.length;
    const totalUsage = keys.reduce((sum, key) => sum + key.usage, 0);
    const totalLimit = keys.reduce((sum, key) => sum + key.limit, 0);
    const creditsRemaining = totalLimit - totalUsage;
    return {
        timestamp: new Date().toISOString(),
        totalKeys,
        totalUsage,
        totalLimit,
        creditsRemaining,
        keys
    };
}
// Get unique key for deduplication
function getUniqueKey(item) {
    // Normalize timestamp by removing minutes and seconds
    const normalizedTime = item.timestamp.substring(0, 16); // YYYY-MM-DDTHH:MM
    return `${normalizedTime}|${item.totalUsage}|${item.creditsRemaining}`;
}
// Update usage data
async function updateUsageData() {
    const config = loadOpenRouterConfig();
    if (!config.provisioningApiKey) {
        console.error("No provisioning API key found. Please set up your OpenRouter config.");
        console.log("Create a config file at:", OPENROUTER_CONFIG_FILE);
        console.log("With content: { \"provisioningApiKey\": \"your-key-here\" }");
        return;
    }
    try {
        console.log("Fetching OpenRouter API keys...");
        const keys = await fetchAPIKeys(config.provisioningApiKey);
        if (keys.length === 0) {
            console.log("No API keys found or error fetching keys.");
            return;
        }
        const newUsageData = aggregateUsageData(keys);
        const existingData = loadUsageData();
        // Combine and deduplicate
        const allData = [...existingData, newUsageData];
        const uniqueMap = new Map();
        allData.forEach(item => {
            uniqueMap.set(getUniqueKey(item), item);
        });
        const finalData = Array.from(uniqueMap.values())
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Keep only last 1000 entries to prevent file from growing too large
        const trimmedData = finalData.slice(-1000);
        saveUsageData(trimmedData);
        // Display current status
        console.log(`OpenRouter Usage Updated:`);
        console.log(`  Total Keys: ${newUsageData.totalKeys}`);
        console.log(`  Total Usage: $${newUsageData.totalUsage.toFixed(2)}`);
        console.log(`  Total Limit: $${newUsageData.totalLimit.toFixed(2)}`);
        console.log(`  Credits Remaining: $${newUsageData.creditsRemaining.toFixed(2)}`);
        // Show individual key status if any have usage
        const usedKeys = keys.filter(key => key.usage > 0);
        if (usedKeys.length > 0) {
            console.log(`\nActive Keys (${usedKeys.length}):`);
            usedKeys.forEach(key => {
                console.log(`  ${key.name || key.label}: $${key.usage.toFixed(2)} used, $${(key.limit - key.usage).toFixed(2)} remaining`);
            });
        }
    }
    catch (error) {
        console.error("Error updating OpenRouter usage data:", error);
    }
}
// Setup OpenRouter config interactively
async function setupConfig() {
    console.log("OpenRouter Monitor Setup");
    console.log("========================");
    console.log("\nTo use OpenRouter monitoring, you need a Provisioning API Key:");
    console.log("1. Go to: https://openrouter.ai/settings/provisioning-keys");
    console.log("2. Click 'Create New Key'");
    console.log("3. Complete the key creation process");
    console.log("\nProvisioning keys are used ONLY for monitoring - not for API calls.");
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('\nEnter your Provisioning API Key: ', (apiKey) => {
        if (apiKey.trim()) {
            const config = {
                provisioningApiKey: apiKey.trim(),
                refreshInterval: 300 // 5 minutes
            };
            saveOpenRouterConfig(config);
            console.log('\n✓ Configuration saved successfully!');
            console.log('You can now start monitoring with: ccr-openrouter-monitor');
        }
        else {
            console.log('\nNo key provided. Setup cancelled.');
        }
        rl.close();
    });
}
// Clear usage data
function clearUsageData() {
    try {
        if (node_fs_1.default.existsSync(OPENROUTER_USAGE_FILE)) {
            node_fs_1.default.writeFileSync(OPENROUTER_USAGE_FILE, "[]");
            console.log(`Cleared OpenRouter usage data: ${OPENROUTER_USAGE_FILE}`);
        }
    }
    catch (error) {
        console.error("Error clearing usage data:", error);
    }
}
// Main function
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--setup') || args.includes('-s')) {
        await setupConfig();
        return;
    }
    if (args.includes('--clear') || args.includes('-c')) {
        clearUsageData();
        return;
    }
    if (args.includes('-h') || args.includes('--help')) {
        console.log(`
OpenRouter Monitor - Track usage and credits across all OpenRouter API keys

Usage: ccr-openrouter-monitor [options]

Options:
  -h, --help     Show help information
  -s, --setup    Setup OpenRouter configuration
  -c, --clear    Clear all usage data

Description:
  This tool monitors OpenRouter API usage and credits using the Provisioning API.
  It tracks usage across all your API keys and provides real-time credit monitoring.

Setup:
  1. Create a Provisioning API Key: https://openrouter.ai/settings/provisioning-keys
  2. Run: ccr-openrouter-monitor --setup
  3. Start monitoring: ccr-openrouter-monitor

Features:
  - Track credit usage across all API keys
  - Monitor individual key usage and limits
  - Real-time credit balance monitoring
  - Historical usage tracking

Examples:
  ccr-openrouter-monitor --setup     Setup OpenRouter configuration
  ccr-openrouter-monitor             Start monitoring
  ccr-openrouter-monitor --clear     Clear all usage data
        `);
        process.exit(0);
    }
    console.log("Starting OpenRouter monitoring service...");
    const config = loadOpenRouterConfig();
    if (!config.provisioningApiKey) {
        console.log("⚠️  OpenRouter not configured. Run: ccr-openrouter-monitor --setup");
        process.exit(1);
    }
    // Initial update
    await updateUsageData();
    // Set up periodic updates
    const refreshInterval = (config.refreshInterval || 300) * 1000; // Convert to milliseconds
    console.log(`\nMonitoring every ${refreshInterval / 1000} seconds. Press Ctrl+C to stop.`);
    const intervalId = setInterval(async () => {
        await updateUsageData();
    }, refreshInterval);
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        clearInterval(intervalId);
        console.log('\nOpenRouter monitoring stopped.');
        process.exit(0);
    });
}
if (require.main === module) {
    main();
}
