// API Service for Event Management System

import { envConfig } from '../utils/envConfig';

// Request interfaces
import type {
  LoginRequest,
  RegisterUserRequest,
  RegisterAdminRequest,
  RefreshRequest,
} from "../contracts/request/AuthenticationRequests";

import type {
  RegisterForEventRequest,
  CancelEventRegistrationRequest,
} from "../contracts/request/EventRegistrationRequests";

import type {
  CreateEventRequest,
  UpdateEventRequest,
} from "../contracts/request/EventRequests";

import type {
  GetEventsExtendedRequest,
} from "../contracts/request/GetEventsExtendedRequest";

// Response interfaces
import type {
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
} from "../contracts/response/AuthenticationResponses";

import type {
  RegisterForEventResponse,
  CancelEventRegistrationResponse,
  GetUserEventRegistrationsResponse,
  GetEventRegistrationsResponse,
  UploadEventImageResponse,
} from "../contracts/response/EventRegistrationResponses";

import type {
  CreateEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  GetEventResponse,
  GetAllEventsResponse,
} from "../contracts/response/EventResponses";

import type {
  GetEventsExtendedResponse,
} from "../contracts/response/GetEventsExtendedResponse";

import type {
  GetEventTypesResponse,
} from "../contracts/response/EventTypeResponses";

import type {
  GetOwnerEventsResponse,
} from "../contracts/response/OwnerEventResponses";

// Model interfaces are used implicitly through response interfaces

export class ApiService {
  private baseUrl: string;
  private authToken?: string;
  private refreshToken?: string;
  private authTokenExp?: string; // Auth token expiration
  private refreshTokenExp?: string; // Refresh token expiration
  private debugMode: boolean;
  private tokenStorageKey: string;
  private fallbackTokenKey: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || envConfig.apiBaseUrl;
    this.debugMode = envConfig.debugApi;
    this.tokenStorageKey = envConfig.tokenStorageKey;
    this.fallbackTokenKey = envConfig.fallbackTokenKey;
    
