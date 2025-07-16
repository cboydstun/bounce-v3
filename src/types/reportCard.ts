export interface ReportCardMetrics {
  averagePosition: string | number;
  visibilityScore: number;
  competitiveScore: number;
  consistencyScore: number;
  growthScore: number;
}

export interface KeywordBreakdown {
  top3: number;
  top10: number;
  top20: number;
  notFound: number;
}

export interface TrendAnalysis {
  positionTrend: "improving" | "declining" | "stable";
  visibilityTrend: "improving" | "declining" | "stable";
  competitiveTrend: "improving" | "declining" | "stable";
}

export interface TopPerformer {
  keyword: string;
  position: number;
  trend: "improving" | "declining" | "stable";
}

export interface KeywordNeedsAttention {
  keyword: string;
  position: number | string;
  issue: string;
  trend: "improving" | "declining" | "stable";
}

export interface CompetitorOpportunity {
  keyword: string;
  competitor: string;
  yourPosition: number;
  competitorPosition: number;
  gap: number;
}

export interface CompetitorAnalysis {
  totalCompetitors: number;
  outrankedPercentage: number;
  opportunities: CompetitorOpportunity[];
}

export interface ReportCard {
  overallGrade: string;
  overallScore: number;
  totalKeywords: number;
  metrics: ReportCardMetrics;
  keywordBreakdown: KeywordBreakdown;
  trends: TrendAnalysis;
  topPerformers: TopPerformer[];
  needsAttention: KeywordNeedsAttention[];
  competitorAnalysis: CompetitorAnalysis;
  generatedAt: string;
  period: string;
}

export interface ReportCardResponse {
  reportCard: ReportCard;
}

// Grade color mappings for UI
export const GRADE_COLORS = {
  A: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
    ring: "ring-green-500",
  },
  B: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    ring: "ring-blue-500",
  },
  C: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-200",
    ring: "ring-yellow-500",
  },
  D: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    ring: "ring-orange-500",
  },
  F: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    ring: "ring-red-500",
  },
  "N/A": {
    bg: "bg-gray-50",
    text: "text-gray-800",
    border: "border-gray-200",
    ring: "ring-gray-500",
  },
} as const;

// Trend color mappings for UI
export const TREND_COLORS = {
  improving: {
    bg: "bg-green-50",
    text: "text-green-800",
    icon: "↗",
  },
  declining: {
    bg: "bg-red-50",
    text: "text-red-800",
    icon: "↘",
  },
  stable: {
    bg: "bg-gray-50",
    text: "text-gray-800",
    icon: "→",
  },
} as const;

// Score thresholds for visual indicators
export const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 40,
} as const;
