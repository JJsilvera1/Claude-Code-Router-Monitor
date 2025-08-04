"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageData = getUsageData;
exports.readConfigFile = readConfigFile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const HOME_DIR = node_path_1.default.join(node_os_1.default.homedir(), ".claude-code-router");
const USAGE_DATA_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router-usage-data.json");
const CONFIG_FILE = node_path_1.default.join(HOME_DIR, "config.json");
function getUsageData() {
    try {
        if (node_fs_1.default.existsSync(USAGE_DATA_FILE)) {
            const fileContent = node_fs_1.default.readFileSync(USAGE_DATA_FILE, "utf8");
            return JSON.parse(fileContent || "[]");
        }
    }
    catch (error) {
        console.error("Failed to read usage data file:", error);
    }
    return [];
}
function readConfigFile() {
    try {
        if (node_fs_1.default.existsSync(CONFIG_FILE)) {
            const config = node_fs_1.default.readFileSync(CONFIG_FILE, "utf8");
            return JSON.parse(config);
        }
    }
    catch (error) {
        console.error("Failed to read config file:", error);
    }
    return null;
}
