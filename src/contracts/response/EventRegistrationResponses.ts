// Event registration response interfaces
import type { ApiResponse } from '../../types';
import type { EventRegistration } from "../../models/EventRegistration";

// Event image upload data structure
export interface EventImageData {
  id: string;
  eventId: string;
  imageUrl: string;
}

// Standardized response types using generics
export type RegisterForEventResponse = ApiResponse<EventRegistration>;
export type CancelEventRegistrationResponse = ApiResponse<null>;
export type GetUserEventRegistrationsResponse = ApiResponse<EventRegistration[]>;
export type GetEventRegistrationsResponse = ApiResponse<EventRegistration[]>;
export type UploadEventImageResponse = ApiResponse<EventImageData>;
