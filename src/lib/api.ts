import {
  JobAnalysisRequest,
  JobAnalysisResponse,
  ResumeExtractRequest,
  ResumeExtractResponse,
  ResumeOptimizationRequest,
  ResumeOptimizationResponse,
  LaTeXGenerationRequest,
  LaTeXGenerationResponse,
  APIError,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error: APIError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      
      try {
        const errorData = await response.json();
        error.details = errorData.detail || errorData.message;
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
}

export const apiClient = new APIClient();