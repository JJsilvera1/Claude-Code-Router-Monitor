# Claude Code Router Monitor

A standalone terminal-based monitoring tool for tracking Claude Code Router usage, including API calls, context window sizes, and cost estimates.

## Features

- **Real-time Monitoring**: Live dashboard updating every 10 seconds
- **Usage Statistics**: Track API calls, token counts, and costs
- **Model & Provider Breakdown**: See usage by model and provider
- **Context Window Visualization**: Visualize token usage against model context windows
- **Cost Estimation**: Calculate costs based on configured pricing
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

1. Install [claude-code-router](https://github.com/your-repo/claude-code-router):
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
   - Copy our sample configuration: `sample-monitor-config.json`
   - Or create a minimal config:
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

- `ccr-log-parser`: Parses logs and generates usage data
- `ccr-monitor`: Displays the real-time dashboard
- `ccr-start`: Starts both services together

## Using in Different VS Code Workspaces

The tool works across all VS Code workspaces since it reads from the global `~/.claude-code-router/` directory. You only need to start the services once, and they'll monitor usage from any workspace.

## License

MIT