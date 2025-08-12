# Expected API Response Types

This document specifies the exact TypeScript types expected from all backend API endpoints. **CRITICAL:** All array fields must be returned as proper JSON arrays, NOT comma-separated strings.

## ⚠️ CRITICAL ARRAY FIELDS

These fields **MUST** be returned as JSON arrays `["item1", "item2"]`, **NOT** comma-separated strings `"item1, item2"`:

- `keywords: string[]`
- `required_skills: string[]` 
- `preferred_skills: string[]`
- `benefits: string[]`
- `company_culture: string[]`
- `strengths: Array<{...}>`
- `weaknesses: Array<{...}>`
- `suggestions: OptimizationSuggestion[]`
- All improvement arrays (`high_impact`, `medium_impact`, `low_impact`)

---

## Auth Endpoints

### POST /auth/register
```typescript
interface RegisterResponse {
  message: string;
  user_id: number;
}
```

### POST /auth/login
```typescript
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
```

### POST /auth/refresh
```typescript
interface RefreshResponse {
  access_token: string;
}
```

### GET /auth/me
```typescript
interface UserResponse {
  id: number;
  email: string;
  onboarding_stage: string;
  default_resume_id?: number;
  has_default_resume: boolean;
  created_at: string;
}
```

---

## Resume Management

### POST /resumes/
```typescript
interface ResumeUploadResponse {
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
```

### GET /resumes/
```typescript
interface ResumesListResponse {
  resumes: Array<{
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
  }>;
  total: number;
}
```

### GET /resumes/library
```typescript
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
```

---

## Analysis Endpoints

### POST /analyze/job
**🚨 CRITICAL: All arrays must be JSON arrays, NOT comma-separated strings**
```typescript
interface JobAnalysisResponse {
  keywords: string[];              // ✅ ["React", "JavaScript"] ❌ "React, JavaScript"
  required_skills: string[];       // ✅ ["Python", "SQL"] ❌ "Python, SQL"  
  preferred_skills: string[];      // ✅ ["Docker", "AWS"] ❌ "Docker, AWS"
  benefits: string[];              // ✅ ["Health", "401k"] ❌ "Health, 401k"
  company_culture: string[];       // ✅ ["Remote", "Collaborative"] ❌ "Remote, Collaborative"
  difficulty_level: string;        // Single string value
  match_score: number | null;      // Number or null
}
```

### POST /analyze/resume
```typescript
interface ResumeAnalysisStartResponse {
  analysis_id: number;
  status: string;
  message: string;
}
```

### GET /analyze/resume/{analysis_id}
**🚨 CRITICAL: strengths and weaknesses must be proper arrays**
```typescript
interface ResumeAnalysisResponse {
  id: number;
  resume_id: number;
  status: 'RUNNING' | 'DONE' | 'ERROR';
  results?: {
    strengths: Array<{              // ✅ Must be array of objects
      category: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    weaknesses: Array<{             // ✅ Must be array of objects
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
```

---

## Comparison/Optimization Endpoints

### POST /compare/start
```typescript
interface ComparisonStartResponse {
  session_id: number;
  status: 'RUNNING';
  steps: {
    parse_base: { state: string };
    analyze: { state: string };
    suggest: { state: string };
  };
  message: string;
}
```

### GET /compare/{session_id}
**🚨 CRITICAL: All improvement arrays must be proper JSON arrays**
```typescript
interface ComparisonSessionResponse {
  id: number;
  status: 'RUNNING' | 'DONE' | 'ERROR';
  base_resume_id: number;
  job_description: string;
  job_title: string;
  steps: {
    parse_base: { state: string; completed_at?: string };
    analyze: { state: string; completed_at?: string };
    suggest: { state: string; completed_at?: string };
    rewrite: { state: string; completed_at?: string };
  };
  improvements?: {
    high_impact: Array<{            // ✅ Must be array of objects
      id: string;
      category: string;
      description: string;
      original_text?: string;
      improved_text?: string;
      impact_score: number;
    }>;
    medium_impact: Array<{          // ✅ Must be array of objects
      id: string;
      category: string;
      description: string;
      original_text?: string;
      improved_text?: string;
      impact_score: number;
    }>;
    low_impact: Array<{             // ✅ Must be array of objects
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
```

