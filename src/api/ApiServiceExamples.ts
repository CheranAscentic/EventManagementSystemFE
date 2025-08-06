// Example usage of the API Service
import { apiService } from "./ApiService";
import { ApiResponseHandler } from "../types";
import type {
  LoginRequest,
  RegisterUserRequest,
  CreateEventRequest,
  RegisterForEventRequest,
} from "../contracts";

// Re-export owner events examples for convenience
export * from './OwnerEventsExamples';

// Example: User Authentication
export async function loginUser(email: string, password: string) {
  try {
    const loginRequest: LoginRequest = { email, password };
    const response = await apiService.login(loginRequest);
    
    // Use ApiResponseHandler to process the response
    const loginData = ApiResponseHandler.handleResponse(response);
    
    // Set the auth token for future requests
    apiService.setAuthToken(loginData.token);
    
    // Return the login data (you can convert to AppUser format if needed)
    return loginData;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Example: User Registration
export async function registerUser(userData: RegisterUserRequest) {
  try {
    const response = await apiService.registerUser(userData);
    
    // Use ApiResponseHandler to process the response
    const registerData = ApiResponseHandler.handleResponse(response);
    
    return registerData;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Example: Create Event
export async function createEvent(eventData: CreateEventRequest) {
  try {
    const response = await apiService.createEvent(eventData);
    
    // Use ApiResponseHandler to process the response
    const createdEvent = ApiResponseHandler.handleResponse(response);
    
    return createdEvent;
  } catch (error) {
    console.error("Create event error:", error);
    throw error;
  }
}

// Example: Get All Events
export async function getAllEvents() {
  try {
    const response = await apiService.getAllEvents();
    
    // Use ApiResponseHandler to process the response
    const events = ApiResponseHandler.handleResponse(response);
    
    return events;
  } catch (error) {
    console.error("Get events error:", error);
    throw error;
  }
}

// Example: Register for Event
export async function registerForEvent(eventId: string, userId: string, name: string, email: string, phoneNumber: string) {
  try {
    const request: RegisterForEventRequest = {
      eventId,
      appUserId: userId,
      name,
      email,
      phoneNumber,
    };
    
    const response = await apiService.registerForEvent(request);
    
    // Use ApiResponseHandler to process the response
    const registration = ApiResponseHandler.handleResponse(response);
    
    return registration;
  } catch (error) {
    console.error("Event registration error:", error);
    throw error;
  }
}

// Example: Get User's Event Registrations
export async function getUserRegistrations(userId: string) {
  try {
    const response = await apiService.getUserEventRegistrations(userId);
    
    // Use ApiResponseHandler to process the response
    const registrations = ApiResponseHandler.handleResponse(response);
    
    return registrations;
  } catch (error) {
    console.error("Get user registrations error:", error);
    throw error;
  }
}

// Example: Logout (clear auth token)
export function logoutUser() {
  apiService.clearAuthToken();
}
