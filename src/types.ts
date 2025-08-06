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