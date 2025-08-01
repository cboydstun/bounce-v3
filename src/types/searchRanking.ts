// Competitor in search results
export interface Competitor {
  position: number;
  title: string;
  url: string;
  snippet?: string;
}

// Managed competitor (from Competitor model)
export interface ManagedCompetitor {
  _id: string;
  name: string;
  url: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchKeyword {
  _id: string;
  keyword: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchRanking {
  _id: string;
  keywordId: string;
  keyword: string;
  date: Date;
  position: number;
  url: string;
  competitors: Competitor[];
  metadata?: {
    totalResults: string;
    searchTime: string;
    resultCount: number;
    isValidationPassed: boolean;
    validationWarnings: string[];
    apiCallsUsed?: number;
    searchDepth?: number;
    maxPositionSearched?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Form data interfaces
export interface KeywordFormData {
  keyword: string;
  isActive?: boolean;
}

export interface CompetitorFormData {
  name: string;
  url: string;
  notes?: string;
  isActive?: boolean;
}

export interface RankingChangeNotification {
  keyword: string;
  previousPosition: number;
  currentPosition: number;
  change: number;
  date: Date;
  url: string;
}

// CSE Validation interfaces
export interface CseValidationResult {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  testResults: Array<{
    keyword: string;
    position: number;
    warnings: string[];
  }>;
}

export interface ValidationGuidance {
  checklistItems: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  commonIssues: Array<{
    issue: string;
    cause: string;
    solution: string;
  }>;
  cseConfigurationSteps: string[];
}

export interface RankingValidationStatus {
  isValid: boolean;
  warnings: string[];
}

// Enhanced batch progress tracking interfaces
export interface BatchKeywordProgress {
  keywordId: string;
  keyword: string;
  status: "pending" | "processing" | "completed" | "error";
  position?: number;
  error?: string;
  processedAt?: Date;
  processingTime?: number; // in milliseconds
}

export interface BatchProgress {
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed";
  keywordProgress: BatchKeywordProgress[];
  processedCount: number;
  totalCount: number;
  errorCount: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
}

export interface DetailedBatchStatus {
  totalBatches: number;
  pendingBatches: number;
  processingBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalKeywords: number;
  processedKeywords: number;
  progress: number;
  currentBatch?: BatchProgress;
  estimatedTimeRemaining?: number;
  apiCallsUsed: number;
  processingStartTime?: Date;
  averageKeywordTime?: number;
}

// New job queue types
export interface JobQueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  oldestPendingJob?: Date;
  newestCompletedJob?: Date;
  estimatedTimeRemaining?: number;
}

export interface JobProcessResult {
  success: boolean;
  jobId?: string;
  keyword?: string;
  position?: number;
  significantChange?: boolean;
  message: string;
  nextJobAvailable: boolean;
}

export interface JobCreationResult {
  success: boolean;
  jobsCreated: number;
  totalKeywords: number;
  message: string;
}

export interface BulkProgressUpdate {
  status: DetailedBatchStatus;
  message: string;
  timestamp: Date;
}

export interface BatchRankingResult {
  success: boolean;
  totalKeywords: number;
  processedKeywords: number;
  errors: number;
  significantChanges: number;
  duration: number;
  message: string;
  results: Array<{
    keyword: string;
    position: number;
    success: boolean;
    error?: string;
  }>;
  notifications: number;
}
