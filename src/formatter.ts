// ANSI color codes for terminal formatting
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

export function clearScreen() {
  process.stdout.write('\x1Bc');
}

export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(2)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatRawTokenCount(count: number): string {
  // Return the raw number without formatting for clarity in context windows
  return count.toLocaleString();
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

export function displayHeader() {
  console.log(colors.bright + colors.cyan + " Claude Code Router - Usage Monitor " + colors.reset);
  console.log(colors.dim + "=".repeat(60) + colors.reset);
  console.log();
}

export function displayFooter() {
  // Empty footer - removed the text messages
}

export function displayLastApiCall(currentTokens: number, contextWindow: number, modelName: string, providerName: string) {
  const percentage = (currentTokens / contextWindow) * 100;
  const barLength = 40;
  
  let filledLength = Math.round((currentTokens / contextWindow) * barLength);
  let barColor = colors.green;
  let percentageText = `${percentage.toFixed(1)}%`;

  if (percentage > 100) {
    barColor = colors.red;
    filledLength = barLength; // Fill the bar completely
    percentageText = `${colors.red}LIMIT EXCEEDED${colors.reset}`;
  } else if (percentage > 80) {
    barColor = colors.red;
  } else if (percentage > 60) {
    barColor = colors.yellow;
  }

  filledLength = Math.min(barLength, filledLength); // Cap at barLength
  const emptyLength = barLength - filledLength;

  const bar = barColor + "▒".repeat(filledLength) + colors.dim + "░".repeat(emptyLength) + colors.reset;
  
  console.log(`${colors.bright}Last API Call Tokens:${colors.reset}`);
  console.log(`Model: ${colors.green}${modelName}${colors.reset} (${colors.blue}${providerName}${colors.reset})`);
  console.log(`Tokens: ${colors.yellow}${formatTokenCount(currentTokens)}${colors.reset} of ${colors.cyan}${formatRawTokenCount(contextWindow)}${colors.reset}`);
  console.log(`[${bar}] ${percentageText}`);
  console.log();
}