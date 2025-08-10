# Frontend API Usage Documentation

This document outlines how the Resum8 frontend interacts with the backend API to ensure proper integration and compatibility.

## API Base Configuration

**Current Setup:**
- Frontend uses Next.js proxy: `/api/*` → `https://resume-bknd.onrender.com/*`
- All requests go through Next.js rewrites to avoid CORS issues
- Expected backend base URL: `https://resume-bknd.onrender.com`

## Authentication Flow

### User Registration
**Endpoint:** `POST /auth/register`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Expected Response:** ✅ **FIXED IN BACKEND**
```json
{
  "message": "User created successfully",
  "user_id": 123
}
```

### User Login
**Endpoint:** `POST /auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Expected Response:** ✅ **FIXED IN BACKEND**
```json
{
  "access_token": "jwt_access_token_here",
  "refresh_token": "jwt_refresh_token_here",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "onboarding_stage": "completed",
    "has_default_resume": true
  }
}
```

### Token Refresh
**Endpoint:** `POST /auth/refresh`
**Headers:**
```
Authorization: Bearer <refresh_token>
```
**Expected Response:**
```json
{
  "access_token": "new_jwt_access_token_here"
}
```

### Get Current User
**Endpoint:** `GET /auth/me`
**Headers:**
```
Authorization: Bearer <access_token>
```
**Expected Response:** ✅ **FIXED IN BACKEND**
```json
{
  "id": 123,
  "email": "user@example.com",
  "onboarding_stage": "completed",
  "default_resume_id": 456,
  "has_default_resume": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```
**Note:** Backend now returns direct response format (not nested under "user" object)

## Resume Management

### Upload Resume
**Endpoint:** `POST /resumes/`
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```
**Request:** FormData with:
- `file`: Resume file (PDF, DOC, etc.)
- `title`: Optional resume title

**Expected Response:**
```json
{
  "id": 789,
  "title": "Software Engineer Resume",
  "user_id": 123,
  "file_url": "https://storage.example.com/resume.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 245760,
  "is_parsed": false,
  "is_default": false,
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Get Resumes List
**Endpoint:** `GET /resumes/`
**Headers:**
```
Authorization: Bearer <access_token>
```
**Expected Response:**
```json
{
  "resumes": [
    {
      "id": 789,
      "title": "Software Engineer Resume",
      "user_id": 123,
      "file_url": "https://storage.example.com/resume.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 245760,
      "is_parsed": true,
      "is_default": true,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T01:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Resume Library
**Endpoint:** `GET /resumes/library`
**Expected Response:**
```json
{
  "resumes": [
    {
      "id": 789,
      "title": "Software Engineer Resume",
      "is_default": true,
      "optimizations": [
        {
          "job_title": "Senior Developer",
          "session_id": 101,
          "created_at": "2025-01-01T00:00:00Z",
          "status": "DONE"
        }
      ],
      "analysis_summary": {
        "strengths_count": 5,
        "weaknesses_count": 2,
        "last_analyzed": "2025-01-01T00:00:00Z"
      },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Set Default Resume
**Endpoint:** `PATCH /resumes/{resume_id}/set-default`
**Expected Response:**
```json
{
  "message": "Default resume updated successfully"
}
```

### Delete Resume
**Endpoint:** `DELETE /resumes/{resume_id}`
**Expected Response:**
```json
{
  "message": "Resume deleted successfully"
}
```

### Download Resume
**Endpoint:** `GET /resumes/{resume_id}/download`
**Response:** Binary file content (PDF/DOC)

## Analysis Features

### Analyze Resume
**Endpoint:** `POST /analyze/resume`
**Request:**
```json
{
  "resume_id": 789,
  "analysis_type": "comprehensive"
}
```
**Expected Response:**
```json
{
  "analysis_id": 999,
  "status": "RUNNING",
  "message": "Analysis started successfully"
}
```

### Get Resume Analysis
**Endpoint:** `GET /analyze/resume/{analysis_id}`
**Expected Response:**
```json
{
  "id": 999,
  "resume_id": 789,
  "status": "DONE",
  "results": {
    "strengths": [
      {
        "category": "Technical Skills",
        "description": "Strong programming background",
        "impact": "high"
      }
    ],
    "weaknesses": [
      {
        "category": "Experience",
        "description": "Limited leadership experience",
        "impact": "medium",
        "suggestion": "Highlight any team collaboration or mentoring"
      }
    ],
    "overall_score": 85,
    "ats_score": 78
  },
  "created_at": "2025-01-01T00:00:00Z",
  "completed_at": "2025-01-01T00:05:00Z"
}
```

### Analyze Job
**Endpoint:** `POST /analyze/job`
**Request:**
```json
{
  "job_description": "We are looking for a software engineer...",
  "job_title": "Software Engineer",
  "company": "Tech Corp"
}
```

## Resume Optimization/Comparison

### Start Comparison
**Endpoint:** `POST /compare/start`
**Request:**
```json
{
  "base_resume_id": 789,
  "alt_resume_id": 790,
  "job_description": "We are looking for...",
  "job_title": "Software Engineer"
}
```
**Expected Response:**
```json
{
  "session_id": 202,
  "status": "RUNNING",
  "steps": {
    "parse_base": { "state": "pending" },
    "analyze": { "state": "pending" },
    "suggest": { "state": "pending" }
  },
  "message": "Comparison started successfully"
}
```

### Get Comparison Session
**Endpoint:** `GET /compare/{session_id}`
**Expected Response:**
```json
{
  "id": 202,
  "status": "DONE",
  "base_resume_id": 789,
  "job_description": "We are looking for...",
  "job_title": "Software Engineer",
  "steps": {
    "parse_base": { "state": "completed", "completed_at": "2025-01-01T00:01:00Z" },
    "analyze": { "state": "completed", "completed_at": "2025-01-01T00:03:00Z" },
    "suggest": { "state": "completed", "completed_at": "2025-01-01T00:05:00Z" },
    "rewrite": { "state": "completed", "completed_at": "2025-01-01T00:07:00Z" }
  },
  "improvements": {
    "high_impact": [
      {
        "id": "imp_1",
        "category": "Skills",
        "description": "Add missing key technologies",
        "original_text": "Python, JavaScript",
        "improved_text": "Python, JavaScript, React, Node.js",
        "impact_score": 9
      }
    ],
    "medium_impact": [],
    "low_impact": []
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:07:00Z"
}
```

### Get Comparison Diff
**Endpoint:** `GET /compare/{session_id}/diff`

### Edit Comparison Text
**Endpoint:** `POST /compare/{session_id}/edit`
**Request:**
```json
{
  "edited_text": "Updated resume content..."
}
```

### Export Comparison
**Endpoint:** `POST /compare/{session_id}/export`
**Request:**
```json
{
  "include_diff": true,
  "latex_style": "modern"
}
```

### Download Comparison
**Endpoint:** `GET /compare/{session_id}/download`
**Response:** Binary file content

## Document Processing

### Apply Improvements
**Endpoint:** `POST /document/apply-improvements`
**Request:**
```json
{
  "document_text": "Original resume text...",
  "suggestions": "List of improvements...",
  "document_type": "resume",
  "output_format": "text"
}
```

### Convert to LaTeX
**Endpoint:** `POST /convert/latex`
**Request:**
```json
{
  "latex_content": "\\documentclass{article}...",
  "style": "modern"
}
```

## Dashboard

### Get Dashboard Summary
**Endpoint:** `GET /me/summary`
**Expected Response:**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "onboarding_stage": "completed"
  },
  "resume_stats": {
    "total_resumes": 3,
    "active_resumes": 2,
    "default_resume": {
      "id": 789,
      "title": "Software Engineer Resume"
    }
  },
  "recent_activity": [
    {
      "type": "resume_optimization",
      "session_id": 202,
      "job_title": "Software Engineer",
      "status": "DONE",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "quick_actions": ["upload_resume", "analyze_resume", "optimize_resume"]
}
```

## System Endpoints

### Health Check
**Endpoint:** `GET /health`
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### Get Version
**Endpoint:** `GET /version`
**Expected Response:**
```json
{
  "version": "1.0.0",
  "build": "abc123",
  "environment": "production"
}
```

## Authentication Requirements

### CORS Configuration
**Required CORS headers for `localhost:3000` and `localhost:3002`:**
```
Access-Control-Allow-Origin: http://localhost:3000, http://localhost:3002
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Token Format
- **Access Token:** JWT format expected
- **Refresh Token:** JWT format expected
- **Authorization Header:** `Bearer <token>`

### Error Response Format
**Expected error response structure:**
```json
{
  "error": {
    "message": "Human readable error message",
    "status_code": 400,
    "error_code": "VALIDATION_ERROR",
    "detail": "Detailed error description",
    "documentation_url": "https://github.com/fumbl3b/resume-backend/blob/main/README.md#error-handling"
  }
}
```

## Backend Integration Status

### ✅ RESOLVED ISSUES
1. **Auth Endpoints Fixed:** Registration, Login, and Current User endpoints now match frontend expectations
2. **Response Format:** All auth responses updated to match frontend contract
3. **User Fields:** Added required `onboarding_stage` and `has_default_resume` fields

### 🔄 PENDING DEPLOYMENT
**The backend fixes are complete but need to be redeployed to production to take effect.**

### ⚠️ REMAINING ISSUES TO MONITOR
1. **CORS Configuration:** Ensure proper CORS headers for `localhost:3000` and `localhost:3002`
2. **Health Endpoint:** Verify health endpoint stability after deployment
3. **Error Handling:** Ensure consistent error response format across all endpoints

## Frontend Features Summary

The frontend implements:
- User authentication (register, login, logout, token refresh)
- Resume upload and management
- Resume analysis and optimization
- Job description analysis
- Resume comparison and improvement suggestions
- Document export and download
- User dashboard with activity tracking
- Profile management