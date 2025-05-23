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
