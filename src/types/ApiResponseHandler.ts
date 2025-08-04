import type { 
  ApiResponse, 
  ValidationErrors, 
  ValidationErrorResponse 
} from './ApiResponse';
import { 
  ApiError, 
  ValidationError
} from './ApiResponse';

export class ApiResponseHandler {
  /**
   * Handles API response and extracts the value or throws appropriate errors
   */
  static handleResponse<T>(response: ApiResponse<T>): T {
    if (response.isSuccess && response.value !== null) {
      return response.value;
    }
    
    // Handle validation errors (400 status with validation details)
    if (response.status === 400 && response.value !== null && typeof response.value === 'object') {
      throw new ValidationError(
        response.value as ValidationErrors,
        response as ValidationErrorResponse
      );
    }
    
    // Handle general API errors
    throw new ApiError(
      response.error || 'Unknown error occurred',
      response.status,
      response
    );
  }
  
  /**
   * Checks if the response is a validation error
   */
  static isValidationError(response: ApiResponse<unknown>): response is ValidationErrorResponse {
    return !response.isSuccess && 
           response.status === 400 && 
           response.value !== null &&
           typeof response.value === 'object';
  }
  
  /**
   * Checks if the response is successful
   */
  static isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { isSuccess: true; value: T } {
    return response.isSuccess && response.value !== null;
  }
  
  /**
   * Extracts error message from response
   */
  static getErrorMessage(response: ApiResponse<unknown>): string {
    return response.error || response.message || 'Unknown error occurred';
  }
}