    // Initialize tokens from storage
    this.initializeTokensFromStorage();
  }

  // NEW: Initialize tokens from storage on startup
  private initializeTokensFromStorage() {
    // Load refresh token and its expiration
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedRefreshTokenExp = localStorage.getItem('refresh_token_exp');
    if (storedRefreshToken && storedRefreshTokenExp) {
      try {
        this.refreshToken = JSON.parse(storedRefreshToken);
        this.refreshTokenExp = JSON.parse(storedRefreshTokenExp);
        
        // Check if refresh token is still valid
        const expiration = new Date(this.refreshTokenExp!);
        const now = new Date();
        
        if (expiration > now) {
          this.log('Refresh token loaded from storage');
        } else {
          this.log('Refresh token expired, clearing storage');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('refresh_token_exp');
          this.refreshToken = undefined;
          this.refreshTokenExp = undefined;
        }
      } catch (error) {
        this.log('Error parsing stored refresh token:', error);
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refresh_token_exp');
      }
    }

    // Load auth token and its expiration (legacy support)
    const storedUserData = localStorage.getItem(this.tokenStorageKey);
    if (storedUserData) {
      try {
        const appUser = JSON.parse(storedUserData);
        if (appUser.token && appUser.tokenExpiration) {
          const expirationDate = new Date(appUser.tokenExpiration);
          const currentDate = new Date();
          
          if (expirationDate > currentDate) {
            this.authToken = appUser.token;
            this.authTokenExp = appUser.tokenExpiration;
            this.log('Auth token loaded from AppUser storage');
          } else {
            localStorage.removeItem(this.tokenStorageKey);
            this.log('Auth token expired during initialization');
          }
        }
      } catch (error) {
        this.log('Error parsing stored user data:', error);
        localStorage.removeItem(this.tokenStorageKey);
      }
    } else {
      // Fallback: check for old token-only storage
      this.authToken = localStorage.getItem(this.fallbackTokenKey) || undefined;
      if (this.authToken) {
        this.log('Found old token storage, consider migrating to AppUser storage');
      }
    }
  }

  // Logging helper that respects debug mode
  private log(message: string, ...args: unknown[]) {
    if (this.debugMode) {
      console.log(`[ApiService] ${message}`, ...args);
    }
  }

  // NEW: Set both tokens together with their expirations (preferred method)
  setTokens(authToken: string, refreshToken: string, authTokenExp?: string, refreshTokenExp?: string) {
    this.setAuthToken(authToken, authTokenExp);
    this.setRefreshToken(refreshToken, refreshTokenExp);
    this.log('Both tokens set successfully');
  }

  // Enhanced setAuthToken
  setAuthToken(token: string | undefined, tokenExp?: string) {
    this.authToken = token;
    this.authTokenExp = tokenExp;
    
    if (token) {
      this.log('Auth token set');
      // Don't store auth token in localStorage - it's short-lived
      // Only store it in memory for immediate use
    } else {
      this.log('Auth token cleared');
    }
  }

  // Enhanced setRefreshToken
  setRefreshToken(refreshToken: string | undefined, refreshTokenExp?: string) {
    this.refreshToken = refreshToken;
    this.refreshTokenExp = refreshTokenExp;
    
    if (refreshToken) {
      localStorage.setItem("refresh_token", JSON.stringify(refreshToken));
      if (refreshTokenExp) {
        localStorage.setItem("refresh_token_exp", JSON.stringify(refreshTokenExp));
      }
      this.log('Refresh token stored');
    } else {
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("refresh_token_exp");
      this.log('Refresh token cleared');
    }
  }
  
  
  // Enhanced getRefreshToken
  getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    
    const stored = localStorage.getItem('refresh_token');
    if (stored) {
      try {
        this.refreshToken = JSON.parse(stored);
        return this.refreshToken || null;
      } catch {
        localStorage.removeItem('refresh_token');
        return null;
      }
    }
    return null;
  }

  // NEW: Get auth token
  getAuthToken(): string | null {
    return this.authToken || null;
  }

  // NEW: Get auth token expiration
  getAuthTokenExpiration(): string | null {
    return this.authTokenExp || null;
  }

  // NEW: Get refresh token expiration
  getRefreshTokenExpiration(): string | null {
    return this.refreshTokenExp || null;
  }

  // NEW: Check if auth token is expired
  isAuthTokenExpired(): boolean {
    if (!this.authTokenExp) return true;
    return new Date() >= new Date(this.authTokenExp);
  }

  // NEW: Check if refresh token is expired
  isRefreshTokenExpired(): boolean {
    if (!this.refreshTokenExp) return true;
    return new Date() >= new Date(this.refreshTokenExp);
  }

  // NEW: Check if auth token needs refresh (within 2 minutes of expiration)
  shouldRefreshAuthToken(): boolean {
    if (!this.authTokenExp) return true;
    const expiration = new Date(this.authTokenExp);
    const now = new Date();
    const bufferTime = 2 * 60 * 1000; // 2 minutes buffer
    return (expiration.getTime() - now.getTime()) < bufferTime;
  }

  // Enhanced: Check if tokens exist and are valid
  hasValidTokens(): boolean {
    return !!(this.authToken && this.refreshToken && !this.isRefreshTokenExpired());
  }

  // Enhanced clearAuthToken (now clears all tokens and expirations)
  clearAllTokens() {
    this.authToken = undefined;
    this.refreshToken = undefined;
    this.authTokenExp = undefined;
    this.refreshTokenExp = undefined;
    localStorage.removeItem(this.fallbackTokenKey);
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('refresh_token_exp');
    this.log('All authentication tokens and expirations cleared');
  }

  // DEPRECATED: Keep for backward compatibility
  clearAuthToken() {
    this.clearAllTokens();
  }

  // NEW: Refresh tokens and update storage
  async refreshTokens(): Promise<{ authToken: string; refreshToken: string; authTokenExp: string; refreshTokenExp: string } | null> {
    const currentRefreshToken = this.getRefreshToken();
    if (!currentRefreshToken) {
      this.log('No refresh token available');
      return null;
    }

    // Check if refresh token is expired
    if (this.isRefreshTokenExpired()) {
      this.log('Refresh token expired, clearing all tokens');
      this.clearAllTokens();
      return null;
    }

    try {
      const refreshResponse = await this.refresh({ refreshToken: currentRefreshToken });
      
      // Import ApiResponseHandler here to avoid circular dependencies
      const { ApiResponseHandler } = await import('../types');
      const credentials = await ApiResponseHandler.handleResponse(refreshResponse);

      if (credentials?.authToken && credentials?.refreshToken && credentials?.authTokenExp && credentials?.refreshTokenExp) {
        // Store new tokens with their expirations
        this.setTokens(credentials.authToken, credentials.refreshToken, credentials.authTokenExp, credentials.refreshTokenExp);
        this.log('Tokens refreshed successfully');
        return credentials;
      } else {
        this.log('Invalid credentials received during refresh');
        this.clearAllTokens();
        return null;
      }
    } catch (error) {
      this.log('Token refresh failed:', error);
      this.clearAllTokens();
      return null;
    }
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = envConfig.apiTimeout;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    this.log(`Making request to ${url}`, { method: config.method || 'GET', hasAuth: !!this.authToken });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      this.log(`Response from ${url}:`, { status: response.status, ok: response.ok });
      
      // Always parse JSON first
      const data = await response.json();
      this.log('Parsed response data:', data);
      
      if (!response.ok) {
        // Handle error responses with your backend structure
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        
        // Create a more specific error for 401 Unauthorized
        if (response.status === 401) {
          const unauthorizedError = new Error(`401: ${errorMessage}`) as Error & { status: number };
          unauthorizedError.status = 401;
          throw unauthorizedError;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      this.log("API request failed:", error);
      throw error;
    }
  }

  // Authentication Methods
  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/authentication/login", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    return this.request<RefreshResponse>("/api/authentication/refresh", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async registerUser(request: RegisterUserRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/api/authentication/register/user", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async registerAdmin(request: RegisterAdminRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/api/authentication/register/admin", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Event Registration Methods
  async registerForEvent(request: RegisterForEventRequest): Promise<RegisterForEventResponse> {
    return this.request<RegisterForEventResponse>("/api/event-registrations/", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async cancelEventRegistration(
    registrationId: string,
    request: CancelEventRegistrationRequest
  ): Promise<CancelEventRegistrationResponse> {
    return this.request<CancelEventRegistrationResponse>(
      `/api/event-registrations/${registrationId}`,
      {
        method: "DELETE",
        body: JSON.stringify(request),
      }
    );
  }

  async getUserEventRegistrations(userId: string): Promise<GetUserEventRegistrationsResponse> {
    return this.request<GetUserEventRegistrationsResponse>(
      `/api/event-registrations/user/${userId}`
    );
  }

  async getEventRegistrations(eventId: string): Promise<GetEventRegistrationsResponse> {
    return this.request<GetEventRegistrationsResponse>(
      `/api/event-registrations/event/${eventId}`
    );
  }

  async uploadEventImage(eventId: string, imageFile: File): Promise<UploadEventImageResponse> {
    const url = `${this.baseUrl}/api/events/event-image`;
    const timeout = envConfig.apiTimeout;
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('imageFile', imageFile);

    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Note: Don't set Content-Type header - let browser set it automatically for FormData
    const config: RequestInit = {
      method: "POST",
      headers,
      body: formData,
    };

    this.log(`Making image upload request to ${url}`, { 
      fileName: imageFile.name, 
      fileSize: imageFile.size,
      eventId 
    });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Upload timeout after ${timeout}ms`)), timeout);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      this.log(`Image upload response from ${url}:`, { status: response.status, ok: response.ok });
      
      // Always parse JSON first
      const data = await response.json();
      this.log('Parsed image upload response data:', data);
      
      if (!response.ok) {
        // Handle error responses with your backend structure
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        
        // Create a more specific error for 401 Unauthorized
        if (response.status === 401) {
          const unauthorizedError = new Error(`401: ${errorMessage}`) as Error & { status: number };
          unauthorizedError.status = 401;
          throw unauthorizedError;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      this.log("Image upload request failed:", error);
      throw error;
    }
  }

  // Event Methods
  async createEvent(request: CreateEventRequest): Promise<CreateEventResponse> {
    return this.request<CreateEventResponse>("/api/events/", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateEvent(eventId: string, request: UpdateEventRequest): Promise<UpdateEventResponse> {
    return this.request<UpdateEventResponse>(`/api/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async deleteEvent(eventId: string): Promise<DeleteEventResponse> {
    return this.request<DeleteEventResponse>(`/api/events/${eventId}`, {
      method: "DELETE",
    });
  }

  async getEvent(eventId: string): Promise<GetEventResponse> {
    return this.request<GetEventResponse>(`/api/events/${eventId}`);
  }

  async getAllEvents(): Promise<GetAllEventsResponse> {
    return this.request<GetAllEventsResponse>("/api/events/");
  }

  async getEventsExtended(request: GetEventsExtendedRequest): Promise<GetEventsExtendedResponse> {
    return this.request<GetEventsExtendedResponse>("/api/events/GetSorted", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getEventTypes(): Promise<GetEventTypesResponse> {
    return this.request<GetEventTypesResponse>("/api/events/types");
  }

  // Owner Event Methods
  async getOwnerEvents(ownerId: string = "any-guid"): Promise<GetOwnerEventsResponse> {
    // Note: The ownerId parameter is ignored by the backend - actual owner comes from JWT token
    // We include it to match the endpoint URL structure: /api/events/owner/{ownerId}
    return this.request<GetOwnerEventsResponse>(`/api/events/owner/${ownerId}`);
  }
}

// Export a singleton instance
export const apiService = new ApiService();
