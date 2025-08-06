// Job Analysis Types
export interface JobAnalysisRequest {
  job_description: string;
}

export interface JobAnalysisResponse {
  keywords: string[];
  benefits: string[];
  requirements: string[];
  insights: {
    company_culture?: string;
    role_focus?: string;
    required_skills?: string[];
    preferred_skills?: string[];
  };
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
}

export interface OptimizationSuggestion {
  id: string;
  type: 'addition' | 'modification' | 'removal' | 'keyword';
  section: string;
  current_text?: string;
  suggested_text: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface ResumeOptimizationResponse {
  suggestions: OptimizationSuggestion[];
  overall_score: number;
  keyword_match_percentage: number;
  missing_keywords: string[];
}

// LaTeX Generation Types
export interface LaTeXGenerationRequest {
  resume_text: string;
  template?: string;
  optimizations?: OptimizationSuggestion[];
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
  acceptedSuggestions: string[];
  latexResult?: LaTeXGenerationResponse;
}

// API Error Type
export interface APIError {
  message: string;
  status: number;
  details?: string;
}