// Event request interfaces

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string; // ISO 8601 date string
  location: string;
  type: string;
  capacity: number;
  registrationCutoffDate: string; // ISO 8601 date string
}

export interface UpdateEventRequest {
  title: string;
  description?: string;
  eventDate: string; // ISO 8601 date string
  location: string;
  type: string;
  capacity: number;
  registrationCutoffDate: string; // ISO 8601 date string
}
