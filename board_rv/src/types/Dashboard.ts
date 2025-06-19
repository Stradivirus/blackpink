// board_rv/src/types/Dashboard.ts
export interface GCIRanking {
  country: string;
  rank: number;
  score: number;
  year: number;
}

export interface RiskyCountryFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    country: string;
    risk_level: string;
    alert_type?: string;
    timestamp: string;
  };
}