export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  type: string;
  capacity: number;
  isOpenForRegistration: boolean;
  registrationCutoffDate: string;
  noOfRegistrations: number;
  image?: string | null;
}
