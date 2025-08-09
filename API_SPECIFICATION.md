# Resume Optimization API Specification

## Base URL
```
Production: https://your-app.render.com
Development: http://localhost:5000
```

## Authentication
Most endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
- Default: 1000 requests/day, 100 requests/hour
- Resume upload: 10/hour per user
- Comparison start: 5/minute per user

---

## 1. Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": 123
}
```

### POST /auth/login
Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "onboarding_stage": "READY",
    "has_default_resume": true
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:** `Authorization: Bearer <refresh_token>`

**Response (200):**
```json
{
  "access_token": "eyJ..."
}
```

### GET /auth/me
Get current user information.

**Response (200):**
```json
{
  "id": 123,
  "email": "user@example.com",
  "onboarding_stage": "READY",
  "default_resume_id": 456,
  "has_default_resume": true,
  "created_at": "2025-08-09T12:00:00Z"
}
```

### POST /auth/forgot-password
Send password reset email. *(To be implemented)*

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent if account exists"
}
```

### POST /auth/reset-password
Reset password with token. *(To be implemented)*

**Request Body:**
```json
{
  "token": "reset_token_here",
  "new_password": "new_secure_password"
}
```

---

## 2. Resume Management Endpoints

### POST /resumes/
Upload a new resume document.

**Request:** Multipart form data
- `file`: Resume file (PDF, DOCX, DOC, TXT)
- `title`: Optional title (defaults to filename)

**Response (201):**
```json
{
  "id": 456,
  "title": "My Resume.pdf",
  "user_id": 123,
  "file_url": null,
  "mime_type": "application/pdf",
  "size_bytes": 124580,
  "is_parsed": false,
  "is_default": false,
  "created_at": "2025-08-09T12:00:00Z"
}
```

### GET /resumes/
Get all user's resume documents.

**Response (200):**
```json
{
  "resumes": [
    {
      "id": 456,
      "title": "My Resume.pdf",
      "is_active": true,
      "is_parsed": true,
      "is_default": true,
      "mime_type": "application/pdf",
      "size_bytes": 124580,
      "created_at": "2025-08-09T12:00:00Z",
      "updated_at": "2025-08-09T12:05:00Z"
    }
  ],
  "total": 1
}
```

### GET /resumes/library
Enhanced library view with job optimization info. *(Enhanced)*

**Response (200):**
```json
{
  "resumes": [
    {
      "id": 456,
      "title": "My Resume.pdf",
      "is_default": true,
      "optimizations": [
        {
          "job_title": "Software Engineer",
          "session_id": 789,
          "created_at": "2025-08-09T12:00:00Z",
          "status": "DONE"
        }
      ],
      "analysis_summary": {
        "strengths_count": 5,
        "weaknesses_count": 3,
        "last_analyzed": "2025-08-09T12:00:00Z"
      },
      "created_at": "2025-08-09T12:00:00Z"
    }
  ]
}
```

### PATCH /resumes/{resume_id}/set-default
Set a resume as the default.

**Response (200):**
```json
{
  "message": "Default resume updated successfully"
}
```

### DELETE /resumes/{resume_id}
Soft delete a resume.

**Response (200):**
```json
{
  "message": "Resume deleted successfully"
}
```

### GET /resumes/{resume_id}/download
Download the original resume file.

**Response:** File download with appropriate content-type header.

---

## 3. Resume Analysis Endpoints

### POST /analyze/resume
Generate strengths and weaknesses analysis. *(New)*

**Request Body:**
```json
{
  "resume_id": 456,
  "analysis_type": "comprehensive"
}
```

**Response (200):**
```json
{
  "analysis_id": 789,
  "status": "RUNNING",
  "message": "Analysis started. Poll this endpoint for results."
}
```

### GET /analyze/resume/{analysis_id}
Get analysis results. *(New)*

**Response (200):**
```json
{
  "id": 789,
  "resume_id": 456,
  "status": "DONE",
  "results": {
    "strengths": [
      {
        "category": "Technical Skills",
        "description": "Strong programming background with 5+ years experience",
        "impact": "high"
      }
    ],
    "weaknesses": [
      {
        "category": "Formatting",
        "description": "Resume layout could be more modern and ATS-friendly",
        "impact": "medium",
        "suggestion": "Use cleaner section headers and bullet points"
      }
    ],
    "overall_score": 7.5,
    "ats_score": 6.8
  },
  "created_at": "2025-08-09T12:00:00Z",
  "completed_at": "2025-08-09T12:02:00Z"
}
```

