// Authentication request interfaces

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  phoneNumber?: string;
}

export interface RegisterAdminRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  phoneNumber?: string;
}
