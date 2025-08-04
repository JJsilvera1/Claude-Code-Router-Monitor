# Claude Code Router Monitor

A standalone terminal-based monitoring tool for tracking Claude Code Router usage, including API calls, context window sizes, and cost estimates.

## Features

- **Real-time Monitoring**: Live dashboard updating every 10 seconds
- **Usage Statistics**: Track API calls, token counts, and costs
- **Model & Provider Breakdown**: See usage by model and provider
- **Cost Estimation**: Calculate costs based on configured pricing
- **Terminal Interface**: Color-coded, easy-to-read terminal dashboard
- **Standalone Tool**: Works without modifying claude-code-router

## Installation

1. First, ensure you have [claude-code-router](https://github.com/your-repo/claude-code-router) installed and running:
   ```bash
   npm install -g @musistudio/claude-code-router
   ```

2. Enable logging in your claude-code-router config file (`~/.claude-code-router/config.json`):
   ```json
   {
     "LOG": true,
     ...
   }
   ```

3. Install the monitor tool:
   ```bash
   npm install -g ccr-monitor
   ```
   
   Or if you're installing from this directory:
   ```bash
   npm install -g .
   ```

## Usage

Start monitoring with:
```bash
ccr-monitor
```

The dashboard will display:
- Total API calls, tokens, and estimated costs
- Usage breakdown by model
- Usage breakdown by provider
- Recent API calls with timestamps
- Real-time updates every 10 seconds

Press `Ctrl+C` to exit the monitoring service.

## How It Works

This tool reads usage data from claude-code-router's log files located at:
- `~/.claude-code-router/claude-code-router-usage-data.json`

It uses the same data format and structure as the built-in monitor, ensuring compatibility with existing claude-code-router installations.

## Configuration

To enable cost estimation, add pricing information to your claude-code-router config file:
```json
{
  "Pricing": {
    "openrouter,google/gemini-2.5-pro-preview": {
      "inputCostPerMToken": 0.0025,
      "outputCostPerMToken": 0.0075,
      "contextWindow": 2097152
    },
    "deepseek,deepseek-chat": {
      "inputCostPerMToken": 0.14,
      "outputCostPerMToken": 0.28,
      "contextWindow": 128000
    }
  }
}
```

## License

MIT