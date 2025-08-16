import type { APIError, JobAnalysisRequest, JobAnalysisResponse } from './types';

const API_BASE_URL = 'https://resume-bknd.onrender.com';

// Auth interfaces
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    onboarding_stage: string;
    has_default_resume: boolean;
  };
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  user_id: number;
}

interface UserInfo {
  id: number;
  email: string;
  onboarding_stage: string;
  default_resume_id?: number;
  has_default_resume: boolean;
  created_at: string;
}

// Resume interfaces
interface Resume {
  id: number;
  title: string;
  user_id: number;
  file_url?: string;
  mime_type: string;
  size_bytes: number;
  is_parsed: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface ResumeLibraryResponse {
  resumes: Array<{
    id: number;
    title: string;
    is_default: boolean;
    optimizations: Array<{
      job_title: string;
      session_id: number;
      created_at: string;
      status: string;
    }>;
    analysis_summary?: {
      strengths_count: number;
      weaknesses_count: number;
      last_analyzed: string;
    };
    created_at: string;
  }>;
}

// Analysis interfaces
interface ResumeAnalysisRequest {
  resume_id: number;
  analysis_type: 'comprehensive';
}

interface ResumeAnalysisResponse {
  id: number;
  resume_id: number;
  status: 'RUNNING' | 'DONE' | 'ERROR';
  results?: {
    strengths: Array<{
      category: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    weaknesses: Array<{
      category: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      suggestion: string;
    }>;
    overall_score: number;
    ats_score: number;
  };
  created_at: string;
  completed_at?: string;
}

// Using JobAnalysisRequest and JobAnalysisResponse from ./types

// Comparison interfaces
interface ComparisonStartRequest {
  base_resume_id: number;
  job_description: string;
  job_title?: string; // Now optional - will be auto-extracted if not provided
}

interface ComparisonStartResponse {
  session_id: number;
  job_title: string; // Extracted or provided job title
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  steps: {
    parse_base: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    analyze: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    suggest: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    rewrite: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    diff?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    latex?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    pdf?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
  };
  message?: string;
  
