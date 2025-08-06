// API Service for Event Management System

// Request interfaces
import type {
  LoginRequest,
  RegisterUserRequest,
  RegisterAdminRequest,
} from "../contracts/request/AuthenticationRequests";

import type {
  RegisterForEventRequest,
  CancelEventRegistrationRequest,
  UploadEventImageRequest,
} from "../contracts/request/EventRegistrationRequests";

import type {
  CreateEventRequest,
  UpdateEventRequest,
} from "../contracts/request/EventRequests";

// Response interfaces
import type {
  LoginResponse,
  RegisterResponse,
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
  GetEventTypesResponse,
} from "../contracts/response/EventTypeResponses";

import type {
  GetOwnerEventsResponse,
} from "../contracts/response/OwnerEventResponses";

// Model interfaces are used implicitly through response interfaces

export class ApiService {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = "https://localhost:7049") {
    this.baseUrl = baseUrl;
    
    // Load existing token from AppUser storage if available
    const storedUserData = localStorage.getItem('AppUser');
    if (storedUserData) {
      try {
        const appUser = JSON.parse(storedUserData);
        if (appUser.token && appUser.tokenExpiration) {
          // Check if token is still valid
          const expirationDate = new Date(appUser.tokenExpiration);
          const currentDate = new Date();
          
          if (expirationDate > currentDate) {
            this.authToken = appUser.token;
          } else {
            // Token expired, clean up
            localStorage.removeItem('AppUser');
            console.log('Token expired during ApiService initialization');
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data in ApiService:', error);
        localStorage.removeItem('AppUser');
      }
    } else {
      // Fallback: check for old token-only storage
      this.authToken = localStorage.getItem('authToken') || undefined;
      if (this.authToken) {
        console.log('Found old token storage, consider migrating to AppUser storage');
      }
    }
  }

  // Set authentication token
  setAuthToken(token: string | undefined) {
    this.authToken = token;
    
    // This method is now mainly for compatibility
    // The preferred approach is to store the complete AppUser object in localStorage
    // from the App component's authentication handlers
    if (token) {
      // Only store token if no AppUser is already stored
      const storedUserData = localStorage.getItem('AppUser');
      if (!storedUserData) {
        localStorage.setItem('authToken', token);
      }
    } else {
      // Clear all authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('AppUser');
    }
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = undefined;
    localStorage.removeItem('authToken');
    localStorage.removeItem('AppUser');
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
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

    console.log(`Making request to ${url} with options:`, config);

    try {
      const response = await fetch(url, config);
      console.log(`Response from ${url}:`, response);
      
      // Always parse JSON first
      const data = await response.json();
      console.log('Parsed response data:', data);
      
      if (!response.ok) {
        // Handle error responses with your backend structure
        const errorMessage = data?.error || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
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

  async uploadEventImage(request: UploadEventImageRequest): Promise<UploadEventImageResponse> {
    return this.request<UploadEventImageResponse>("/api/event-registrations/event-image", {
      method: "POST",
      body: JSON.stringify(request),
    });
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
