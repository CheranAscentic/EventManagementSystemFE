export interface GetEventsExtendedRequest {
  itemsPerPage: number;        // Required: 1-100
  pageNumber: number;          // Required: >= 1
  searchTerm?: string;         // Optional: 2-100 characters
  eventType?: string;          // Optional: Valid event type
  startDate?: string;          // Optional: ISO 8601 date string
  endDate?: string;            // Optional: ISO 8601 date string
}
