#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const HOME_DIR = node_path_1.default.join(node_os_1.default.homedir(), ".claude-code-router");
const LOG_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router.log");
const USAGE_DATA_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router-usage-data.json");
const USAGE_DATA_TMP_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router-usage-data.json.tmp");
// --- State Variables ---
let lastReadPosition = 0;
let existingUsageData = [];
let lastKnownModel = "unknown";
let lastKnownProvider = "unknown";
// Helper function to determine provider from model name
function determineProvider(model) {
    if (model.includes("qwen")) {
        return "openrouter";
    }
    else if (model.includes("glm")) {
        return "openrouter";
    }
    else if (model.includes("gemini")) {
        return "gemini";
    }
    else if (model.includes("claude")) {
        return "anthropic";
    }
    else {
        return "unknown";
    }
}
// Helper function to extract model from JSON string
function extractModelFromJSON(jsonStr) {
    try {
        const unescapedJson = jsonStr.replace(/\\"/g, '"');
        const jsonObj = JSON.parse(unescapedJson);
        if (jsonObj.model) {
            const model = jsonObj.model;
            return {
                model: model,
                provider: determineProvider(model)
            };
        }
    }
    catch (e) {
        const modelRegex = /"model":\s*"([^"]+)"/;
        const modelMatch = jsonStr.match(modelRegex);
        if (modelMatch) {
            const model = modelMatch[1];
            return {
                model: model,
                provider: determineProvider(model)
            };
        }
    }
    return null;
}
function parseLogChunk(logContent) {
    const newUsageData = [];
    const lines = logContent.split("\n");
    // Updated regex to match the actual log format: usage {"prompt_tokens":...}
    const usageRegex = /usage\s+(\{[^}]*\})/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const modelInfo = extractModelFromLine(line, lines, i);
        if (modelInfo) {
            lastKnownModel = modelInfo.model;
            lastKnownProvider = modelInfo.provider;
        }
        const match = line.match(usageRegex);
        if (match) {
            try {
                const usageObj = JSON.parse(match[1]);
                const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
                const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
                // Extract token counts
                const promptTokens = usageObj.input_tokens || usageObj.prompt_tokens || 0;
                const completionTokens = usageObj.output_tokens || usageObj.completion_tokens || 0;
                const totalTokens = usageObj.total_tokens || (promptTokens + completionTokens);
                // Filter out invalid data (0, 1, or null values)
                if (promptTokens > 1 && completionTokens > 1 && totalTokens > 1) {
                    newUsageData.push({
                        timestamp,
                        model: lastKnownModel,
                        provider: lastKnownProvider,
                        tokenCount: totalTokens,
                        inputTokens: promptTokens,
                        outputTokens: completionTokens
                    });
                }
            }
            catch (parseError) {
                console.error("Error parsing usage object:", parseError, "Raw match:", match[1]);
            }
        }
    }
    return newUsageData;
}
function extractModelFromLine(line, lines, currentIndex) {
    if (line.includes("Anthropic Request:") || line.includes("Original OpenAI response:") || line.includes("Original Response:") || line.includes("Conversion complete, final Anthropic response:")) {
        for (let j = currentIndex + 1; j < Math.min(currentIndex + 15, lines.length); j++) {
            const modelRegex = /"model":\s*"([^"]+)"/;
            const modelMatch = lines[j].match(modelRegex);
            if (modelMatch) {
                const model = modelMatch[1];
                return { model, provider: determineProvider(model) };
            }
        }
    }
    else if (line.includes("final request:") && line.includes("{\"method\":\"POST\"")) {
        const bodyMatch = line.match(/"body":"(\{[^"]*\})"/);
        if (bodyMatch) {
            return extractModelFromJSON(bodyMatch[1]);
        }
    }
    else if (line.includes("message_start") && line.includes("usage")) {
        try {
            const jsonMatch = line.match(/data:\s*(\{.*\})/);
            if (jsonMatch) {
                const jsonObj = JSON.parse(jsonMatch[1]);
                if (jsonObj.message && jsonObj.message.model) {
                    const model = jsonObj.message.model;
                    return { model, provider: determineProvider(model) };
                }
            }
        }
        catch (e) { /* ignore */ }
    }
    return null;
}
function getUniqueKey(item) {
    // Normalize timestamp by removing milliseconds
    const normalizedTimestamp = item.timestamp.split('.')[0];
    return `${normalizedTimestamp}|${item.model}|${item.tokenCount}`;
}
function writeUsageData(data) {
    try {
        node_fs_1.default.writeFileSync(USAGE_DATA_TMP_FILE, JSON.stringify(data, null, 2));
        node_fs_1.default.renameSync(USAGE_DATA_TMP_FILE, USAGE_DATA_FILE);
    }
    catch (error) {
        console.error("Error writing usage data file:", error);
    }
}
function clearData() {
    try {
        // Clear log file
        if (node_fs_1.default.existsSync(LOG_FILE)) {
            node_fs_1.default.writeFileSync(LOG_FILE, "");
            console.log(`Cleared log file: ${LOG_FILE}`);
        }
        // Clear usage data file
        if (node_fs_1.default.existsSync(USAGE_DATA_FILE)) {
            node_fs_1.default.writeFileSync(USAGE_DATA_FILE, "[]");
            console.log(`Cleared usage data file: ${USAGE_DATA_FILE}`);
        }
        // Reset state variables
        lastReadPosition = 0;
        existingUsageData = [];
        lastKnownModel = "unknown";
        lastKnownProvider = "unknown";
        console.log("All data cleared successfully.");
    }
    catch (error) {
        console.error("Error clearing data:", error);
        process.exit(1);
    }
}
let isParsing = false;
function updateUsageData() {
    if (isParsing) {
        return;
    }
    isParsing = true;
    try {
        if (!node_fs_1.default.existsSync(LOG_FILE)) {
            isParsing = false;
            return;
        }
        const stats = node_fs_1.default.statSync(LOG_FILE);
        if (stats.size < lastReadPosition) {
            lastReadPosition = 0;
            existingUsageData = [];
            console.log("Log file truncated. Resetting parser.");
        }
        if (stats.size > lastReadPosition) {
            const stream = node_fs_1.default.createReadStream(LOG_FILE, {
                start: lastReadPosition,
                end: stats.size,
                encoding: 'utf8'
            });
            let chunk = '';
            stream.on('data', (data) => {
                chunk += data;
            });
            stream.on('end', () => {
                const newEntries = parseLogChunk(chunk);
                if (newEntries.length > 0) {
                    existingUsageData.push(...newEntries);
                    // De-duplicate using a more reliable key
                    const uniqueMap = new Map();
                    existingUsageData.forEach(item => uniqueMap.set(getUniqueKey(item), item));
                    existingUsageData = Array.from(uniqueMap.values());
                    writeUsageData(existingUsageData);
                }
                lastReadPosition = stats.size;
                isParsing = false;
            });
            stream.on('error', () => {
                isParsing = false;
            });
        }
        else {
            isParsing = false;
        }
    }
    catch (error) {
        // console.error("Error updating usage data:", error);
        isParsing = false;
    }
}
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--clear') || args.includes('-c')) {
        clearData();
        return;
    }
    if (args.includes('-h') || args.includes('--help')) {
        console.log(`
Claude Code Router Log Parser - Parses logs and generates usage data

Usage: ccr-log-parser [options]

Options:
  -h, --help     Show help information
  -c, --clear    Clear all log and usage data

Description:
  This tool monitors the Claude Code Router log file and parses usage information
  into a JSON file that can be consumed by the monitoring tool.

Examples:
  ccr-log-parser        Start parsing logs in real-time
  ccr-log-parser --clear  Clear all log and usage data
        `);
        process.exit(0);
    }
    console.log("Starting robust log parser for Claude Code Router...");
    console.log(`Monitoring log file: ${LOG_FILE}`);
    if (node_fs_1.default.existsSync(USAGE_DATA_FILE)) {
        try {
            const fileContent = node_fs_1.default.readFileSync(USAGE_DATA_FILE, "utf8");
            existingUsageData = JSON.parse(fileContent || "[]");
            console.log(`Loaded ${existingUsageData.length} existing usage entries.`);
        }
        catch (e) {
            console.error("Could not load existing usage data. Starting fresh.");
            existingUsageData = [];
        }
    }
    // Set initial read position
    if (node_fs_1.default.existsSync(LOG_FILE)) {
        lastReadPosition = node_fs_1.default.statSync(LOG_FILE).size;
        console.log(`Initial log size: ${lastReadPosition} bytes. Will only parse new entries.`);
    }
    node_fs_1.default.watch(LOG_FILE, (eventType) => {
        if (eventType === 'change') {
            updateUsageData();
        }
    });
    console.log("Log parser is running. Press Ctrl+C to stop.");
    process.on('SIGINT', () => {
        console.log('\n\nLog parser stopped.');
        process.exit(0);
    });
}
if (require.main === module) {
    main();
}