### GET /compare/{session_id}/diff
```typescript
interface ComparisonDiffResponse {
  session_id: number;
  diff_data: {
    changes: Array<{               // ✅ Must be array of objects
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
```

### POST /compare/{session_id}/edit
```typescript
interface EditResponse {
  message: string;
  updated_at: string;
}
```

### POST /compare/{session_id}/export
```typescript
interface ExportResponse {
  message: string;
  export_id: string;
  estimated_time: string;
}
```

---

## Document Processing

### POST /document/apply-improvements
```typescript
interface ApplyImprovementsResponse {
  improved_text: string;
  changes_applied: number;
  processing_time: string;
}
```

### POST /convert/latex
```typescript
interface ConvertLatexResponse {
  pdf_content: string;  // Base64 encoded PDF content
  conversion_time: string;
}
```

### POST /improvements/categorize
```typescript
interface CategorizeImprovementsResponse {
  categories: Array<{              // ✅ Must be array of objects
    name: string;
    count: number;
    improvements: string[];        // ✅ Must be array of strings
  }>;
}
```

### POST /improvements/apply
```typescript
interface ApplyImprovementsResponse {
  improved_text: string;
  applied_improvements: string[]; // ✅ Must be array of strings
  changes_count: number;
}
```

---

## User Dashboard

### GET /me/summary
```typescript
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
  recent_activity: Array<{         // ✅ Must be array of objects
    type: string;
    session_id?: number;
    job_title?: string;
    status: string;
    created_at: string;
  }>;
  quick_actions: string[];         // ✅ Must be array of strings
}
```

---

## System Endpoints

### GET /health
```typescript
interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}
```

### GET /version
```typescript
interface VersionResponse {
  version: string;
  build: string;
  environment: string;
}
```

---

## Legacy Resume Endpoints

### POST /extract-text
```typescript
interface ExtractTextResponse {
  text: string;
  metadata: {
    filename: string;
    file_type: string;
    word_count: number;
  };
}
```

### POST /suggest-improvements
**🚨 CRITICAL: suggestions must be a proper array**
```typescript
interface SuggestImprovementsResponse {
  suggestions: Array<{            // ✅ Must be array of objects
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: 'keywords' | 'formatting' | 'content' | 'skills';
    originalText?: string;
    suggestedText?: string;
  }>;
  // ❌ NOT: suggestions: "suggestion1, suggestion2, suggestion3"
}
```

### POST /apply-improvements
```typescript
interface ApplyImprovementsLegacyResponse {
  improved_text: string;
  changes_applied?: number;
  processing_time?: string;
}
```

---

## Error Response Format

All error responses should follow this format:
```typescript
interface APIErrorResponse {
  error: {
    message: string;
    status_code: number;
    error_code: string;
    detail: string;
    documentation_url?: string;
  };
}
```

---

## 🚨 BACKEND REQUIREMENTS SUMMARY

### Arrays Must Be JSON Arrays:
```json
✅ CORRECT:
{
  "keywords": ["React", "JavaScript", "TypeScript"],
  "benefits": ["Health Insurance", "401k", "Remote Work"],
  "strengths": [
    {
      "category": "Technical Skills", 
      "description": "Strong in React",
      "impact": "high"
    }
  ]
}

❌ INCORRECT:
{
  "keywords": "React, JavaScript, TypeScript",
  "benefits": "Health Insurance, 401k, Remote Work", 
  "strengths": "Strong technical skills, Good communication"
}
```

### Required HTTP Status Codes:
- `200` - Success
- `201` - Created 
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Required Headers:
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Headers: authorization, content-type`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`