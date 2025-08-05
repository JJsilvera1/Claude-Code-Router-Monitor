# Claude Code Router Monitor

A standalone terminal-based monitoring tool for tracking Claude Code Router usage, including API calls, context window sizes, and cost estimates.

## Features

- **Real-time Monitoring**: Live dashboard updating every 10 seconds
- **Usage Statistics**: Track API calls, token counts, and costs
- **Model & Provider Breakdown**: See usage by model and provider
- **Cost Estimation**: Calculate costs based on configured pricing
- **Terminal Interface**: Color-coded, easy-to-read terminal dashboard
- **Standalone Tool**: Works without modifying claude-code-router
- **Smart Context Window Handling**: Automatically handles context window jumping between models by selecting the highest result from recent updates
- **Multi-Agent Context Progress Bars**: Visual progress bars showing context window usage for all active AI models
- **Activity-Based Agent Management**: Automatically tracks and displays active agents (within 3 minutes), removes inactive ones
- **Primary Agent Detection**: Automatically identifies and highlights the primary agent when multiple models are active
- **Model-Isolated Context Handling**: Context window shortening logic applies only to the same model, preventing cross-model interference

## Installation

### Prerequisites

1. First, ensure you have [claude-code-router](https://github.com/musistudio/claude-code-router) installed and running:
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

### Install Monitor Tool

3. Install the monitor tool:
   ```bash
   npm install -g ccr-monitor
   ```
   
   Or if you're installing from this directory:
   ```bash
   npm install -g .
   ```

## Usage

### Basic Monitoring

Start monitoring with:
```bash
ccr-monitor
```

### Advanced Commands

```bash
# Start monitoring with custom refresh interval (seconds)
ccr-monitor --interval 5

# Show help
ccr-monitor --help

# Check version
ccr-monitor --version

# Run in verbose mode for debugging
ccr-monitor --verbose
```

### Development Mode

If you're developing or testing the tool:

```bash
# Clone and build from source
git clone <repository-url>
cd Claude-Code-Router-Monitor
npm install
npm run build

# Run in development mode
npm run dev

# Test the built version
npm start
```

## Dashboard Display

The monitoring dashboard displays:

### Summary Section
- Total API calls made
- Total tokens processed  
- Total estimated costs

### Usage Breakdown
- **By Model**: Breakdown showing requests, tokens, and costs per model
- **By Provider**: Breakdown showing tokens and costs per provider

### Recent Activity
- Last 10 API calls with timestamps
- Model and provider information
- Token counts and estimated costs per call

### Active Agents Section
- **Context Progress Bars**: Visual representation of context window usage for each active AI model
- **Activity Tracking**: Shows agents with activity within the last 3 minutes
- **Primary Agent Identification**: Highlights the most active agent with `[PRIMARY]` marker
- **Real-time Updates**: Progress bars update in real-time as tokens are processed
- **Automatic Cleanup**: Inactive agents (>3 minutes) are automatically removed from display

#### Multi-Agent Example Display:
```
Active Agents - Context Progress:

  [PRIMARY] z-ai/glm-4.5 (openrouter)
    ████████████████████░░ 86.7% 111.5K / 128K [2m ago]

  google/gemini-2.5-pro-preview (openrouter)
    ████████░░░░░░░░░░░░░ 33.3% 699.1K / 2.1M [1m ago]
```

#### Progress Bar Color Coding:
- 🟢 **Green**: < 60% context usage
- 🟡 **Yellow**: 60-80% context usage  
- 🔴 **Red**: > 80% context usage

Real-time updates every 10 seconds (configurable with `--interval`).

Press `Ctrl+C` to exit the monitoring service.

## Configuration

### Monitor Configuration File

The monitor uses its own configuration file separate from claude-code-router. Create a monitor config file at:

**`~/.claude-code-router/monitor-config.json`**

Add pricing information for cost estimation:

```json
{
  "Pricing": {
    "openrouter,google/gemini-2.5-pro-preview": {
      "inputCostPerMToken": 0.0025,
      "outputCostPerMToken": 0.0075,
      "contextWindow": 2097152
    },
    "openrouter,z-ai/glm-4.5": {
      "inputCostPerMToken": 0.001,
      "outputCostPerMToken": 0.003,
      "contextWindow": 128000
    },
    "deepseek,deepseek-chat": {
      "inputCostPerMToken": 0.14,
      "outputCostPerMToken": 0.28,
      "contextWindow": 128000
    },
    "openai,gpt-4": {
      "inputCostPerMToken": 0.03,
      "outputCostPerMToken": 0.06,
      "contextWindow": 8192
    },
    "openai,gpt-3.5-turbo": {
      "inputCostPerMToken": 0.0015,
      "outputCostPerMToken": 0.002,
      "contextWindow": 4096
    }
  },
  "Settings": {
    "defaultRefreshInterval": 10,
    "maxRecentCalls": 10,
    "fallbackCostPerMToken": 0.01
  }
}
```

### Pricing Configuration

The pricing format uses the key: `provider,model` with the following properties:

- `inputCostPerMToken`: Cost per 1 million input tokens
- `outputCostPerMToken`: Cost per 1 million output tokens  
- `contextWindow`: Maximum context window size for the model

### Settings Configuration

- `defaultRefreshInterval`: Default refresh interval in seconds (default: 10)
- `maxRecentCalls`: Maximum number of recent calls to display (default: 10)
- `fallbackCostPerMToken`: Fallback cost when model-specific pricing isn't available

### Multi-Agent Configuration

For optimal multi-agent monitoring, ensure your monitor-config.json includes:

```json
{
  "Pricing": {
    "openrouter,google/gemini-2.5-pro-preview": {
      "inputCostPerMToken": 0.0025,
      "outputCostPerMToken": 0.0075,
      "contextWindow": 2097152
    },
    "openrouter,z-ai/glm-4.5": {
      "inputCostPerMToken": 0.001,
      "outputCostPerMToken": 0.003,
      "contextWindow": 128000
    },
    "anthropic,claude-3-opus": {
      "inputCostPerMToken": 0.015,
      "outputCostPerMToken": 0.075,
      "contextWindow": 200000
    },
    "openai,gpt-4": {
      "inputCostPerMToken": 0.03,
      "outputCostPerMToken": 0.06,
      "contextWindow": 8192
    }
  },
  "Settings": {
    "defaultRefreshInterval": 10,
    "maxRecentCalls": 10,
    "fallbackCostPerMToken": 0.01,
    "activityTimeoutMinutes": 3,
    "progressBarWidth": 30,
    "color thresholds": {
      "warning": 60,
      "critical": 80
    }
  }
}
```

#### Multi-Agent Settings Explained:

- **`activityTimeoutMinutes`**: Time in minutes before an agent is considered inactive (default: 3)
- **`progressBarWidth`**: Width of progress bars in characters (default: 30)
- **`color thresholds`**: Percentage thresholds for color coding:
  - `warning`: Yellow warning threshold (default: 60%)
  - `critical`: Red critical threshold (default: 80%)

#### Context Window Configuration Tips:

1. **Set accurate context windows**:
   ```json
   "contextWindow": 2097152  // 2M tokens for Gemini 2.5 Pro
   "contextWindow": 128000   // 128K tokens for GLM-4.5
   "contextWindow": 200000   // 200K tokens for Claude 3
   ```

2. **Configure multiple models**:
   Add all models you plan to use for comprehensive multi-agent tracking.

3. **Test configuration**:
   Use verbose mode to verify context windows are correctly detected:
   ```bash
   ccr-monitor --verbose
   ```

## How It Works

This tool reads usage data from claude-code-router's log files located at:
- **Data Source**: `~/.claude-code-router/claude-code-router-usage-data.json`
- **Monitor Config**: `~/.claude-code-router/monitor-config.json`

It uses the same data format and structure as the built-in monitor, ensuring compatibility with existing claude-code-router installations.

### Smart Context Window Handling

Claude Code Router often uses different context window sizes for different operations (e.g., coding vs. high-level work), which can cause token count jumping between updates. This monitor includes intelligent filtering to handle this:

- **Highest Result Selection**: From the 2 most recent results for each model, it selects the one with the highest token count
- **Context Window Shortening Detection**: When the token count decreases, it maintains the higher context window result until a higher one appears
- **Model-Specific Tracking**: Each model is tracked separately to ensure accurate filtering

This prevents the display from showing confusing jumps between different context window sizes and provides a more stable view of usage patterns.

### Multi-Agent Activity Management

The monitor can track multiple AI models working simultaneously and provides intelligent activity management:

#### Activity Tracking
- **3-Minute Activity Window**: Agents are considered "active" if they've made API calls within the last 3 minutes
- **Automatic Detection**: New agents are automatically detected and added to the display
- **Activity Persistence**: Agent activity state persists even between data updates

#### Primary Agent Logic
When multiple agents are active simultaneously, the monitor automatically identifies a "primary" agent:

```
Primary Agent Selection Logic:
┌─────────────────┐
│ Multiple Agents │
│   Active?      │
└─────────┬───────┘
          │ Yes
          ▼
┌─────────────────┐
│ Calculate Total │
│ Token Count per │
│     Agent       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Select Agent    │
│ with Highest    │
│ Token Count     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Mark as PRIMARY │
│ and Highlight   │
└─────────────────┘
```

#### Model-Isolated Context Handling
Context window shortening logic is strictly isolated per model to prevent cross-model interference:

**Example Scenario:**
```
Model A: High-context coding tasks (100K+ tokens)
Model B: Quick queries (1K tokens)

BEFORE (problematic):
├── Model A: 150K tokens (coding)
├── Model B: 2K tokens (quick query)  ← Wrong: Affects Model A display!
└── Display shows jumping between 150K ↔ 2K

AFTER (fixed):
├── Model A: 150K tokens (maintains highest context)
├── Model B: 2K tokens (tracked separately)
└── Each model has independent context window handling
```

#### Automatic Agent Lifecycle

The monitor manages agent lifecycles automatically:

```
Agent Lifecycle Management:
┌─────────────────┐    3 minutes    ┌─────────────────┐
│  Agent Active   │────────────────→│   Inactive      │
│ (Displaying)    │                 │ (Removed from   │
│                 │                 │   display)      │
└─────────┬───────┘                 └─────────────────┘
          │
          │ New Activity
          ▼
┌─────────────────┐
│  Agent Active   │
│ (Continued)     │
└─────────────────┘
```

#### Progress Bar Visualization

Context progress bars provide real-time visual feedback:

```
Progress Bar Components:
Model: [PRIMARY] z-ai/glm-4.5 (openrouter)
Bar:   ████████████████████░░ 86.7% 111.5K / 128K [2m ago]
       │      │              │    │       │       │
       │      │              │    │       │       └─ Last activity time
       │      │              │    │       └─ Max context window
       │      │              │    └─ Current token count
       │      │              └─ Usage percentage
       │      └─ Visual progress (█ = filled, ░ = empty)
       └─ Primary agent marker
```

### Advanced Use Cases

#### Scenario 1: Multi-Model Development Team
```
Active Agents:
├── [PRIMARY] gpt-4 (openai)       - Code review (150K tokens, 92% usage)
├── claude-3-opus (anthropic)     - Architecture design (800K tokens, 40% usage)
└── gemini-2.5-pro (google)       - Documentation generation (45K tokens, 35% usage)
```

#### Scenario 2: High-Frequency Trading Bot
```
Active Agents:
├── [PRIMARY] gpt-3.5-turbo (openai) - Quick market analysis (5K tokens, 4% usage, 30s ago)
├── claude-3-haiku (anthropic)      - Risk assessment (25K tokens, 13% usage, 1m ago)
└── gpt-4 (openai)                 - Strategy optimization (200K tokens, 25% usage, 2m ago)
```

#### Scenario 3: Content Creation Pipeline
```
Active Agents:
├── [PRIMARY] gemini-2.5-pro (google)    - Long-form article (1.8M tokens, 86% usage)
├── gpt-4 (openai)                      - Image generation prompts (8K tokens, 1% usage)
└── claude-3-sonnet (anthropic)         - SEO optimization (12K tokens, 6% usage)
```

This sophisticated multi-agent tracking system provides comprehensive visibility into complex AI workflows while maintaining clean, stable displays through intelligent filtering and activity management.

## Troubleshooting

### Common Issues

#### **No Usage Data Available**
If you see "No usage data available yet":

1. **Check if claude-code-router is running**:
   ```bash
   claude-code-router --help
   ```

2. **Verify logging is enabled**:
   Check `~/.claude-code-router/config.json` contains:
   ```json
   {
     "LOG": true
   }
   ```

3. **Confirm log file exists**:
   ```bash
   ls -la ~/.claude-code-router/claude-code-router-usage-data.json
   ```

4. **Make some API calls**:
   The monitor only shows data after claude-code-router has made API calls.

#### **Permission Errors**
If you encounter permission issues:

```bash
# Check permissions on claude-code-router directory
ls -la ~/.claude-code-router/

# Fix permissions if needed
chmod 755 ~/.claude-code-router/
chmod 644 ~/.claude-code-router/claude-code-router-usage-data.json
```

#### **Config File Not Found**
If the monitor config doesn't exist:

1. **Create the config directory**:
   ```bash
   mkdir -p ~/.claude-code-router
   ```

2. **Create monitor-config.json** with basic pricing (see Configuration section above)

3. **Verify file permissions**:
   ```bash
   chmod 644 ~/.claude-code-router/monitor-config.json
   ```

#### **Cost Estimation Not Working**
If costs show as $0.00 or incorrect:

1. **Check monitor-config.json format**:
   Verify the Pricing section is correctly formatted and matches your provider,model combinations.

2. **Verify model key format**:
   The key should be `provider,model` (e.g., `openrouter,google/gemini-2.5-pro-preview`).

3. **Check fallback pricing**:
   Ensure `Settings.fallbackCostPerMToken` is set for unknown models.

#### **Multi-Agent Progress Bars Not Showing**
If you don't see progress bars for active agents:

1. **Verify recent activity**:
   Agents must have made API calls within the last 3 minutes to be considered active.

2. **Check context window configuration**:
   Ensure `contextWindow` is properly set in monitor-config.json for each model:
   ```json
   {
     "Pricing": {
       "openrouter,z-ai/glm-4.5": {
         "contextWindow": 128000  // Must be set for progress bars
       }
     }
   }
   ```

3. **Confirm multiple models are active**:
   Progress bars only appear when agents are actively making calls. Try making calls with different models simultaneously.

4. **Check for recent timestamp format**:
   Ensure your usage data contains valid timestamps in ISO format.

#### **Primary Agent Detection Issues**
If the wrong agent is marked as primary:

1. **Check token count calculations**:
   Primary agent is determined by highest token count among active agents.

2. **Verify activity window**:
   Only agents active within the last 3 minutes are considered for primary selection.

3. **Monitor agent activity**:
   Use verbose mode to see agent detection logic:
   ```bash
   ccr-monitor --verbose
   ```

#### **Context Window Jumping Between Models**
If you see context window jumping across different models:

1. **Confirm model-isolated handling**:
   The monitor now applies context window logic per-model only. This should be resolved.

2. **Check for mixed model data**:
   Ensure your usage data correctly separates different model calls.

3. **Verify model keys in filtering**:
   Each model should have unique `model|provider` keys for proper isolation.

#### **Agents Disappearing Too Quickly**
If active agents vanish from display:

1. **Check 3-minute timeout**:
   Agents are removed after 3 minutes of inactivity. This is the expected behavior.

2. **Verify continuous activity**:
   Agents must make regular API calls to maintain active status.

3. **Check timestamp accuracy**:
   Ensure system clocks are synchronized and timestamps are current.

4. **Monitor for errors**:
   Use verbose mode to see agent lifecycle events:
   ```bash
   ccr-monitor --verbose
   ```

#### **Display Issues**
If the terminal display looks corrupted:

1. **Clear screen manually**:
   ```bash
   clear
   ```

2. **Try with different terminal**:
   Some terminals have better ANSI support than others.

3. **Check terminal settings**:
   Ensure your terminal supports ANSI color codes and proper character encoding.

#### **Performance Issues**
If the monitor feels slow or unresponsive:

1. **Adjust refresh interval**:
   ```bash
   ccr-monitor --interval 30  # Slower updates
   ```

2. **Reduce displayed data**:
   Lower `maxRecentCalls` in monitor-config.json.

3. **Check log file size**:
   Large usage data files can slow down processing.

### Debug Mode

Enable verbose logging for debugging:

```bash
ccr-monitor --verbose
```

Or check the log file contents directly:

```bash
# View usage data
cat ~/.claude-code-router/claude-code-router-usage-data.json

# View monitor config
cat ~/.claude-code-router/monitor-config.json

# Check file permissions and existence
ls -la ~/.claude-code-router/
```

### Getting Help

If issues persist:

1. **Check claude-code-router documentation**:
   Ensure your version is compatible and properly configured.

2. **Verify installation**:
   ```bash
   npm list -g ccr-monitor
   claude-code-router --version
   ```

3. **Report issues**:
   Include your OS, Node.js version, and relevant config files when reporting problems.

## Architecture

The monitor consists of several components:

- **log-reader.ts**: Handles reading usage data and config files
- **monitor.ts**: Main monitoring logic and display functions  
- **formatter.ts**: Terminal formatting and display utilities
- **types.ts**: TypeScript type definitions
- **index.ts**: Entry point and CLI interface

## License

MIT
