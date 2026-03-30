/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: any;

  constructor(message: string, statusCode: number, errorCode: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Pre-defined common errors
export const Exceptions = {
  BadRequest: (msg = 'Bad Request', details?: any) => new ApiError(msg, 400, 'BAD_REQUEST', details),
  Unauthorized: (msg = 'Unauthorized') => new ApiError(msg, 401, 'UNAUTHORIZED'),
  Forbidden: (msg = 'Forbidden', details?: any) => new ApiError(msg, 403, 'FORBIDDEN', details),
  NotFound: (msg = 'Resource Not Found') => new ApiError(msg, 404, 'NOT_FOUND'),
  Conflict: (msg = 'Resource Already Exists') => new ApiError(msg, 409, 'CONFLICT'),
  ValidationError: (details: any) => new ApiError('Validation Failed', 422, 'VALIDATION_ERROR', details),
  // 500s - Server Errors
  InternalServerError: (msg = 'An unexpected error occurred', details?: any) => new ApiError(msg, 500, 'INTERNAL_SERVER_ERROR', details),
  ServiceUnavailable: (msg = 'Service is temporarily unavailable') => new ApiError(msg, 503, 'SERVICE_UNAVAILABLE'),
};