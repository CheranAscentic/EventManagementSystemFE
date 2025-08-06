// UserDTO interface for Event Management System
export interface AppUser {
  userId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  userRole: string;
  phoneNumber: string;
  token?: string; // Optional token for authenticated requests
  tokenExpiration?: string; // Optional token expiration for session management
}
