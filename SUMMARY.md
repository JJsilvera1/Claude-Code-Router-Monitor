# Claude Code Router Monitor - Summary

## Problem
The ccr-monitor tool was not displaying any usage data because it couldn't find the required `claude-code-router-usage-data.json` file.

## Root Cause
The claude-code-router was logging usage information to `claude-code-router.log` but not generating the JSON file that the monitor expected.

## Solution
We created a log parser service (`ccr-log-parser`) that:

1. Parses the claude-code-router log file (`~/.claude-code-router/claude-code-router.log`)
2. Extracts usage information including:
   - Timestamp of each API call
   - Model used for the call
   - Provider of the model
   - Token count for the call
3. Generates a JSON file (`~/.claude-code-router/claude-code-router-usage-data.json`) with this usage data
4. Continuously monitors the log file for new entries and updates the JSON file

## New Feature: Context Window Visualization
We've added a new feature that displays context window usage with ASCII bar charts:
- Shows current token usage against the model's context window limit
- Uses color coding (green/yellow/red) based on usage percentage
- Displays model name, current tokens, and context window size
- Updates in real-time with the monitor

## Components
- `ccr-log-parser`: Background service that parses logs and generates usage data
- `ccr-monitor`: Real-time monitoring dashboard that displays usage statistics

## Usage
1. Start the log parser service: `ccr-log-parser`
2. In a separate terminal, start monitoring: `ccr-monitor`

## Results
The monitor now displays:
- Context window usage visualization with ASCII bar charts
- Total API calls, tokens, and estimated costs
- Usage breakdown by model and provider
- Recent API calls with timestamps
- Real-time updates every 10 seconds

## Configuration
To enable cost estimation and context window visualization, add pricing information to your claude-code-router config file.