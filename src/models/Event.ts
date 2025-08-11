export interface Event {
  id: string;
  adminId: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  type: string;
  capacity: number;
  isOpenForRegistration: boolean;
  registrationCutoffDate: string;
  noOfRegistrations: number;
  imageUrl?: string | null;
  registeredIds?: string[]; // List of user IDs who have registered for the event
  owner?: string;
}
