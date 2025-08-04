import type { 
  ValidationErrors, 
  ValidationErrorResponse 
} from './ApiResponse';
import { ApiResponseHandler } from './ApiResponseHandler';

export class FormValidationHelper {
  /**
   * Extracts field errors from validation response and returns first error for each field
   */
  static extractFieldErrors(response: ValidationErrorResponse): Record<string, string> {
    if (!ApiResponseHandler.isValidationError(response)) {
      return {};
    }
    
    const fieldErrors: Record<string, string> = {};
    
    if (response.value) {
      Object.entries(response.value).forEach(([field, errors]) => {
        // Take the first error message for each field
        if (errors && errors.length > 0) {
          fieldErrors[field.toLowerCase()] = errors[0];
        }
      });
    }
    
    return fieldErrors;
  }
  
  /**
   * Extracts all field errors from validation response
   */
  static extractAllFieldErrors(response: ValidationErrorResponse): Record<string, string[]> {
    if (!ApiResponseHandler.isValidationError(response)) {
      return {};
    }
    
    const fieldErrors: Record<string, string[]> = {};
    
    if (response.value) {
      Object.entries(response.value).forEach(([field, errors]) => {
        fieldErrors[field.toLowerCase()] = errors || [];
      });
    }
    
    return fieldErrors;
  }
  
  /**
   * Checks if a specific field has validation errors
   */
  static hasFieldError(response: ValidationErrorResponse, fieldName: string): boolean {
    return ApiResponseHandler.isValidationError(response) && 
           response.value !== null &&
           fieldName.toLowerCase() in response.value;
  }
  
  /**
   * Gets error message for a specific field
   */
  static getFieldError(response: ValidationErrorResponse, fieldName: string): string | null {
    if (!this.hasFieldError(response, fieldName) || !response.value) {
      return null;
    }
    
    const errors = response.value[fieldName.toLowerCase()];
    return errors && errors.length > 0 ? errors[0] : null;
  }
  
  /**
   * Converts validation errors to form-friendly format
   */
  static toFormErrors(validationErrors: ValidationErrors): Record<string, string> {
    const formErrors: Record<string, string> = {};
    
    Object.entries(validationErrors).forEach(([field, errors]) => {
      if (errors && errors.length > 0) {
        formErrors[field.toLowerCase()] = errors[0];
      }
    });
    
    return formErrors;
  }
}
