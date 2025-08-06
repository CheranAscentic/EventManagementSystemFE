// Owner Event response interfaces

import type { Event } from '../../models';
import type { ApiResponse } from '../../types';

// Response for getting owner events - extends ApiResponse<Event[]>
export type GetOwnerEventsResponse = ApiResponse<Event[]>;

// Type alias for the owner events data (array of events)
export type OwnerEventsData = Event[];
