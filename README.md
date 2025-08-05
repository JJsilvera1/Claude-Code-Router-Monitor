# Claude Code Router Monitor

A standalone terminal-based monitoring tool for tracking Claude Code Router usage, including API calls, context window sizes, and cost estimates.

## Features

- **Real-time Monitoring**: Live dashboard updating every 10 seconds
- **Usage Statistics**: Track API calls, token counts, and costs
- **Model & Provider Breakdown**: See usage by model and provider
- **Context Window Visualization**: Visualize token usage against model context windows with ASCII bar charts
- **Cost Estimation**: Calculate costs based on configured pricing
- **Terminal Interface**: Color-coded, easy-to-read terminal dashboard
- **Standalone Tool**: Works without modifying claude-code-router

## Installation

### Prerequisites

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

### Install the Monitor

Install the monitor tool:
```bash
npm install -g ccr-monitor
```

Or if you're installing from this directory:
```bash
npm install
npm run build
npm install -g .
```

### Configuration Setup

1. Create the Claude Code Router directory if it doesn't exist:
   ```bash
   mkdir -p ~/.claude-code-router
   ```

2. Create a `monitor-config.json` file in `~/.claude-code-router/` with your pricing configuration:
   ```json
   {
     "Pricing": {
       "openrouter,qwen/qwen3-coder": {
         "inputCostPerMToken": 0.3,
         "outputCostPerMToken": 1.2,
         "contextWindow": 262144
       },
       "openrouter,z-ai/glm-4.5": {
         "inputCostPerMToken": 0.59,
         "outputCostPerMToken": 2.10,
         "contextWindow": 131072
       }
     },
     "Settings": {
       "defaultRefreshInterval": 10,
       "maxRecentCalls": 10,
       "fallbackCostPerMToken": 0.01
     }
   }
   ```

3. Adjust the pricing values according to your actual provider costs.

## Usage

### Start the Log Parser Service

Before using the monitor, you need to start the log parser service which reads the claude-code-router log file and generates the usage data file:

```bash
ccr-log-parser
```

This service will run in the background, continuously monitoring the log file and updating the usage data.

### Start Monitoring

In a separate terminal, start monitoring with:

```bash
ccr-monitor
```

The dashboard will display:
- Context window usage visualization with ASCII bar charts
- Total API calls, tokens, and estimated costs
- Usage breakdown by model
- Usage breakdown by provider
- Recent API calls with timestamps
- Real-time updates every 10 seconds

Press `Ctrl+C` to exit the monitoring service.

## How It Works

This tool reads usage data from claude-code-router's log files located at:
- `~/.claude-code-router/claude-code-router-usage-data.json`

The log parser service (`ccr-log-parser`) continuously monitors the claude-code-router log file (`~/.claude-code-router/claude-code-router.log`) and extracts usage information including:
- Timestamp of each API call
- Model used for the call
- Provider of the model
- Token count for the call

It then generates a JSON file with this usage data that the monitor tool reads to display real-time statistics.

## Configuration

To enable cost estimation and context window visualization, add pricing information to your `~/.claude-code-router/monitor-config.json` file:

```json
{
  "Pricing": {
    "openrouter,qwen/qwen3-coder": {
      "inputCostPerMToken": 0.3,
      "outputCostPerMToken": 1.2,
      "contextWindow": 262144
    },
    "openrouter,z-ai/glm-4.5": {
      "inputCostPerMToken": 0.59,
      "outputCostPerMToken": 2.10,
      "contextWindow": 131072
    }
  },
  "Settings": {
    "defaultRefreshInterval": 10,
    "maxRecentCalls": 10,
    "fallbackCostPerMToken": 0.01
  }
}
```

**Important**: The configuration file must be named `monitor-config.json` and placed in the `~/.claude-code-router/` directory for the monitor to find it.

## License

MIT