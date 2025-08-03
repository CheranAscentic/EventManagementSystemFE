// Authentication response interfaces
import type { AppUser } from "../../models/AppUser";

export interface LoginResponse {
  user: AppUser;
  token?: string; // JWT token if using token-based authentication
  success: boolean;
  message?: string;
}

export interface RegisterResponse {
  user: AppUser;
  success: boolean;
  message?: string;
}
