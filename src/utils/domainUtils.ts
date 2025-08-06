// Utility functions for the Event Management System

import type { AppUser, Event, EventRegistration } from '../models';

// Date Utilities
export const dateUtils = {
  /**
   * Convert ISO string to Date with error handling
   */
  safeParseDate: (isoString: string): Date | null => {
    try {
      const date = new Date(isoString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  },

  /**
   * Format date for API (convert Date to ISO string)
   */
  formatDateForApi: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * Format event date for display
   */
  formatEventDate: (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format registration date for display
   */
  formatRegistrationDate: (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-US');
  },

  /**
   * Check if a date string represents a past date
   */
  isPastDate: (isoString: string): boolean => {
    const date = new Date(isoString);
    return date < new Date();
  },

  /**
   * Check if registration is still open based on cutoff date
   */
  isRegistrationOpen: (registrationCutoffDate: string): boolean => {
    return !dateUtils.isPastDate(registrationCutoffDate);
  }
};

// User Utilities
export const userUtils = {
  /**
   * Check if user is admin
   */
  isAdmin: (user: AppUser): boolean => {
    return user.userRole === 'Admin';
  },

  /**
   * Check if user is regular user
   */
  isRegularUser: (user: AppUser): boolean => {
    return user.userRole === 'User';
  },

  /**
   * Get full name
   */
  getFullName: (user: AppUser): string => {
    return `${user.firstName} ${user.lastName}`.trim();
  },

  /**
   * Get display name (fallback to username if no first/last name)
   */
  getDisplayName: (user: AppUser): string => {
    const fullName = userUtils.getFullName(user);
    return fullName || user.userName || user.email;
  },

  /**
   * Check if user has complete profile information
   */
  hasCompleteProfile: (user: AppUser): boolean => {
    return !!(user.firstName && user.lastName && user.phoneNumber);
  }
};

// Event Utilities
export const eventUtils = {
  /**
   * Check if event registration is currently open
   */
  isRegistrationOpen: (event: Event): boolean => {
    return event.isOpenForRegistration && dateUtils.isRegistrationOpen(event.registrationCutoffDate);
  },

  /**
   * Check if event has available capacity
   */
  hasAvailableCapacity: (event: Event): boolean => {
    return event.noOfRegistrations < event.capacity;
  },

  /**
   * Check if user can register for event
   */
  canRegister: (event: Event): boolean => {
    return eventUtils.isRegistrationOpen(event) && eventUtils.hasAvailableCapacity(event);
  },

  /**
   * Get capacity percentage
   */
  getCapacityPercentage: (event: Event): number => {
    return Math.round((event.noOfRegistrations / event.capacity) * 100);
  },

  /**
   * Get remaining capacity
   */
  getRemainingCapacity: (event: Event): number => {
    return Math.max(0, event.capacity - event.noOfRegistrations);
  },

  /**
   * Get event status for display
   */
  getEventStatus: (event: Event): {
    text: string;
    color: string;
    canRegister: boolean;
  } => {
    if (!event.isOpenForRegistration) {
      return { text: 'Registration Closed', color: 'text-gray-600', canRegister: false };
    }
    
    if (!dateUtils.isRegistrationOpen(event.registrationCutoffDate)) {
      return { text: 'Registration Expired', color: 'text-gray-600', canRegister: false };
    }
    
    if (event.noOfRegistrations >= event.capacity) {
      return { text: 'Event Full', color: 'text-red-600', canRegister: false };
    }
    
    return { text: 'Registration Open', color: 'text-green-600', canRegister: true };
  },

  /**
   * Get event status for UI display (with background colors)
   */
  getUIEventStatus: (event: Event): {
    text: string;
    color: string;
    canRegister: boolean;
  } => {
    if (!event.isOpenForRegistration) {
      return { text: 'Closed', color: 'bg-gray-100 text-gray-600', canRegister: false };
    }
    
    if (!dateUtils.isRegistrationOpen(event.registrationCutoffDate)) {
      return { text: 'Expired', color: 'bg-gray-100 text-gray-600', canRegister: false };
    }
    
    if (event.noOfRegistrations >= event.capacity) {
      return { text: 'Full', color: 'bg-red-100 text-red-600', canRegister: false };
    }
    
    return { text: 'Open', color: 'bg-green-100 text-green-600', canRegister: true };
  },

  /**
   * Get capacity color styling
   */
  getCapacityColorStyle: (event: Event): string => {
    const percentage = eventUtils.getCapacityPercentage(event);
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 80) return 'text-orange-600 bg-orange-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  },

  /**
   * Convert event for display (with computed properties)
   */
  formatEventForDisplay: (event: Event) => ({
    ...event,
    eventDate: dateUtils.safeParseDate(event.eventDate),
    registrationCutoffDate: dateUtils.safeParseDate(event.registrationCutoffDate),
    formattedEventDate: dateUtils.formatEventDate(event.eventDate),
    formattedCutoffDate: dateUtils.formatEventDate(event.registrationCutoffDate),
    capacityPercentage: eventUtils.getCapacityPercentage(event),
    remainingCapacity: eventUtils.getRemainingCapacity(event),
    status: eventUtils.getEventStatus(event)
  })
};

// Event Registration Utilities
export const registrationUtils = {
  /**
   * Check if registration is active (not canceled)
   */
  isActiveRegistration: (registration: EventRegistration): boolean => {
    return !registration.isCanceled;
  },

  /**
   * Format registration for display
   */
  formatRegistrationForDisplay: (registration: EventRegistration) => ({
    ...registration,
    registeredAt: dateUtils.safeParseDate(registration.registeredAt),
    formattedRegistrationDate: dateUtils.formatRegistrationDate(registration.registeredAt),
    isActive: registrationUtils.isActiveRegistration(registration)
  }),

  /**
   * Group registrations by status
   */
  groupByStatus: (registrations: EventRegistration[]) => ({
    active: registrations.filter(r => !r.isCanceled),
    canceled: registrations.filter(r => r.isCanceled)
  })
};

// API Response Utilities
export const apiUtils = {
  /**
   * Generic API call wrapper with error handling
   */
  handleApiResponse: async <T>(
    apiCall: () => Promise<T>
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const data = await apiCall();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

// Validation Utilities
export const validationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format (basic)
   */
  isValidPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  /**
   * Validate password strength
   */
  isValidPassword: (password: string): boolean => {
    return password.length >= 8;
  },

  /**
   * Validate event capacity
   */
  isValidCapacity: (capacity: number): boolean => {
    return capacity > 0 && capacity <= 10000; // Reasonable limits
  }
};
