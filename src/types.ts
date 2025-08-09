// Core usage tracking interfaces
export interface UsageData {
  timestamp: string;
  model: string;
  provider: string;
  tokenCount: number;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ModelPricing {
  inputCostPerMToken: number;
  outputCostPerMToken: number;
  contextWindow: number;
}

// Configuration interfaces
export interface MonitorConfig {
  Pricing?: Record<string, ModelPricing>;
}

// OpenRouter specific interfaces
export interface OpenRouterKey {
  created_at: string;
  updated_at: string;
  hash: string;
  label: string;
  name: string;
  disabled: boolean;
  limit: number;
  usage: number;
}

export interface OpenRouterUsageData {
  timestamp: string;
  totalKeys: number;
  totalUsage: number;
  totalLimit: number;
  creditsRemaining: number;
  keys: OpenRouterKey[];
}

export interface OpenRouterConfig {
  provisioningApiKey?: string;
  refreshInterval?: number;
}

// Display/Aggregation interfaces
export interface AggregatedUsage {
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { tokens: number; cost: number; count: number }>;
  byProvider: Record<string, { tokens: number; cost: number }>;
}

export interface OpenRouterAggregateData {
  totalRequests: number;
  totalUsage: number;
  totalLimit: number;
  averageUsagePerKey: number;
  keysWithUsage: number;
  disabledKeys: number;
  byKeyStatus: {
    active: { count: number; usage: number; limit: number };
    disabled: { count: number; usage: number; limit: number };
  };
}

// Error handling types
export class MonitorError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'MonitorError';
  }
}

export class ConfigError extends MonitorError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CONFIG_ERROR', originalError);
    this.name = 'ConfigError';
  }
}

export class LogParseError extends MonitorError {
  constructor(message: string, originalError?: Error) {
    super(message, 'LOG_PARSE_ERROR', originalError);
    this.name = 'LogParseError';
  }
}

export class OpenRouterError extends MonitorError {
  constructor(message: string, originalError?: Error) {
    super(message, 'OPENROUTER_ERROR', originalError);
    this.name = 'OpenRouterError';
  }
}