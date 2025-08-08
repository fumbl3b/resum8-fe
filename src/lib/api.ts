import {
  JobAnalysisRequest,
  JobAnalysisResponse,
  ResumeExtractRequest,
  ResumeExtractResponse,
  ResumeOptimizationRequest,
  ResumeOptimizationResponse,
  ApplyImprovementsRequest,
  ApplyImprovementsResponse,
  LaTeXGenerationRequest,
  LaTeXGenerationResponse,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  UserResponse,
  UserSummaryResponse,
  CreateResumeRequest,
  CreateResumeResponse,
  ResumesListResponse,
  ResumeDocument,
  StartComparisonRequest,
  StartComparisonResponse,
  ComparisonSession,
  APIError,
} from './types';

const API_BASE_URL = 'https://resume-bknd.onrender.com';

class APIClient {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const error: APIError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.details = errorData.detail || errorData.message || errorData.error;
      } catch {
        // If error response isn't JSON, use status text
      }
      
      throw error;
    }

    return response.json();
  }

  async analyzeJob(data: JobAnalysisRequest): Promise<JobAnalysisResponse> {
    return this.request<JobAnalysisResponse>('/analyze/job', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async extractResumeText(file: File): Promise<ResumeExtractResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resume/extract-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: APIError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.details = errorData.error?.detail || errorData.detail || errorData.message;
        console.error('Backend error details:', errorData);
      } catch {
        // If error response isn't JSON, use status text
        console.error('Non-JSON error response');
      }
      
      throw error;
    }

    return response.json();
  }

  async suggestImprovements(
    data: ResumeOptimizationRequest
  ): Promise<ResumeOptimizationResponse> {
    return this.request<ResumeOptimizationResponse>('/resume/suggest-improvements', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true); // Requires auth
  }

  async applyImprovements(
    data: ApplyImprovementsRequest
  ): Promise<ApplyImprovementsResponse> {
    return this.request<ApplyImprovementsResponse>('/document/apply-improvements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateLaTeX(
    data: LaTeXGenerationRequest
  ): Promise<LaTeXGenerationResponse> {
    return this.request<LaTeXGenerationResponse>('/convert/latex', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Auth methods
  async register(data: RegisterRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(): Promise<RefreshResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    }, true);
  }

  async getUserSummary(): Promise<UserSummaryResponse> {
    return this.request<UserSummaryResponse>('/me/summary', {
      method: 'GET',
    }, true);
  }

  // Resume Management
  async createResume(data: CreateResumeRequest): Promise<CreateResumeResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);

    const response = await fetch(`${API_BASE_URL}/resumes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
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
        error.details = errorData.detail || errorData.message || errorData.error;
      } catch {
        // If error response isn't JSON, use status text
      }
      
      throw error;
    }

    return response.json();
  }

  async getResumes(): Promise<ResumesListResponse> {
    return this.request<ResumesListResponse>('/resumes', {
      method: 'GET',
    }, true);
  }

  async setDefaultResume(resumeId: number): Promise<void> {
    return this.request<void>(`/resumes/${resumeId}/set-default`, {
      method: 'PATCH',
    }, true);
  }

  async deleteResume(resumeId: number): Promise<void> {
    return this.request<void>(`/resumes/${resumeId}`, {
      method: 'DELETE',
    }, true);
  }

  // Comparison Sessions
  async startComparison(data: StartComparisonRequest): Promise<StartComparisonResponse> {
    return this.request<StartComparisonResponse>('/compare/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async getComparison(sessionId: number): Promise<ComparisonSession> {
    return this.request<ComparisonSession>(`/compare/${sessionId}`, {
      method: 'GET',
    }, true);
  }

  async exportComparison(sessionId: number): Promise<void> {
    return this.request<void>(`/compare/${sessionId}/export`, {
      method: 'POST',
    }, true);
  }

  async downloadComparison(sessionId: number): Promise<void> {
    // This will redirect to the PDF URL
    window.open(`${API_BASE_URL}/compare/${sessionId}/download`, '_blank');
  }
}

export const apiClient = new APIClient();