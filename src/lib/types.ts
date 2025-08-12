// Job Analysis Types
export interface JobAnalysisRequest {
  job_description: string;
}

export interface JobAnalysisResponse {
  keywords: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: string[];
  company_culture: string[];
  difficulty_level: string;
  match_score: number | null;
}

// Resume Processing Types
export interface ResumeExtractRequest {
  file: File;
}

export interface ResumeExtractResponse {
  text: string;
  metadata: {
    filename: string;
    file_type: string;
    word_count: number;
  };
}

// Resume Optimization Types
export interface ResumeOptimizationRequest {
  resume_text: string;
  job_description: string;
  job_keywords?: string[];
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'keywords' | 'formatting' | 'content' | 'skills';
  originalText?: string;
  suggestedText?: string;
}

export interface ResumeOptimizationResponse {
  suggestions: OptimizationSuggestion[] | string; // Can be array or string from backend
  rawSuggestions?: string; // Keep for backward compatibility
}

// Document Apply Improvements Types
export interface ApplyImprovementsRequest {
  document_text: string; // Required
  suggestions: string; // Required
  document_type?: string; // Optional, default: 'general'
  output_format?: string; // Optional, default: 'text'
}

export interface ApplyImprovementsResponse {
  improved_text: string;
  changes_applied?: number;
  processing_time?: string;
}

// LaTeX Generation Types (legacy - keeping for backward compatibility)
export interface LaTeXGenerationRequest {
  latex_content: string;
}

export interface LaTeXGenerationResponse {
  latex_code: string;
  pdf_url?: string;
  compilation_status: 'success' | 'error';
  error_message?: string;
}

// Resume Analysis Types
export interface AnalysisResult {
  overall_score: number;
  ats_score: number;
  strengths: Array<{ category: string; impact: string; description: string }>;
  weaknesses: Array<{ id?: string; category: string; impact: string; description: string; suggestion: string }>;
  resume_text?: string;
}

// Application State Types
export interface AppState {
  currentStep: 'upload' | 'analyze' | 'optimize' | 'generate';
  jobDescription: string;
  resumeFile?: File;
  resumeText: string; // Original resume text
  optimizedResumeText?: string; // Optimized resume text after improvements
  resumeId: number | null;
  comparisonSessionId?: number | null; // Session ID for the comparison
  jobAnalysis?: JobAnalysisResponse;
  analysisResults?: AnalysisResult;
  optimizationResults?: ResumeOptimizationResponse;
  selectedSuggestions: string[]; // Array of suggestion IDs
  latexResult?: LaTeXGenerationResponse;
}

// API Error Type
export interface APIError {
  message: string;
  status: number;
  details?: string;
}