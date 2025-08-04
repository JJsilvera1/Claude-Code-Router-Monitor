import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { UsageData } from "./types";

const HOME_DIR = path.join(os.homedir(), ".claude-code-router");
const USAGE_DATA_FILE = path.join(HOME_DIR, "claude-code-router-usage-data.json");
const CONFIG_FILE = path.join(HOME_DIR, "config.json");

export function getUsageData(): UsageData[] {
  try {
    if (fs.existsSync(USAGE_DATA_FILE)) {
      const fileContent = fs.readFileSync(USAGE_DATA_FILE, "utf8");
      return JSON.parse(fileContent || "[]");
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