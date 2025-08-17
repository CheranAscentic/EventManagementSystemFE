// Enhanced API Usage Example with Infinite Loop Protection Demo
import { useState } from 'react';
import { apiService } from '../api';
import { apiUtils } from '../utils/domainUtils';
import type { Event } from '../models';

export const Enhanced401HandlingExample = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test case 1: Normal API call with token refresh
  const testNormalCall = async () => {
    setLoading(true);
    setError(null);
    addLog('Testing normal API call...');

    const { data, error: apiError } = await apiUtils.handleApiResponse(
      () => apiService.getAllEvents(),
      'getAllEvents' // Request identifier for tracking
    );

    if (data?.value) {
      setEvents(data.value);
      addLog(`✅ Success: Fetched ${data.value.length} events`);
    } else {
      setError(apiError || 'Failed to fetch events');
      addLog(`❌ Error: ${apiError}`);
    }

    setLoading(false);
  };

  // Test case 2: Simulate insufficient permissions (would cause infinite loop without protection)
  const testInsufficientPermissions = async () => {
    setLoading(true);
    setError(null);
    addLog('Testing insufficient permissions scenario...');

    // Simulate a call that would return 401 due to insufficient permissions
    const { data, error: apiError } = await apiUtils.handleApiResponse(
      async () => {
        // This simulates an admin-only endpoint that regular user tries to access
        addLog('Attempting admin-only operation...');
        throw new Error('401: Insufficient permissions for admin operation');
      },
      'adminOperation' // Request identifier for tracking
    );

    if (data) {
      addLog('✅ Unexpected success');
    } else {
      setError(apiError || 'Failed');
      addLog(`🛡️ Protected: ${apiError}`);
    }

    setLoading(false);
  };

  // Test case 3: Show retry tracking stats
  const showRetryStats = () => {
    const stats = apiUtils.getRetryStats();
    addLog(`📊 Retry Stats: ${stats.activeRetries} active, tracking: [${stats.trackedRequests.join(', ')}]`);
  };

  // Clear retry tracker
  const clearRetryTracker = () => {
    apiUtils.clearRetryTracker();
    addLog('🧹 Retry tracker cleared');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Enhanced 401 Handling Demo</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">🛡️ Protection Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Single Retry Limit:</strong> Maximum 1 retry per request</li>
          <li>• <strong>Time-based Protection:</strong> 5-minute cooldown between retries</li>
          <li>• <strong>Permission Detection:</strong> Distinguishes expired tokens from insufficient permissions</li>
          <li>• <strong>Request Tracking:</strong> Prevents duplicate retries for same request</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Test Scenarios</h3>
          <div className="space-y-3">
            <button
              onClick={testNormalCall}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '✅ Test Normal API Call'}
            </button>

            <button
              onClick={testInsufficientPermissions}
              disabled={loading}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🛡️ Test Insufficient Permissions'}
            </button>

            <button
              onClick={showRetryStats}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              📊 Show Retry Stats
            </button>

            <button
              onClick={clearRetryTracker}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              🧹 Clear Retry Tracker
            </button>

            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ Clear Logs
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Live Console Logs</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-80 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Fetched Events ({events.length})</h3>
        <div className="max-h-40 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-gray-500 italic">No events fetched yet</div>
          ) : (
            <ul className="space-y-1">
              {events.map((event) => (
                <li key={event.id} className="text-sm p-2 bg-gray-50 rounded">
                  <strong>{event.title}</strong> - {new Date(event.eventDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
