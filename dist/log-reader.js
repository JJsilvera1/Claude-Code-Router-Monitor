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
                return JSON.parse(fileContent);
            }
            catch (parseError) {
                // console.error("Failed to parse usage data, file may be corrupt or being written.", parseError);
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
            const config = node_fs_1.default.readFileSync(exports.CONFIG_FILE, "utf8");
            return JSON.parse(config);
        }
    }
    catch (error) {
        console.error("Failed to read config file:", error);
    }
    return null;
}
