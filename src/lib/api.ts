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
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserResponse,
  UserSummaryResponse,
  CreateResumeRequest,
  CreateResumeResponse,
  ResumesListResponse,
  StartComparisonRequest,
  StartComparisonResponse,
  ComparisonSession,
  APIError,
  LegacyAPIError,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
      try {
        const errorData = await response.json();
        
        // Handle new API error format
        if (errorData.error) {
          const apiError: APIError = errorData;
          throw apiError;
        }
        
        // Handle legacy error format for backward compatibility
        const legacyError: LegacyAPIError = {
          message: errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          details: errorData.error || errorData.detail,
        };
        throw legacyError;
      } catch (parseError) {
        // If error response isn't JSON, create legacy error
        const fallbackError: LegacyAPIError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw fallbackError;
      }
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
      try {
        const errorData = await response.json();
        
        // Handle new API error format
        if (errorData.error) {
          const apiError: APIError = errorData;
          throw apiError;
        }
        
        // Handle legacy error format for backward compatibility
        const legacyError: LegacyAPIError = {
          message: errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          details: errorData.error || errorData.detail,
        };
        throw legacyError;
      } catch (parseError) {
        // If error response isn't JSON, create legacy error
        const fallbackError: LegacyAPIError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw fallbackError;
      }
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
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
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

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    return this.request<LoginResponse>('/auth/refresh', {
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

    const response = await fetch(`${API_BASE_URL}/resumes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        
        // Handle new API error format
        if (errorData.error) {
          const apiError: APIError = errorData;
          throw apiError;
        }
        
        // Handle legacy error format for backward compatibility
        const legacyError: LegacyAPIError = {
          message: errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          details: errorData.error || errorData.detail,
        };
        throw legacyError;
      } catch (parseError) {
        // If error response isn't JSON, create legacy error
        const fallbackError: LegacyAPIError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw fallbackError;
      }
    }

    return response.json();
  }

  async getResumes(): Promise<ResumesListResponse> {
    return this.request<ResumesListResponse>('/resumes/', {
      method: 'GET',
    }, true);
  }

  async setDefaultResume(resumeId: number): Promise<UserResponse> {
    return this.request<UserResponse>(`/resumes/${resumeId}/set-default`, {
      method: 'PATCH',
    }, true);
  }

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/resumes/${resumeId}`, {
      method: 'DELETE',
    }, true);
  }

  async downloadResume(resumeId: number): Promise<void> {
    const token = this.getAuthToken();
    const url = `${API_BASE_URL}/resumes/${resumeId}/download`;
    window.open(`${url}?token=${token}`, '_blank');
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

  async exportComparison(sessionId: number): Promise<{ message: string; session_id: number }> {
    return this.request<{ message: string; session_id: number }>(`/compare/${sessionId}/export`, {
      method: 'POST',
    }, true);
  }

  async downloadComparison(sessionId: number): Promise<void> {
    const token = this.getAuthToken();
    const url = `${API_BASE_URL}/compare/${sessionId}/download`;
    
    // Create a proper authenticated download
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `resume_comparison_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      throw new Error('Failed to download PDF');
    }
  }

  // Resume Optimization
  async optimizeResume(resumeId: string, jobDescription: string): Promise<{
    score: number;
    suggestions: Array<{
      category: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      suggestion: string;
      impact: number;
    }>;
    optimized_resume: {
      content: string;
      download_url?: string;
    };
  }> {
    return this.request(`/resumes/${resumeId}/optimize`, {
      method: 'POST',
      body: JSON.stringify({
        job_description: jobDescription
      }),
    }, true);
  }
}

export const apiClient = new APIClient();