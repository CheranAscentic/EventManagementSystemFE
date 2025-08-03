// Example usage of the API Service
import { apiService } from "./ApiService";
import type {
  LoginRequest,
  RegisterUserRequest,
  CreateEventRequest,
  RegisterForEventRequest,
} from "../contracts";

// Example: User Authentication
export async function loginUser(email: string, password: string) {
  try {
    const loginRequest: LoginRequest = { email, password };
    const response = await apiService.login(loginRequest);
    
    if (response.success && response.token) {
      // Set the auth token for future requests
      apiService.setAuthToken(response.token);
      return response.user;
    }
    
    throw new Error(response.message || "Login failed");
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Example: User Registration
export async function registerUser(userData: RegisterUserRequest) {
  try {
    const response = await apiService.registerUser(userData);
    
    if (response.success) {
      return response.user;
    }
    
    throw new Error(response.message || "Registration failed");
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Example: Create Event
export async function createEvent(eventData: CreateEventRequest) {
  try {
    const response = await apiService.createEvent(eventData);
    
    if (response.success) {
      return response.event;
    }
    
    throw new Error(response.message || "Event creation failed");
  } catch (error) {
    console.error("Create event error:", error);
    throw error;
  }
}

// Example: Get All Events
export async function getAllEvents() {
  try {
    const response = await apiService.getAllEvents();
    
    if (response.success) {
      return response.events;
    }
    
    throw new Error(response.message || "Failed to fetch events");
  } catch (error) {
    console.error("Get events error:", error);
    throw error;
  }
}

// Example: Register for Event
export async function registerForEvent(eventId: string, userId: string) {
  try {
    const request: RegisterForEventRequest = {
      eventId,
      appUserId: userId,
    };
    
    const response = await apiService.registerForEvent(request);
    
    if (response.success) {
      return response.registration;
    }
    
    throw new Error(response.message || "Event registration failed");
  } catch (error) {
    console.error("Event registration error:", error);
    throw error;
  }
}

// Example: Get User's Event Registrations
export async function getUserRegistrations(userId: string) {
  try {
    const response = await apiService.getUserEventRegistrations(userId);
    
    if (response.success) {
      return response.registrations;
    }
    
    throw new Error(response.message || "Failed to fetch user registrations");
  } catch (error) {
    console.error("Get user registrations error:", error);
    throw error;
  }
}

// Example: Logout (clear auth token)
export function logoutUser() {
  apiService.clearAuthToken();
}
