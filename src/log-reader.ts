import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { UsageData, MonitorConfig, ConfigError } from "./types";

const HOME_DIR = path.join(os.homedir(), ".claude-code-router");
export const USAGE_DATA_FILE = path.join(HOME_DIR, "claude-code-router-usage-data.json");
export const CONFIG_FILE = path.join(HOME_DIR, "monitor-config.json");
export const LOG_FILE = path.join(HOME_DIR, "claude-code-router.log");

export function getUsageData(): UsageData[] {
  try {
    if (fs.existsSync(USAGE_DATA_FILE)) {
      const fileContent = fs.readFileSync(USAGE_DATA_FILE, "utf8");
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
        return data as UsageData[];
      } catch (parseError) {
        console.warn("Failed to parse usage data, file may be corrupt or being written. Returning empty array.");
        return [];
      }
    }
  } catch (error) {
    console.error("Failed to read usage data file:", error);
  }
  return [];
}

export function readConfigFile(): MonitorConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configContent = fs.readFileSync(CONFIG_FILE, "utf8");
      if (configContent.trim() === "") {
        console.warn("Config file is empty");
        return null;
      }
      try {
        return JSON.parse(configContent) as MonitorConfig;
      } catch (parseError) {
        throw new ConfigError(`Invalid JSON in config file: ${CONFIG_FILE}`, parseError as Error);
      }
    }
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(error.message);
    } else {
      console.error("Failed to read config file:", error);
    }
  }
  return null;
}