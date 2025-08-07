import type { Event } from '../../models';

export interface PaginatedResult<T> {
  items: T[];                   // Array of events
  totalCount: number;           // Total number of matching events
  pageNumber: number;           // Current page number
  itemsPerPage: number;         // Items per page
  totalPages: number;           // Total number of pages (calculated)
  hasPreviousPage: boolean;     // Whether previous page exists
  hasNextPage: boolean;         // Whether next page exists
}

export interface GetEventsExtendedResponse {
  isSuccess: boolean;
  message: string;
  value: PaginatedResult<Event>;
  statusCode: number;
  statusText: string;
  errors: Record<string, string[]> | null;
}
