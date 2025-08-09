// ICS (iCalendar) utility functions for generating calendar files
import { createEvent, type EventAttributes } from 'ics';
import type { Event, EventRegistration } from '../models';

/**
 * Generates an ICS calendar file content for an event with optional registration details
 * @param event - The event object containing event details
 * @param registration - Optional registration object containing user registration details
 * @returns ICS file content as a string
 */
export const generateEventICS = (event: Event, registration?: EventRegistration): string => {
  try {
    // Parse event start date
    const startDate = new Date(event.eventDate);
    
    // Calculate end date - assume 2 hours duration since Event model doesn't have endDate
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours default

    // Prepare event description with registration details if available
    let description = event.description || '';
    
    if (registration) {
      description += `\n\n--- Registration Details ---`;
      description += `\nRegistered Name: ${registration.name}`;
      description += `\nEmail: ${registration.email}`;
      if (registration.phone) {
        description += `\nPhone: ${registration.phone}`;
      }
      description += `\nRegistration Date: ${new Date(registration.registeredAt).toLocaleDateString()}`;
    }
    
    description += `\n\nEvent Type: ${event.type || 'Not specified'}`;
    description += `\nMax Capacity: ${event.capacity || 'Not specified'}`;
    description += `\nRegistrations: ${event.noOfRegistrations || 0}/${event.capacity}`;

    // Create event attributes for ICS
    const eventAttributes: EventAttributes = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1, // ICS library expects 1-based months
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes()
      ],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes()
      ],
      title: event.title,
      description: description,
      location: event.location || '',
      url: `${window.location.origin}/event/${event.id}`,
      organizer: { 
        name: 'Event Management System', 
        email: 'events@company.com' 
      },
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      categories: [event.type || 'Event'],
      created: registration ? 
        [
          new Date(registration.registeredAt).getFullYear(),
          new Date(registration.registeredAt).getMonth() + 1,
          new Date(registration.registeredAt).getDate(),
          new Date(registration.registeredAt).getHours(),
          new Date(registration.registeredAt).getMinutes()
        ] : 
        [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes()
        ],
    };

    // Add attendee information if registration is provided
    if (registration) {
      eventAttributes.attendees = [
        { 
          name: registration.name, 
          email: registration.email,
          rsvp: true
        }
      ];
    }

    // Generate ICS content
    const { error, value } = createEvent(eventAttributes);
    
    if (error) {
      console.error('Error creating ICS:', error);
      throw new Error('Failed to generate calendar file');
    }
    
    return value || '';
  } catch (error) {
    console.error('Error in generateEventICS:', error);
    throw new Error('Failed to generate calendar file');
  }
};

/**
 * Downloads an ICS file to the user's device
 * @param icsContent - The ICS file content as a string
 * @param filename - The filename for the downloaded file
 */
export const downloadICS = (icsContent: string, filename: string): void => {
  try {
    // Create blob with proper MIME type for calendar files
    const blob = new Blob([icsContent], { 
      type: 'text/calendar;charset=utf-8' 
    });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading ICS file:', error);
    throw new Error('Failed to download calendar file');
  }
};

/**
 * Generates a safe filename from event title and registration info
 * @param event - The event object
 * @param registration - Optional registration object
 * @returns A safe filename string
 */
export const generateICSFilename = (event: Event, registration?: EventRegistration): string => {
  // Clean event title for filename
  const cleanTitle = event.title
    .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();
  
  // Add registration suffix if registration is provided
  const suffix = registration ? '_registration' : '_event';
  
  // Add date for uniqueness
  const eventDate = new Date(event.eventDate);
  const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `${cleanTitle}_${dateStr}${suffix}.ics`;
};

/**
 * Complete function to generate and download an event ICS file
 * @param event - The event object
 * @param registration - Optional registration object
 */
export const downloadEventCalendar = (event: Event, registration?: EventRegistration): void => {
  try {
    const icsContent = generateEventICS(event, registration);
    const filename = generateICSFilename(event, registration);
    downloadICS(icsContent, filename);
  } catch (error) {
    console.error('Error downloading event calendar:', error);
    throw error;
  }
};
