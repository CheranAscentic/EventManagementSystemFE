// Authentication response interfaces
import type { ApiResponse } from '../../types';

// Login response data structure (matches actual backend response)
export interface Credentials {
  authToken: string; // JWT token for authenticated requests
  refreshToken: string; // Refresh token for obtaining new access tokens
  authTokenExp: string; // Auth token expiration timestamp (ISO string)
  refreshTokenExp: string; // Refresh token expiration timestamp (ISO string)
}

// Registration response data structure (returns user info)
export interface RegisterData {
  userId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  userRole: string;
  phoneNumber: string;
  token?: string; // Optional token for auto-login after registration
}

// Standardized response types
export type LoginResponse = ApiResponse<Credentials>;
export type RegisterResponse = ApiResponse<RegisterData>;
export type RefreshResponse = ApiResponse<Credentials>;
