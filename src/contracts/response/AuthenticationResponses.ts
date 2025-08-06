// Authentication response interfaces
import type { ApiResponse } from '../../types';

// Login response data structure (matches actual backend response)
export interface LoginData {
  id: string;
  email: string;
  userName: string;
  token: string;
  tokenExpiration: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userRole: string;
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
export type LoginResponse = ApiResponse<LoginData>;
export type RegisterResponse = ApiResponse<RegisterData>;
