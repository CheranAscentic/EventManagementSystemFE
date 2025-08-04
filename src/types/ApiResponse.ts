// Standardized API Response Types

export interface ApiResponse<T = unknown> {
  isSuccess: boolean;
  message: string | null;
  status: number;
  error: string | null;
  value: T | null;
}

export interface ValidationErrors {
  [fieldName: string]: string[];
}

export type ValidationErrorResponse = ApiResponse<ValidationErrors>;

// Custom Error Classes
export class ApiError extends Error {
  public status: number;
  public response?: ApiResponse<unknown>;

  constructor(
    message: string,
    status: number,
    response?: ApiResponse<unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

export class ValidationError extends Error {
  public validationErrors: ValidationErrors;
  public response: ValidationErrorResponse;

  constructor(
    validationErrors: ValidationErrors,
    response: ValidationErrorResponse
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    this.response = response;
  }
}

// Generic success response types
export type SuccessResponse<T> = ApiResponse<T> & {
  isSuccess: true;
  value: T;
  error: null;
};

export type ErrorResponse = ApiResponse<null> & {
  isSuccess: false;
  value: null;
  error: string;
};
