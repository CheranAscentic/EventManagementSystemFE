// Event response interfaces
import type { ApiResponse } from '../../types';
import type { Event } from "../../models/Event";

// Standardized response types using generics
export type CreateEventResponse = ApiResponse<Event>;
export type UpdateEventResponse = ApiResponse<Event>;
export type DeleteEventResponse = ApiResponse<null>;
export type GetEventResponse = ApiResponse<Event>;
export type GetAllEventsResponse = ApiResponse<Event[]>;
