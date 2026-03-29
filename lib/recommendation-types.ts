export type InvestmentStyle = "稳健" | "均衡" | "进取";
export type InvestmentHorizon = "短线" | "波段" | "中期";

export type RecommendationRequest = {
  investmentStyle: InvestmentStyle;
  investmentHorizon: InvestmentHorizon;
  preferredSectors: string;
  stockPool: string;
  marketNotes: string;
};

export type StockRecommendation = {
  rank: number;
  name: string;
  symbol: string;
  sector: string;
  thesis: string;
  catalysts: string[];
  risks: string[];
  action: string;
  suitability: string;
  confidence: number;
};

export type RecommendationResponse = {
  summary: string;
  marketView: string;
  dataFreshness: string;
  recommendations: StockRecommendation[];
  watchlist: string[];
  riskWarning: string;
  disclaimer: string;
};
