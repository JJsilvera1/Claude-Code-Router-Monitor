"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_FILE = exports.CONFIG_FILE = exports.USAGE_DATA_FILE = void 0;
exports.getUsageData = getUsageData;
exports.readConfigFile = readConfigFile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const types_1 = require("./types");
const HOME_DIR = node_path_1.default.join(node_os_1.default.homedir(), ".claude-code-router");
exports.USAGE_DATA_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router-usage-data.json");
exports.CONFIG_FILE = node_path_1.default.join(HOME_DIR, "monitor-config.json");
exports.LOG_FILE = node_path_1.default.join(HOME_DIR, "claude-code-router.log");
function getUsageData() {
    try {
        if (node_fs_1.default.existsSync(exports.USAGE_DATA_FILE)) {
            const fileContent = node_fs_1.default.readFileSync(exports.USAGE_DATA_FILE, "utf8");
            if (fileContent.trim() === "") {
                return [];
            }
            try {
                const data = JSON.parse(fileContent);
                // Validate that the data is an array
                if (!Array.isArray(data)) {
                    console.warn("Usage data file contains invalid format, returning empty array");
                    return [];
                }
                return data;
            }
            catch (parseError) {
                console.warn("Failed to parse usage data, file may be corrupt or being written. Returning empty array.");
                return [];
            }
        }
    }
    catch (error) {
        console.error("Failed to read usage data file:", error);
    }
    return [];
}
function readConfigFile() {
    try {
        if (node_fs_1.default.existsSync(exports.CONFIG_FILE)) {
            const configContent = node_fs_1.default.readFileSync(exports.CONFIG_FILE, "utf8");
            if (configContent.trim() === "") {
                console.warn("Config file is empty");
                return null;
            }
            try {
                return JSON.parse(configContent);
            }
            catch (parseError) {
                throw new types_1.ConfigError(`Invalid JSON in config file: ${exports.CONFIG_FILE}`, parseError);
            }
        }
    }
    catch (error) {
        if (error instanceof types_1.ConfigError) {
            console.error(error.message);
        }
        else {
            console.error("Failed to read config file:", error);
        }
    }
    return null;
}
