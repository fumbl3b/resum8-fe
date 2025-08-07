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

export interface ResumeOptimizationResponse {
  suggestions: string;
}

// Document Apply Improvements Types
export interface ApplyImprovementsRequest {
  resume_text: string;
  improvements: string;
}

export interface ApplyImprovementsResponse {
  latex_code: string;
  pdf_url?: string;
  compilation_status: 'success' | 'error';
  error_message?: string;
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
  latexResult?: LaTeXGenerationResponse;
}

// API Error Type
export interface APIError {
  message: string;
  status: number;
  details?: string;
}