  // Include the actual response data as well for backward compatibility
  id?: number; // Fallback field name
}

interface ComparisonSessionResponse {
  id: number;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  base_resume_id: number;
  job_description: string;
  job_title: string;
  steps: {
    parse_base: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    analyze: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    suggest: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    rewrite?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string }; // Only runs after user selection
    diff?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    latex?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
    pdf?: { state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED'; started_at?: string; completed_at?: string };
  };
  pdf_ready?: boolean;
  has_improved_text?: boolean;
  improved_text?: string; // Only populated after user selects improvements and calls apply-selected
  diff_json?: any; // Diff data between original and improved text
  tex_content?: string; // LaTeX content (generated after apply-selected)
  suggestions?: string; // Raw suggestions from OpenAI (legacy)
  analysis_results?: string; // Analysis of job description (keywords, benefits)
  original_resume_text?: string; // Original resume text for diff comparison
  improvements?: {
    high_impact: Array<{
      id: string;
      category: string;
      description: string;
      original_text?: string;
      improved_text?: string;
      impact_score: number;
    }>;
    medium_impact: Array<{
      id: string;
      category: string;
      description: string;
      original_text?: string;
      improved_text?: string;
      impact_score: number;
    }>;
    low_impact: Array<{
      id: string;
      category: string;
      description: string;
      original_text?: string;
      improved_text?: string;
      impact_score: number;
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface ComparisonDiffResponse {
  session_id: number; // Keep this as it's likely returned in diff endpoint
  diff_data: {
    changes: Array<{
      type: 'modification' | 'addition' | 'deletion';
      section: string;
      line_number: number;
      before?: string;
      after?: string;
      improvement_id?: string;
    }>;
    statistics: {
      total_changes: number;
      additions: number;
      modifications: number;
      deletions: number;
    };
  };
  editable_text: string;
}

// Artifact interfaces
interface SaveArtifactRequest {
  title?: string; // Optional custom title
}

interface SaveArtifactResponse {
  message: string;
  artifact_id: number;
  artifact: {
    id: number;
    title: string;
    job_title: string;
    has_pdf: boolean;
    has_latex: boolean;
    created_at: string;
    updated_at: string;
  };
}

interface Artifact {
  id: number;
  title: string;
  job_title: string;
  parent_resume_id: number;
  has_pdf: boolean;
  has_latex: boolean;
  created_at: string;
  updated_at: string;
  session_id: number;
  source_text?: string;
  improved_text?: string;
  tex_content?: string;
  job_description?: string;
  suggestions?: any;
}

interface ArtifactsListResponse {
  artifacts: Artifact[];
  total: number;
}

// Dashboard interface
interface DashboardSummaryResponse {
  user: {
    id: number;
    email: string;
    onboarding_stage: string;
  };
  resume_stats: {
    total_resumes: number;
    active_resumes: number;
    default_resume?: {
      id: number;
      title: string;
    };
  };
  recent_activity: Array<{
    type: string;
    session_id?: number;
    job_title?: string;
    status: string;
    created_at: string;
  }>;
  quick_actions: string[];
}

// Document processing interfaces
interface ApplyImprovementsRequest {
  document_text: string;
  suggestions: string;
  document_type?: string;
  output_format?: string;
}

interface ApplyImprovementsResponse {
  improved_text: string;
  changes_applied: number;
  processing_time: string;
}

class APIClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 Making ${options.method || 'GET'} request to:`, url);

    // Normalize headers to a plain record for safe mutation
    const normalizedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.headers) {
      const incoming = options.headers as HeadersInit;
      if (incoming instanceof Headers) {
        incoming.forEach((value, key) => {
          normalizedHeaders[key] = value;
        });
      } else if (Array.isArray(incoming)) {
        for (const [key, value] of incoming) {
          normalizedHeaders[key] = value;
        }
      } else {
        Object.assign(normalizedHeaders, incoming as Record<string, string>);
      }
    }

    // Add auth token if available and not already present
    if (this.accessToken && !('Authorization' in normalizedHeaders)) {
      normalizedHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      headers: normalizedHeaders,
      ...options,
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh') {
      try {
        await this.refreshAccessToken();
        // Retry the request with new token
        normalizedHeaders['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers: normalizedHeaders,
        });
        
        if (!retryResponse.ok) {
          throw new Error('Request failed after token refresh');
        }
        
        return retryResponse.json();
      } catch {
        // Refresh failed, clear tokens and redirect to login
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error: APIError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.details = errorData.message || errorData.detail;
      } catch {
        // If error response isn't JSON, use status text
      }
      
      throw error;
    }

    return response.json();
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('resum8_user_session');
      localStorage.removeItem('resum8_user_data');
    }
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshAccessToken(): Promise<{ access_token: string }> {
    const response = await this.request<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.refreshToken}`,
      },
    });

