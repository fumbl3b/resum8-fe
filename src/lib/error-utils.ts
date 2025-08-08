import { APIError, LegacyAPIError } from './types';

export function getErrorMessage(error: APIError | LegacyAPIError | Error | unknown): string {
  // Handle new API error format
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as APIError;
    return apiError.error.detail || apiError.error.summary || 'An error occurred';
  }
  
  // Handle legacy error format
  if (error && typeof error === 'object' && 'message' in error) {
    const legacyError = error as LegacyAPIError;
    return legacyError.message || legacyError.details || 'An error occurred';
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function getErrorCode(error: APIError | LegacyAPIError | unknown): string | null {
  // Handle new API error format
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as APIError;
    return apiError.error.error_code || null;
  }
  
  return null;
}

export function getStatusCode(error: APIError | LegacyAPIError | unknown): number | null {
  // Handle new API error format
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = error as APIError;
    return apiError.error.status_code || null;
  }
  
  // Handle legacy error format
  if (error && typeof error === 'object' && 'status' in error) {
    const legacyError = error as LegacyAPIError;
    return legacyError.status || null;
  }
  
  return null;
}

export function isRateLimitError(error: APIError | LegacyAPIError | unknown): boolean {
  const statusCode = getStatusCode(error);
  return statusCode === 429;
}

export function isAuthError(error: APIError | LegacyAPIError | unknown): boolean {
  const statusCode = getStatusCode(error);
  return statusCode === 401 || statusCode === 403;
}

export function isValidationError(error: APIError | LegacyAPIError | unknown): boolean {
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);
  return statusCode === 400 || errorCode === 'VALIDATION_ERROR';
}