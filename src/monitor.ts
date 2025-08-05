import { getUsageData, readConfigFile } from "./log-reader";
import { UsageData, ModelPricing } from "./types";
import { 
  clearScreen, 
  formatTokenCount, 
  formatCost, 
  formatTimeAgo,
  displayHeader,
  displayFooter,
  displayLastApiCall
} from "./formatter";

async function calculateCost(tokenCount: number, model: string, provider: string): Promise<number> {
  try {
    const config = readConfigFile();
    const modelKey = `${provider},${model}`;
    
    // Check if pricing exists in config
    if (config && config.Pricing && config.Pricing[modelKey]) {
      const pricing = config.Pricing[modelKey];
      // Assume 50% input tokens, 50% output tokens for cost estimation
      const inputTokens = Math.floor(tokenCount * 0.5);
      const outputTokens = tokenCount - inputTokens;
      
      const inputCost = (inputTokens / 1000000) * pricing.inputCostPerMToken;
      const outputCost = (outputTokens / 1000000) * pricing.outputCostPerMToken;
      
      return inputCost + outputCost;
    }
  } catch (error) {
    console.error("Error reading config for pricing:", error);
  }
  
  // Default fallback cost calculation
  return (tokenCount / 1000000) * 0.01; // $0.01 per million tokens as fallback
}

async function aggregateUsageData(data: UsageData[]): Promise<{
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { tokens: number; cost: number; count: number }>;
  byProvider: Record<string, { tokens: number; cost: number }>;
}> {
  const result = {
    totalTokens: 0,
    totalCost: 0,
    byModel: {} as Record<string, { tokens: number; cost: number; count: number }>,
    byProvider: {} as Record<string, { tokens: number; cost: number }>
  };
  
  for (const entry of data) {
    const cost = entry.cost || await calculateCost(entry.tokenCount, entry.model, entry.provider);
    
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

function displaySummary(data: UsageData[], aggregated: any) {
  console.log("\x1b[1mSummary:\x1b[0m");
  console.log(`  Total API Calls: \x1b[33m${data.length.toString()}\x1b[0m`);
  console.log(`  Total Tokens: \x1b[33m${formatTokenCount(aggregated.totalTokens)}\x1b[0m`);
  console.log(`  Total Estimated Cost: \x1b[33m${formatCost(aggregated.totalCost)}\x1b[0m`);
  console.log();
}

function displayByModel(aggregated: any) {
  console.log("\x1b[1mUsage by Model:\x1b[0m");
  const models = Object.entries(aggregated.byModel);
  
  if (models.length === 0) {
    console.log("  No data available");
    return;
  }
  
  // Sort by cost descending
  models.sort((a, b) => (b[1] as any).cost - (a[1] as any).cost);
  
  for (const [model, stats] of models) {
    console.log(`  \x1b[32m${model}\x1b[0m:`);
    console.log(`    Requests: \x1b[36m${(stats as any).count.toString()}\x1b[0m`);
    console.log(`    Tokens: \x1b[36m${formatTokenCount((stats as any).tokens)}\x1b[0m`);
    console.log(`    Estimated Cost: \x1b[36m${formatCost((stats as any).cost)}\x1b[0m`);
  }
  console.log();
}

function displayByProvider(aggregated: any) {
  console.log("\x1b[1mUsage by Provider:\x1b[0m");
  const providers = Object.entries(aggregated.byProvider);
  
  if (providers.length === 0) {
    console.log("  No data available");
    return;
  }
  
  // Sort by cost descending
  providers.sort((a, b) => (b[1] as any).cost - (a[1] as any).cost);
  
  for (const [provider, stats] of providers) {
    console.log(`  \x1b[35m${provider}\x1b[0m:`);
    console.log(`    Tokens: \x1b[36m${formatTokenCount((stats as any).tokens)}\x1b[0m`);
    console.log(`    Estimated Cost: \x1b[36m${formatCost((stats as any).cost)}\x1b[0m`);
  }
  console.log();
}

async function displayRecentCalls(data: UsageData[]) {
  console.log("\x1b[1mRecent API Calls:\x1b[0m");
  
  if (data.length === 0) {
    console.log("  No recent calls");
    return;
  }
  
  // Show last 10 calls
  const recentCalls = data.slice(-10).reverse();
  
  for (const call of recentCalls) {
    const cost = call.cost || await calculateCost(call.tokenCount, call.model, call.provider);
    console.log(
      `  \x1b[2m[${formatTimeAgo(call.timestamp)}]\x1b[0m` +
      ` \x1b[32m${call.model}\x1b[0m` +
      ` (\x1b[34m${call.provider}\x1b[0m)` +
      ` ${formatTokenCount(call.tokenCount)} tokens` +
      ` \x1b[33m${formatCost(cost)}\x1b[0m`
    );
  }
  console.log();
}

function getContextWindowInfo(model: string, provider: string): number {
  try {
    const config = readConfigFile();
    const modelKey = `${provider},${model}`;
    
    if (config && config.Pricing && config.Pricing[modelKey]) {
      return config.Pricing[modelKey].contextWindow;
    }
  } catch (error) {
    console.error("Error reading config for context window:", error);
  }
  
  // Default context window sizes
  if (model.includes("qwen3-coder")) {
    return 32768;
  } else if (model.includes("glm-4.5")) {
    return 128000;
  } else if (model.includes("gemini-2.5-pro")) {
    return 2097152;
  } else if (model.includes("gemini-2.5-flash")) {
    return 1048576;
  } else if (model.includes("claude-3-5-haiku")) {
    return 200000;
  } else if (model.includes("claude-3-5-sonnet")) {
    return 200000;
  } else if (model.includes("claude-3-opus")) {
    return 200000;
  }
  
  // Default fallback
  return 32768;
}

function findMostRecentValidCall(data: UsageData[]): UsageData | null {
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

function renderLastApiCallSection(data: UsageData[]) {
  if (data.length === 0) {
    return;
  }
  
  // Find the most recent call with a valid model name
  const recentCall = findMostRecentValidCall(data);
  if (!recentCall) {
    return;
  }
  
  const contextWindow = getContextWindowInfo(recentCall.model, recentCall.provider);
  
  displayLastApiCall(recentCall.tokenCount, contextWindow, recentCall.model, recentCall.provider);
}

let lastData: UsageData[] = [];

export async function updateDisplay() {
  try {
    const rawData = getUsageData();
    if (!rawData || rawData.length === 0) {
      // If we get no data, stick with the last known good data
      return;
    }
    const data = Array.from(new Set(rawData.map(e => JSON.stringify(e)))).map(e => JSON.parse(e));
    
    // Check if data has changed
    if (JSON.stringify(data) !== JSON.stringify(lastData)) {
      clearScreen();
      displayHeader();
      
      if (data.length > 0) {
        const aggregated = await aggregateUsageData(data);
        await displayRecentCalls(data);
        displayByProvider(aggregated);
        displayByModel(aggregated);
        displaySummary(data, aggregated);
        renderLastApiCallSection(data);
      } else {
        console.log("No usage data available yet. Waiting for API calls...");
        console.log();
        console.log("Make sure claude-code-router is running and logging is enabled.");
        console.log("You can enable logging by setting LOG=true in your config.");
      }
      
      displayFooter();
      lastData = data;
    }
  } catch (error) {
    console.error("Error updating display:", error);
  }
}

export async function startMonitoring(shutdownCallback?: () => void) {
  console.log("Starting Claude Code Router monitoring service...");
  
  // Clear screen and display initial data
  clearScreen();
  displayHeader();
  
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