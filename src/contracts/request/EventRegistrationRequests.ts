// Event registration request interfaces

export interface RegisterForEventRequest {
  appUserId: string;
  eventId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface CancelEventRegistrationRequest {
  appUserId: string;
}

export interface UploadEventImageRequest {
  eventId: string;
  imageUrl: string;
}
