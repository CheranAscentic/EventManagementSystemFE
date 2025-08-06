// Example usage of the Get Owner Events endpoint

import { apiService } from './ApiService';
import { ApiResponseHandler, ApiError } from '../types';
import type { Event } from '../models';

/**
 * Example: Get Owner Events
 * Retrieves all events owned by the currently authenticated admin user
 * 
 * Prerequisites:
 * - User must be authenticated (JWT token set in apiService)
 * - User must have admin role
 * 
 * @returns Promise<Event[]> - Array of events owned by the admin
 */
export async function getOwnerEvents(): Promise<Event[]> {
  try {
    // Call the API - the ownerId parameter is ignored by backend, actual owner comes from JWT
    const response = await apiService.getOwnerEvents();
    
    // Use ApiResponseHandler to process the Result<Event[]> response
    const ownerEvents = ApiResponseHandler.handleResponse(response);
    
    console.log('Owner events loaded:', ownerEvents);
    
    return ownerEvents || [];
  } catch (error) {
    console.error("Get owner events error:", error);
    
    if (error instanceof ApiError) {
      // Handle specific API errors
      switch (error.status) {
        case 401:
          throw new Error('Authentication required. Please log in.');
        case 403:
          throw new Error('Access denied. Only admin users can access owner events.');
        case 404:
          throw new Error('User not found.');
        default:
          throw new Error(`Failed to load owner events: ${error.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * Example: Get Owner Events with Error Handling for UI
 * Returns both data and error state for easy UI integration
 */
export async function getOwnerEventsForUI(): Promise<{
  events: Event[] | null;
  error: string | null;
  isEmpty: boolean;
}> {
  try {
    const events = await getOwnerEvents();
    
    return {
      events,
      error: null,
      isEmpty: events.length === 0
    };
  } catch (error) {
    return {
      events: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isEmpty: false
    };
  }
}

/**
 * Example: Check if current user has any events
 */
export async function hasOwnerEvents(): Promise<boolean> {
  try {
    const events = await getOwnerEvents();
    return events.length > 0;
  } catch (error) {
    console.error('Error checking owner events:', error);
    return false;
  }
}

/**
 * Example: Get owner events count
 */
export async function getOwnerEventsCount(): Promise<number> {
  try {
    const events = await getOwnerEvents();
    return events.length;
  } catch (error) {
    console.error('Error getting owner events count:', error);
    return 0;
  }
}
