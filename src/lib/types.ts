// Job Analysis Types
export interface JobAnalysisRequest {
  job_description: string;
}

export interface JobAnalysisResponse {
  keywords: string;
  benefits: string;
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
  improved_content: string; // The actual response field
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

// Application State Types
export interface AppState {
  currentStep: 'upload' | 'analyze' | 'optimize' | 'generate';
  jobDescription: string;
  resumeFile?: File;
  resumeText: string;
  jobAnalysis?: JobAnalysisResponse;
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