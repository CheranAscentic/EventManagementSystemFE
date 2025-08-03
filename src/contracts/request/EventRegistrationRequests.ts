// Event registration request interfaces

export interface RegisterForEventRequest {
  eventId: string;
  appUserId: string;
}

export interface CancelEventRegistrationRequest {
  appUserId: string;
}

export interface UploadEventImageRequest {
  eventId: string;
  imageUrl: string;
}