    this.accessToken = response.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token);
    }

    return response;
  }

  async getCurrentUser(): Promise<UserInfo> {
    return this.request<UserInfo>('/auth/me');
  }

  logout() {
    this.clearTokens();
  }

  // Resume management endpoints
  async uploadResume(file: File, title?: string): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const url = `${API_BASE_URL}/resumes/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error: APIError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.details = errorData.message || errorData.detail;
      } catch {
        // If error response isn't JSON, use status text
      }
      
      throw error;
    }

    return response.json();
  }

  async getResumes(): Promise<{ resumes: Resume[]; total: number }> {
    return this.request<{ resumes: Resume[]; total: number }>('/resumes/');
  }

  async getResumeLibrary(): Promise<ResumeLibraryResponse> {
    return this.request<ResumeLibraryResponse>('/resumes/library');
  }

  async setDefaultResume(resumeId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resumes/${resumeId}/set-default`, {
      method: 'PATCH',
    });
  }

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resumes/${resumeId}`, {
      method: 'DELETE',
    });
  }

  async downloadResume(resumeId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // Analysis endpoints
  async analyzeResume(data: ResumeAnalysisRequest): Promise<ResumeAnalysisResponse | { analysis_id: number; status: string; message: string }> {
    return this.request<ResumeAnalysisResponse | { analysis_id: number; status: string; message: string }>('/analyze/resume', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getResumeAnalysis(analysisId: number): Promise<ResumeAnalysisResponse> {
    return this.request<ResumeAnalysisResponse>(`/analyze/resume/${analysisId}`);
  }

  async analyzeJob(data: JobAnalysisRequest): Promise<JobAnalysisResponse> {
    return this.request<JobAnalysisResponse>('/analyze/job', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Comparison endpoints
  async startComparison(data: ComparisonStartRequest): Promise<ComparisonStartResponse> {
    console.log('🚀 startComparison called with data:', data);
    console.log('🌐 Making request to /compare/start');
    
    const response = await this.request<ComparisonStartResponse>('/compare/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('✅ Comparison API response received:', response);
    return response;
  }

  async getComparisonSession(sessionId: number): Promise<ComparisonSessionResponse> {
    return this.request<ComparisonSessionResponse>(`/compare/${sessionId}`);
  }

  async validateComparisonSession(sessionId: number): Promise<{ valid: boolean; status: string; message?: string }> {
    try {
      const session = await this.getComparisonSession(sessionId);
      
      // Check if session is in a valid state
      if (session.status === 'ERROR') {
        return {
          valid: false,
          status: 'ERROR',
          message: 'Session processing failed'
        };
      }
      
      if (session.status === 'RUNNING') {
        return {
          valid: true,
          status: 'RUNNING',
          message: 'Session is still processing'
        };
      }
      
      if (session.status === 'DONE') {
        return {
          valid: true,
          status: 'DONE',
          message: 'Session is ready'
        };
      }
      
      return {
        valid: true,
        status: session.status,
        message: 'Session exists'
      };
      
    } catch (error) {
      return {
        valid: false,
        status: 'NOT_FOUND',
        message: error instanceof Error ? error.message : 'Session not found'
      };
    }
  }

  async getComparisonDiff(sessionId: number): Promise<ComparisonDiffResponse> {
    return this.request<ComparisonDiffResponse>(`/compare/${sessionId}/diff`);
  }

  async getImprovedText(sessionId: number): Promise<{ improved_text: string }> {
    return this.request<{ improved_text: string }>(`/compare/${sessionId}/improved-text`);
  }

  async editComparisonText(sessionId: number, editedText: string): Promise<{ message: string; updated_at: string; pdf_ready: boolean }> {
    return this.request<{ message: string; updated_at: string; pdf_ready: boolean }>(`/compare/${sessionId}/improved-text`, {
      method: 'PUT',
      body: JSON.stringify({ improved_text: editedText }),
    });
  }

  async applySelectedImprovements(sessionId: number, selectedImprovementIds: string[], customInstructions?: string): Promise<{
    message: string;
    improved_text: string;
    applied_improvements: string[];
    applied_count: number;
    updated_at: string;
    pdf_ready: boolean;
    latex_ready: boolean;
    steps: {
      rewrite: string;
      diff: string;
      latex: string;
      pdf: string;
    };
  }> {
    console.log('🔗 Making request to /compare/{id}/apply-selected with:', {
      endpoint: `/compare/${sessionId}/apply-selected`,
      method: 'PUT',
      url: `${API_BASE_URL}/compare/${sessionId}/apply-selected`,
      payload: {
        selected_improvement_ids: selectedImprovementIds,
        custom_instructions: customInstructions
      }
    });

    // First, let's test if the endpoint exists by checking the session
    try {
      const session = await this.getComparisonSession(sessionId);
      console.log('📊 Session exists and is accessible:', {
        sessionId: session.id,
        status: session.status,
        hasImprovements: !!session.improvements
      });
    } catch (sessionError) {
      console.error('❌ Cannot access session before applying improvements:', sessionError);
      throw new Error('Session not accessible - cannot apply improvements');
    }

    try {
      const result = await this.request<{
        message: string;
        improved_text: string;
        applied_improvements: string[];
        applied_count: number;
        updated_at: string;
        pdf_ready: boolean;
        latex_ready: boolean;
        steps: {
          rewrite: string;
          diff: string;
          latex: string;
          pdf: string;
        };
      }>(`/compare/${sessionId}/apply-selected`, {
        method: 'PUT',
        body: JSON.stringify({
          selected_improvement_ids: selectedImprovementIds,
          custom_instructions: customInstructions
        }),
      });

      console.log('✅ /compare/{id}/apply-selected successful, received:', result);
      return result;
    } catch (error) {
      console.error('🚨 Detailed error for apply-selected endpoint:', {
        error,
        endpoint: `/compare/${sessionId}/apply-selected`,
        fullUrl: `${API_BASE_URL}/compare/${sessionId}/apply-selected`,
        method: 'PUT',
        sessionId,
        selectedImprovementIds
      });
      throw error;
    }
  }

  async exportComparison(sessionId: number, options: { include_diff: boolean; latex_style: string }): Promise<{ message: string; export_id: string; estimated_time: string }> {
    return this.request<{ message: string; export_id: string; estimated_time: string }>(`/compare/${sessionId}/export`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async downloadComparison(sessionId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/compare/${sessionId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // DEPRECATED: LaTeX is generated automatically during session creation
  // Use the session data directly or trigger regeneration via PUT /improved-text
  async generateLatex(sessionId: number, options: {
    latex_style?: 'modern' | 'classic' | 'minimal';
    custom_text?: string;
  }): Promise<{
    latex_content: string;
    text_source: 'custom' | 'session';
  }> {
    console.log('⚠️ generateLatex is deprecated - LaTeX is auto-generated in session');
    
    // If custom text is provided, update the session improved text first
    if (options.custom_text) {
      await this.editComparisonText(sessionId, options.custom_text);
    }
    
    // Get the session data which should include the LaTeX content
    const session = await this.getComparisonSession(sessionId);
    
    if (!session.tex_content) {
      throw new Error('No LaTeX content found in session. Session may not be complete.');
    }
    
    return {
      latex_content: session.tex_content,
      text_source: options.custom_text ? 'custom' : 'session'
    };
  }

  // DEPRECATED: Use getComparisonSession() and getImprovedText() instead
  async getComparisonResumeText(sessionId: number): Promise<{
    session_id: number;
    original_text: string;
    improved_text: string;
    resume_title: string;
  }> {
    // Fallback for backward compatibility - use session endpoint instead
    const session = await this.getComparisonSession(sessionId);
    const improved = await this.getImprovedText(sessionId);
    
    return {
      session_id: sessionId,
      original_text: session.improved_text || '', // We'll get this from session
      improved_text: improved.improved_text,
      resume_title: session.job_title || 'Resume'
    };
  }


  // Document processing endpoints
  async applyImprovements(data: ApplyImprovementsRequest): Promise<ApplyImprovementsResponse> {
    return this.request<ApplyImprovementsResponse>('/document/apply-improvements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async convertToLatex(latexContent: string, style: string = 'modern'): Promise<{ pdf_url?: string; pdf_content?: string; conversion_time: string }> {
    return this.request<{ pdf_url?: string; pdf_content?: string; conversion_time: string }>('/convert/latex', {
      method: 'POST',
      body: JSON.stringify({
        latex_content: latexContent,
        style,
      }),
    });
  }

  // Dashboard endpoint
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return this.request<DashboardSummaryResponse>('/me/summary');
  }

  // Artifact endpoints
  async saveArtifact(sessionId: number, data: SaveArtifactRequest = {}): Promise<SaveArtifactResponse> {
    return this.request<SaveArtifactResponse>(`/compare/${sessionId}/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getArtifacts(): Promise<ArtifactsListResponse> {
    return this.request<ArtifactsListResponse>('/compare/artifacts');
  }

  async getArtifact(artifactId: number, includeContent: boolean = false): Promise<Artifact> {
    const queryParam = includeContent ? '?include_content=true' : '';
    return this.request<Artifact>(`/compare/artifacts/${artifactId}${queryParam}`);
  }

  async downloadArtifact(artifactId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/compare/artifacts/${artifactId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Artifact download failed');
    }

    return response.blob();
  }

  // System endpoints
  async checkHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request<{ status: string; timestamp: string; version: string }>('/health');
  }

  async getVersion(): Promise<{ version: string; build: string; environment: string }> {
    return this.request<{ version: string; build: string; environment: string }>('/version');
  }
}

export const apiClient = new APIClient();