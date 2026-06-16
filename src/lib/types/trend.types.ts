export interface Trend {
  id: string;
  topic: string;
  trendScore: number;
  growthRate: string;
  viralProbability: "High" | "Medium" | "Low";
  contentAngles: string[];
}

export interface TrendSearchParams {
  niche: string;
  country?: string;
  platform?: string;
}
