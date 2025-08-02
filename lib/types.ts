export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  website?: string;
  location?: string;
  industry?: string;
  notes?: string;
  tags: string; // JSON string of tags
  source: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapingJob {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: number;
  errors?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastScraped?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapingResult {
  success: boolean;
  contacts: Contact[];
  errors: string[];
  totalFound: number;
}

export interface SearchFilters {
  company?: string;
  location?: string;
  industry?: string;
  title?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
} 