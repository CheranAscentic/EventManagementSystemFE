// Example of how to use the enhanced API with automatic 401 retry
import { useState } from 'react';
import { apiService } from '../api';
import { apiUtils } from '../utils/domainUtils';
import type { Event } from '../models';

export const ApiUsageExample = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example: Fetch events with automatic 401 retry
  const fetchEventsWithRetry = async () => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await apiUtils.handleApiResponse(
      () => apiService.getAllEvents()
    );

    if (data?.value) {
      setEvents(data.value);
      console.log('Events fetched successfully:', data.value.length);
    } else {
      setError(apiError || 'Failed to fetch events');
      console.error('Failed to fetch events:', apiError);
    }

    setLoading(false);
  };

  // Example: Manual token refresh (for admin or debugging purposes)
  const manualTokenRefresh = async () => {
    const { tokenRefreshService } = await import('../services');
    
    const result = await tokenRefreshService.manualRefresh();
    if (result) {
      console.log('Manual token refresh successful');
      alert('Token refreshed successfully!');
    } else {
      console.error('Manual token refresh failed');
      alert('Token refresh failed. Please log in again.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">API Usage Example</h2>
      
      <div className="space-y-4">
        <button
          onClick={fetchEventsWithRetry}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Events (with 401 retry)'}
        </button>

        <button
          onClick={manualTokenRefresh}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Manual Token Refresh
        </button>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <div>
          <h3 className="font-semibold">Events ({events.length}):</h3>
          <ul className="list-disc list-inside">
            {events.map((event) => (
              <li key={event.id} className="text-sm">
                {event.title} - {new Date(event.eventDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
