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

// Authentication Types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
  };
}

export interface RefreshResponse {
  access_token: string;
}

export interface UserResponse {
  user: {
    id: number;
    email: string;
    created_at: string;
    updated_at: string;
  };
}

export interface UserSummaryResponse {
  has_default_resume: boolean;
  default_resume_id: number | null;
  onboarding_stage: 'NEW' | 'NEED_DEFAULT' | 'READY';
}

// Resume Document Types
export interface ResumeDocument {
  id: number;
  user_id: number;
  title: string;
  is_active: boolean;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  text_content: string | null;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResumeRequest {
  title: string;
  file: File;
}

export interface CreateResumeResponse {
  id: number;
  title: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
}

export interface ResumesListResponse {
  resumes: ResumeDocument[];
}

// Comparison Session Types
export interface ComparisonStep {
  state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface ComparisonSteps {
  parse_base: ComparisonStep;
  parse_alt: ComparisonStep;
  analyze: ComparisonStep;
  suggest: ComparisonStep;
  rewrite: ComparisonStep;
  diff: ComparisonStep;
  latex: ComparisonStep;
  pdf: ComparisonStep;
}

export interface DiffToken {
  op: 'keep' | 'add' | 'del' | 'replace';
  content: string;
  range?: [number, number];
}

export interface ExplanationItem {
  range: [number, number];
  category: string;
  note: string;
}

export interface ComparisonSession {
  id: number;
  user_id: number;
  base_resume_id: number;
  alt_resume_id: number | null;
  job_description: string | null;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  steps: ComparisonSteps;
  previews: {
    base_text: string;
    alt_text: string | null;
  };
  diff_json: DiffToken[];
  explanations: ExplanationItem[];
  improved_text: string;
  tex_content: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StartComparisonRequest {
  base_resume_id?: number;
  alt_resume_id?: number;
  job_description?: string;
}

export interface StartComparisonResponse {
  id: number;
  status: 'PENDING';
}

// API Error Type
export interface APIError {
  message: string;
  status: number;
  details?: string;
}