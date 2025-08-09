# Claude Code Router & OpenRouter Monitor

A standalone terminal-based monitoring tool for tracking Claude Code Router usage, OpenRouter API usage, credits, and cost estimates.

## Recent Updates

### v1.2.0 - Token Usage Parsing Improvements
- **Fixed log parsing**: Updated regex pattern to correctly match `usage {"prompt_tokens":...}` format from Claude Code Router logs
- **Enhanced filtering**: Now properly filters out invalid token data (0, 1, or null values) to show only meaningful usage
- **Improved error handling**: Better error handling with custom error classes (`MonitorError`, `ConfigError`, `LogParseError`)
- **Type safety**: Complete TypeScript refactoring with centralized type definitions
- **Code quality**: Removed duplicate interfaces, improved separation of concerns, cleaner project structure

## Features

### Claude Code Router Monitoring
- **Real-time Monitoring**: Live dashboard updating every 10 seconds
- **Usage Statistics**: Track API calls, token counts, and costs
- **Model & Provider Breakdown**: See usage by model and provider
- **Context Window Visualization**: Visualize token usage against model context windows
- **Cost Estimation**: Calculate costs based on configured pricing

### OpenRouter Monitoring
- **Credit Tracking**: Monitor usage and remaining credits across all API keys
- **Key Management**: Track individual API key usage and limits
- **Real-time Updates**: Live credit balance monitoring
- **Usage Alerts**: Get notified when credits are low or usage is high
- **Historical Data**: Track usage patterns over time

### Common Features
- **Terminal Interface**: Color-coded, easy-to-read terminal dashboard

## Quick Installation

```bash
# Clone the repository
git clone https://github.com/JJsilvera1/Claude-Code-Router-Monitor.git
cd Claude-Code-Router-Monitor

# Install dependencies and build
npm install
npm run build

# Install globally
npm install -g .
```

## Prerequisites

1. Install [claude-code-router](https://github.com/musistudio/claude-code-router):
   ```bash
   npm install -g @musistudio/claude-code-router
   ```

2. Enable logging in `~/.claude-code-router/config.json`:
   ```json
   {
     "LOG": true
   }
   ```

3. Create `~/.claude-code-router/monitor-config.json` with your pricing:
   ```json
   {
     "Pricing": {
       "openrouter,qwen/qwen3-coder": {
         "inputCostPerMToken": 0.3,
         "outputCostPerMToken": 1.2,
         "contextWindow": 262144
       }
     },
     "Settings": {
       "defaultRefreshInterval": 10,
       "maxRecentCalls": 10,
       "fallbackCostPerMToken": 0.01
     }
   }
   ```

## Usage

### Method 1: Separate Services (Recommended)
```bash
# Terminal 1: Start log parser
ccr-log-parser

# Terminal 2: Start monitor
ccr-monitor
```

### Method 2: Unified Start
```bash
# Starts both services together
ccr-start
```

### Clear Data
```bash
# Clear all log and usage data
ccr-monitor --clear
```

## Commands Summary

### Claude Code Router Commands
- `ccr-log-parser`: Parses logs and generates usage data
- `ccr-monitor`: Displays the real-time dashboard
- `ccr-start`: Starts both services together

### OpenRouter Commands
- `ccr-openrouter-setup`: Setup OpenRouter monitoring configuration
- `ccr-openrouter-monitor`: Start OpenRouter monitoring dashboard

## OpenRouter Monitoring Setup

### Prerequisites

1. **Create a Provisioning API Key** (not a regular API key):
   - Go to: https://openrouter.ai/settings/provisioning-keys
   - Click "Create New Key"
   - Complete the key creation process

2. **Setup Configuration**:
   ```bash
   ccr-openrouter-setup
   ```
   - Enter your Provisioning API Key when prompted
   - This creates a config file at `~/.claude-code-router/openrouter-config.json`

### Usage

```bash
# Setup OpenRouter monitoring (one-time)
ccr-openrouter-setup

# Start OpenRouter monitoring dashboard
ccr-openrouter-monitor

# Clear usage data
ccr-openrouter-monitor --clear
```

### What OpenRouter Monitoring Tracks

- **Total Credits**: Usage and limits across all API keys
- **Individual Key Usage**: Track usage per API key
- **Credit Remaining**: Real-time credit balance
- **Usage Alerts**: Notifications for high usage or low credits
- **Usage History**: Historical data and trends

### Security Notes

- **Provisioning API Keys** are used ONLY for monitoring - they cannot make API calls
- The tool reads usage data, it does not modify your API keys
- All data is stored locally on your machine

## Using in Different VS Code Workspaces

The tool works across all VS Code workspaces since it reads from the global `~/.claude-code-router/` directory. You only need to start the services once, and they'll monitor usage from any workspace.

## License

MIT