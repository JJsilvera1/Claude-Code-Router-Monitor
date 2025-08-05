import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { UsageData } from "./types";

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
        return JSON.parse(fileContent);
      } catch (parseError) {
        // console.error("Failed to parse usage data, file may be corrupt or being written.", parseError);
        return [];
      }
    }
  } catch (error) {
    console.error("Failed to read usage data file:", error);
  }
  return [];
}

export function readConfigFile(): any {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = fs.readFileSync(CONFIG_FILE, "utf8");
      return JSON.parse(config);
    }
  } catch (error) {
    console.error("Failed to read config file:", error);
  }
  return null;
}