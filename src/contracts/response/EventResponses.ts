// Event response interfaces
import type { Event } from "../../models/Event";

export interface CreateEventResponse {
  event: Event;
  success: boolean;
  message?: string;
}

export interface UpdateEventResponse {
  event: Event;
  success: boolean;
  message?: string;
}

export interface DeleteEventResponse {
  success: boolean;
  message?: string;
}

export interface GetEventResponse {
  event: Event;
  success: boolean;
  message?: string;
}

export interface GetAllEventsResponse {
  events: Event[];
  success: boolean;
  message?: string;
}