### POST /analyze/job
Analyze job description for keywords and requirements.

**Request Body:**
```json
{
  "job_description": "We are looking for a Senior Software Engineer..."
}
```

**Response (200):**
```json
{
  "keywords": ["Python", "React", "AWS", "Microservices"],
  "required_skills": ["Python", "Database design"],
  "preferred_skills": ["React", "AWS"],
  "benefits": ["Remote work", "Health insurance"],
  "company_culture": ["Collaborative", "Innovation-focused"],
  "difficulty_level": "Senior",
  "match_score": null
}
```

---

## 4. Resume Comparison & Optimization Endpoints

### POST /compare/start
Start a resume comparison/optimization session.

**Request Body:**
```json
{
  "base_resume_id": 456,
  "alt_resume_id": null,
  "job_description": "We are seeking a Software Engineer...",
  "job_title": "Senior Software Engineer"
}
```

**Response (200):**
```json
{
  "session_id": 789,
  "status": "RUNNING",
  "steps": {
    "parse_base": {"state": "DONE"},
    "analyze": {"state": "RUNNING"},
    "suggest": {"state": "PENDING"}
  },
  "message": "Comparison session started"
}
```

### GET /compare/{session_id}
Get comparison session status and results.

**Response (200):**
```json
{
  "id": 789,
  "status": "DONE",
  "base_resume_id": 456,
  "job_description": "We are seeking...",
  "job_title": "Senior Software Engineer",
  "steps": {
    "parse_base": {"state": "DONE", "completed_at": "2025-08-09T12:00:30Z"},
    "analyze": {"state": "DONE", "completed_at": "2025-08-09T12:01:15Z"},
    "suggest": {"state": "DONE", "completed_at": "2025-08-09T12:02:00Z"},
    "rewrite": {"state": "DONE", "completed_at": "2025-08-09T12:02:45Z"}
  },
  "improvements": {
    "high_impact": [
      {
        "id": "imp_1",
        "category": "Skills Alignment",
        "description": "Add Python experience to technical skills",
        "original_text": "Programming: Java, C++",
        "improved_text": "Programming: Python, Java, C++",
        "impact_score": 9.2
      }
    ],
    "medium_impact": [
      {
        "id": "imp_2",
        "category": "Experience",
        "description": "Quantify achievements with metrics",
        "original_text": "Improved system performance",
        "improved_text": "Improved system performance by 35%",
        "impact_score": 7.1
      }
    ],
    "low_impact": []
  },
  "created_at": "2025-08-09T12:00:00Z",
  "updated_at": "2025-08-09T12:02:45Z"
}
```

### GET /compare/{session_id}/diff
Get detailed diff data for before/after comparison. *(Enhanced)*

**Response (200):**
```json
{
  "session_id": 789,
  "diff_data": {
    "changes": [
      {
        "type": "modification",
        "section": "Technical Skills",
        "line_number": 12,
        "before": "Programming: Java, C++",
        "after": "Programming: Python, Java, C++",
        "improvement_id": "imp_1"
      }
    ],
    "statistics": {
      "total_changes": 8,
      "additions": 3,
      "modifications": 4,
      "deletions": 1
    }
  },
  "editable_text": "Full improved resume text here..."
}
```

### POST /compare/{session_id}/edit
Save user edits to the improved text. *(New)*

**Request Body:**
```json
{
  "edited_text": "User's modified version of the improved resume..."
}
```

**Response (200):**
```json
{
  "message": "Edits saved successfully",
  "updated_at": "2025-08-09T12:05:00Z"
}
```

### POST /compare/{session_id}/export
Generate PDF export of comparison results.

**Request Body:**
```json
{
  "include_diff": true,
  "latex_style": "modern"
}
```

**Response (200):**
```json
{
  "message": "PDF generation started",
  "export_id": "exp_123",
  "estimated_time": "30 seconds"
}
```

### GET /compare/{session_id}/download
Download the generated PDF.

**Response:** PDF file download

---

## 5. Improvements Management Endpoints

### POST /improvements/categorize
Categorize improvements by impact level. *(New)*

**Request Body:**
```json
{
  "session_id": 789,
  "job_description": "We are seeking...",
  "improvement_text": "List of AI-generated improvements..."
}
```

