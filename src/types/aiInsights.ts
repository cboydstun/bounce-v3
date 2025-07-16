import { ReportCard } from "./reportCard";

export interface AIInsight {
  id: string;
  type: "opportunity" | "warning" | "trend" | "recommendation";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  affectedKeywords: string[];
  actionItems: string[];
  confidenceScore: number;
  generatedAt: string;
  category: "ranking" | "competitive" | "technical" | "content" | "performance";
  status: "new" | "in_progress" | "completed" | "dismissed";
  notes?: string;
  sessionId?: string;
  completedAt?: string;
  dismissedAt?: string;
  completedBy?: string;
  dismissedBy?: string;
}

export interface AIAnalysisRequest {
  reportCard: ReportCard;
  historicalData?: HistoricalRanking[];
  competitorData?: CompetitorRankingData[];
  analysisType:
    | "insights"
    | "summary"
    | "competitive"
    | "predictive"
    | "anomalies";
  focusAreas?: string[];
}

export interface AIAnalysisResponse {
  insights: AIInsight[];
  summary?: string;
  executiveSummary?: string;
  recommendations?: ActionableRecommendation[];
  predictions?: RankingPrediction[];
  anomalies?: Anomaly[];
  generatedAt: string;
  analysisType: string;
}

export interface HistoricalRanking {
  keyword: string;
  position: number;
  date: string;
  competitors: CompetitorInResults[];
}

export interface CompetitorRankingData {
  competitor: string;
  keyword: string;
  position: number;
  date: string;
  trend: "improving" | "declining" | "stable";
}

export interface CompetitorInResults {
  position: number;
  title: string;
  url: string;
  snippet?: string;
}

export interface ActionableRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "content" | "technical" | "competitive" | "keyword";
  estimatedImpact: "high" | "medium" | "low";
  timeToImplement: "quick" | "medium" | "long";
  affectedKeywords: string[];
  steps: string[];
  expectedOutcome: string;
}

export interface RankingPrediction {
  keyword: string;
  currentPosition: number;
  predictedPosition: number;
  confidence: number;
  timeframe: "30days" | "60days" | "90days";
  factors: string[];
  recommendations: string[];
  trend: "improving" | "declining" | "stable";
}

export interface Anomaly {
  id: string;
  type: "ranking_drop" | "ranking_spike" | "volatility" | "competitor_movement";
  severity: "high" | "medium" | "low";
  keyword: string;
  description: string;
  detectedAt: string;
  possibleCauses: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface CompetitiveAnalysis {
  marketPosition: string;
  strengthAreas: string[];
  weaknessAreas: string[];
  opportunities: CompetitiveOpportunity[];
  threats: CompetitiveThreat[];
  swotSummary: string;
}

export interface CompetitiveOpportunity {
  keyword: string;
  competitor: string;
  gap: number;
  difficulty: "easy" | "medium" | "hard";
  potentialImpact: "high" | "medium" | "low";
  strategy: string;
}

export interface CompetitiveThreat {
  keyword: string;
  competitor: string;
  theirPosition: number;
  yourPosition: number;
  trend: "increasing" | "stable" | "decreasing";
  urgency: "high" | "medium" | "low";
  mitigation: string;
}

export interface SEOChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  context?: {
    reportCard?: ReportCard;
    relatedKeywords?: string[];
    dataReferences?: string[];
  };
}

export interface SEOChatResponse {
  message: string;
  suggestions?: string[];
  relatedInsights?: AIInsight[];
  actionItems?: string[];
  dataReferences?: {
    type: "metric" | "keyword" | "competitor" | "trend";
    value: string;
    context: string;
  }[];
}

export interface PersonalizedStrategy {
  focusKeywords: KeywordPriority[];
  contentSuggestions: ContentIdea[];
  technicalFixes: TechnicalRecommendation[];
  competitiveActions: CompetitiveAction[];
  timeline: ActionTimeline;
  expectedOutcomes: string[];
}

export interface KeywordPriority {
  keyword: string;
  currentPosition: number;
  targetPosition: number;
  priority: "high" | "medium" | "low";
  reasoning: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTimeframe: string;
}

export interface ContentIdea {
  title: string;
  type: "blog_post" | "landing_page" | "product_page" | "faq";
  targetKeywords: string[];
  description: string;
  priority: "high" | "medium" | "low";
  estimatedImpact: string;
}

export interface TechnicalRecommendation {
  title: string;
  description: string;
  category: "speed" | "mobile" | "structure" | "crawling" | "indexing";
  priority: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  expectedImpact: string;
}

export interface CompetitiveAction {
  action: string;
  targetCompetitor: string;
  targetKeywords: string[];
  strategy: string;
  priority: "high" | "medium" | "low";
  timeframe: string;
}

export interface ActionTimeline {
  immediate: ActionItem[]; // 0-30 days
  shortTerm: ActionItem[]; // 30-90 days
  longTerm: ActionItem[]; // 90+ days
}

export interface ActionItem {
  task: string;
  category: "content" | "technical" | "competitive" | "monitoring";
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies?: string[];
  expectedOutcome: string;
}

// UI-related types
export interface InsightDisplayProps {
  insight: AIInsight;
  onActionClick?: (actionItem: string) => void;
  showDetails?: boolean;
}

export interface ChatInterfaceProps {
  reportContext: ReportCard;
  onInsightGenerated?: (insight: AIInsight) => void;
  maxMessages?: number;
}

export interface PredictionChartData {
  keyword: string;
  historical: { date: string; position: number }[];
  predicted: { date: string; position: number; confidence: number }[];
}

// Cache types for optimization
export interface AIResponseCache {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  analysisType: string;
}

export interface CacheConfig {
  insights: number; // 1 hour
  summary: number; // 4 hours
  competitive: number; // 2 hours
  predictions: number; // 24 hours
  chat: number; // 30 minutes
}

// Error types
export interface AIAnalysisError {
  code:
    | "API_ERROR"
    | "PARSING_ERROR"
    | "VALIDATION_ERROR"
    | "RATE_LIMIT"
    | "INSUFFICIENT_DATA";
  message: string;
  details?: any;
  retryable: boolean;
}

// Configuration types
export interface AIServiceConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  rateLimitPerHour: number;
  fallbackEnabled: boolean;
}
