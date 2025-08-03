// Event registration response interfaces
import type { EventRegistration } from "../../models/EventRegistration";

export interface RegisterForEventResponse {
  registration: EventRegistration;
  success: boolean;
  message?: string;
}

export interface CancelEventRegistrationResponse {
  success: boolean;
  message?: string;
}

export interface GetUserEventRegistrationsResponse {
  registrations: EventRegistration[];
  success: boolean;
  message?: string;
}

export interface GetEventRegistrationsResponse {
  registrations: EventRegistration[];
  success: boolean;
  message?: string;
}

export interface UploadEventImageResponse {
  imageId: string;
  imageUrl: string;
  success: boolean;
  message?: string;
}