**Response (200):**
```json
{
  "categorized_improvements": {
    "high_impact": [
      {
        "id": "imp_1",
        "category": "Skills Alignment",
        "description": "Add Python to technical skills",
        "impact_score": 9.2,
        "reasoning": "Python is mentioned 5 times in job description"
      }
    ],
    "medium_impact": [],
    "low_impact": []
  }
}
```

### POST /improvements/apply
Apply selected improvements to resume. *(New)*

**Request Body:**
```json
{
  "session_id": 789,
  "selected_improvements": ["imp_1", "imp_2", "imp_5"],
  "custom_instructions": "Keep the tone professional"
}
```

**Response (200):**
```json
{
  "status": "RUNNING",
  "message": "Applying selected improvements...",
  "job_id": "job_456"
}
```

---

## 6. Document Processing Endpoints

### POST /document/apply-improvements
Apply improvement suggestions to any document.

**Request Body:**
```json
{
  "document_text": "Original resume text...",
  "suggestions": "Improvement suggestions...",
  "document_type": "resume",
  "output_format": "text"
}
```

**Response (200):**
```json
{
  "improved_text": "Enhanced resume text...",
  "changes_applied": 5,
  "processing_time": "2.3s"
}
```

### POST /convert/latex
Convert LaTeX content to PDF.

**Request Body:**
```json
{
  "latex_content": "\\documentclass{article}...",
  "style": "modern"
}
```

**Response (200):**
```json
{
  "pdf_url": "/download/temp/generated.pdf",
  "conversion_time": "1.2s"
}
```

---

## 7. User Dashboard Endpoints

### GET /me/summary
Get user dashboard summary.

**Response (200):**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "onboarding_stage": "READY"
  },
  "resume_stats": {
    "total_resumes": 3,
    "active_resumes": 2,
    "default_resume": {
      "id": 456,
      "title": "Software Engineer Resume"
    }
  },
  "recent_activity": [
    {
      "type": "comparison",
      "session_id": 789,
      "job_title": "Senior Software Engineer",
      "status": "DONE",
      "created_at": "2025-08-09T12:00:00Z"
    }
  ],
  "quick_actions": [
    "analyze_resume",
    "job_application",
    "generate_pdf",
    "resume_library"
  ]
}
```

---

## 8. System Endpoints

### GET /health
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-09T12:00:00Z",
  "version": "1.0.0"
}
```

### GET /version
Get application version.

**Response (200):**
```json
{
  "version": "1.0.0",
  "build": "2025.08.09.001",
  "environment": "production"
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "message": "Missing required field: email",
  "code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Valid access token required",
  "code": "AUTH_REQUIRED"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "Resume with id 999 not found",
  "code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many resume uploads. Try again in 60 minutes",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

---

## Background Jobs & Polling

Several operations are asynchronous and require polling:

### Resume Analysis
1. POST `/analyze/resume` → Returns `analysis_id`
2. Poll GET `/analyze/resume/{analysis_id}` until `status: "DONE"`

### Comparison Sessions
1. POST `/compare/start` → Returns `session_id`  
2. Poll GET `/compare/{session_id}` until `status: "DONE"`

### PDF Export
1. POST `/compare/{session_id}/export` → Returns `export_id`
2. Poll or wait, then GET `/compare/{session_id}/download`

---

## Notes for Frontend Developer

1. **Authentication Flow**: Use login → store tokens → include in headers → refresh when needed
2. **File Uploads**: Use FormData for resume uploads with proper MIME type validation
3. **Polling Strategy**: Use exponential backoff (1s, 2s, 4s, 8s...) for long-running operations
4. **Error Handling**: All errors follow the same structure with `error`, `message`, and `code` fields
5. **Rate Limiting**: Display appropriate messages when rate limits are hit
6. **Real-time Updates**: Consider WebSocket implementation for live progress updates (future enhancement)
7. **Onboarding**: Check `onboarding_stage` to guide users through setup flow
8. **Default Resume**: Users can set a default resume to streamline the comparison flow

## Implementation Status
- ✅ **Implemented**: Authentication, Resume Management, Basic Analysis, Comparison Core
- 🟡 **Partially Implemented**: Document Processing, User Dashboard  
- 🔴 **To Be Implemented**: Password Reset, Enhanced Analysis, Improvements Management, Diff Editing