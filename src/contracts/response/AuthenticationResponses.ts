// Authentication response interfaces
import type { ApiResponse } from '../../types';

// Login response data structure
export interface LoginData {
  id: string;
  email: string;
  userName: string;
  token: string;
  tokenExpiration: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  userRole: string;
}

// Registration response data structure
export interface RegisterData {
  id: string;
  email: string;
  userName: string;
  token: string;
  tokenExpiration: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  userRole: string;
}

// Standardized response types
export type LoginResponse = ApiResponse<LoginData>;
export type RegisterResponse = ApiResponse<RegisterData>;
