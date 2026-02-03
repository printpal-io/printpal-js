/**
 * PrintPal API Error Classes
 */

/**
 * Base error class for all PrintPal API errors.
 */
export class PrintPalError extends Error {
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Original response data */
  response?: unknown;

  constructor(message: string, statusCode?: number, response?: unknown) {
    super(message);
    this.name = 'PrintPalError';
    this.statusCode = statusCode;
    this.response = response;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrintPalError);
    }
  }
}

/**
 * Raised when API key is invalid or missing.
 */
export class AuthenticationError extends PrintPalError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Raised when user has insufficient credits.
 */
export class InsufficientCreditsError extends PrintPalError {
  /** Credits required for the operation */
  creditsRequired?: number;
  /** Credits currently available */
  creditsAvailable?: number;

  constructor(
    message: string,
    creditsRequired?: number,
    creditsAvailable?: number
  ) {
    super(message, 402);
    this.name = 'InsufficientCreditsError';
    this.creditsRequired = creditsRequired;
    this.creditsAvailable = creditsAvailable;
  }
}

/**
 * Raised when rate limit is exceeded.
 */
export class RateLimitError extends PrintPalError {
  /** Seconds until rate limit resets */
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Raised when a generation fails.
 */
export class GenerationError extends PrintPalError {
  /** The generation UID that failed */
  generationUid?: string;

  constructor(message: string, generationUid?: string) {
    super(message, 500);
    this.name = 'GenerationError';
    this.generationUid = generationUid;
  }
}

/**
 * Raised when a resource is not found.
 */
export class NotFoundError extends PrintPalError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Raised when request validation fails.
 */
export class ValidationError extends PrintPalError {
  /** Field-specific validation errors */
  errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Raised when an operation times out.
 */
export class TimeoutError extends PrintPalError {
  constructor(message = 'Operation timed out') {
    super(message, 408);
    this.name = 'TimeoutError';
  }
}

/**
 * Raised when there's a network error.
 */
export class NetworkError extends PrintPalError {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}
