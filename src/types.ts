export interface UsageData {
  timestamp: string;
  model: string;
  provider: string;
  tokenCount: number;
  cost?: number;
}

export interface ModelPricing {
  inputCostPerMToken: number;
  outputCostPerMToken: number;
  contextWindow: number;
}