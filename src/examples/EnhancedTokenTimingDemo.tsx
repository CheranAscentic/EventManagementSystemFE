// Enhanced Token Refresh Service Demo - Dynamic Timing Based on Actual Expiration
import { useState, useEffect } from 'react';
import { tokenRefreshService } from '../services';
import { apiService } from '../api';
import { Clock, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface TokenInfo {
  authToken: string | null;
  refreshToken: string | null;
  authTokenExp: string | null;
  refreshTokenExp: string | null;
  authTokenTimeLeft: number;
  refreshTokenTimeLeft: number;
  shouldRefresh: boolean;
}

interface ServiceStatus {
  isActive: boolean;
  hasValidTokens: boolean;
  authTokenExpiration: string | null;
  refreshTokenExpiration: string | null;
  shouldRefresh: boolean;
}

export const EnhancedTokenTimingDemo = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  // Update token information every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateTokenInfo();
      updateServiceStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateTokenInfo = () => {
    const authToken = apiService.getAuthToken();
    const refreshToken = apiService.getRefreshToken();
    const authTokenExp = apiService.getAuthTokenExpiration();
    const refreshTokenExp = apiService.getRefreshTokenExpiration();

    let authTokenTimeLeft = 0;
    let refreshTokenTimeLeft = 0;
    let shouldRefresh = false;

    if (authTokenExp) {
      authTokenTimeLeft = Math.max(0, new Date(authTokenExp).getTime() - Date.now());
      shouldRefresh = apiService.shouldRefreshAuthToken();
    }

    if (refreshTokenExp) {
      refreshTokenTimeLeft = Math.max(0, new Date(refreshTokenExp).getTime() - Date.now());
    }

    setTokenInfo({
      authToken,
      refreshToken,
      authTokenExp,
      refreshTokenExp,
      authTokenTimeLeft,
      refreshTokenTimeLeft,
      shouldRefresh
    });
  };

  const updateServiceStatus = () => {
    const status = tokenRefreshService.getStatus();
    setServiceStatus(status);
  };

  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getTimeColor = (milliseconds: number, isAuthToken: boolean = true): string => {
    if (milliseconds <= 0) return 'text-red-600';
    
    const minutes = Math.floor(milliseconds / 60000);
    
    if (isAuthToken) {
      if (minutes <= 1) return 'text-red-600';
      if (minutes <= 3) return 'text-orange-600';
      return 'text-green-600';
    } else {
      if (minutes <= 30) return 'text-red-600';
      if (minutes <= 120) return 'text-orange-600';
      return 'text-green-600';
    }
  };

  const startMonitoring = () => {
    if (!tokenInfo?.authToken) {
      addLog('❌ No auth token available - please log in first');
      return;
    }

    setIsMonitoring(true);
    addLog('🚀 Starting enhanced token refresh monitoring with dynamic timing');
    
    tokenRefreshService.start(
      (user) => {
        addLog(`✅ Token refreshed successfully for user: ${user.userName}`);
        updateTokenInfo();
      },
      () => {
        addLog('❌ Token refresh failed - user will be logged out');
        setIsMonitoring(false);
      }
    );
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    tokenRefreshService.stop();
    addLog('🛑 Token refresh monitoring stopped');
  };

  const forceRefresh = async () => {
    addLog('🔄 Attempting manual token refresh...');
    const result = await tokenRefreshService.manualRefresh();
    
    if (result) {
      addLog('✅ Manual token refresh successful');
      updateTokenInfo();
    } else {
      addLog('❌ Manual token refresh failed');
    }
  };

  const clearLogs = () => setLogs([]);

  if (!tokenInfo) {
    return <div className="p-4">Loading token information...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        🕒 Enhanced Token Refresh Service - Dynamic Timing Demo
      </h2>

      {/* Key Features */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🎯 Dynamic Timing Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Adaptive Check Interval:</strong> 1/10th of token lifetime (30s min, 5min max)</li>
          <li>• <strong>Smart Refresh Buffer:</strong> 10% of token lifetime (1min min, 5min max)</li>
          <li>• <strong>Auto-Restart:</strong> Recalculates timing after each token refresh</li>
          <li>• <strong>Token Verification:</strong> Confirms proper storage after refresh</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Status */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Current Token Status
            </h3>
            
            <div className="space-y-3">
              {/* Auth Token */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-700">Auth Token</div>
                  <div className="text-xs text-gray-500">
                    {tokenInfo.authTokenExp ? new Date(tokenInfo.authTokenExp).toLocaleString() : 'No expiration'}
                  </div>
                </div>
                <div className={`text-right ${getTimeColor(tokenInfo.authTokenTimeLeft, true)}`}>
                  <div className="font-bold">{formatTime(tokenInfo.authTokenTimeLeft)}</div>
                  {tokenInfo.shouldRefresh && (
                    <div className="text-xs text-orange-600 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Should Refresh
                    </div>
                  )}
                </div>
              </div>

              {/* Refresh Token */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-700">Refresh Token</div>
                  <div className="text-xs text-gray-500">
                    {tokenInfo.refreshTokenExp ? new Date(tokenInfo.refreshTokenExp).toLocaleString() : 'No expiration'}
                  </div>
                </div>
                <div className={`text-right ${getTimeColor(tokenInfo.refreshTokenTimeLeft, false)}`}>
                  <div className="font-bold">{formatTime(tokenInfo.refreshTokenTimeLeft)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <RefreshCw className={`mr-2 h-5 w-5 ${serviceStatus?.isActive ? 'text-green-600 animate-spin' : 'text-gray-600'}`} />
              Service Status
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Active:</span>
                <span className={serviceStatus?.isActive ? 'text-green-600' : 'text-red-600'}>
                  {serviceStatus?.isActive ? '✅ Running' : '❌ Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Valid Tokens:</span>
                <span className={serviceStatus?.hasValidTokens ? 'text-green-600' : 'text-red-600'}>
                  {serviceStatus?.hasValidTokens ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Should Refresh:</span>
                <span className={serviceStatus?.shouldRefresh ? 'text-orange-600' : 'text-green-600'}>
                  {serviceStatus?.shouldRefresh ? '⚠️ Yes' : '✅ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startMonitoring}
                disabled={isMonitoring || !tokenInfo.authToken}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMonitoring ? 'Running...' : 'Start Monitoring'}
              </button>

              <button
                onClick={stopMonitoring}
                disabled={!isMonitoring}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop Monitoring
              </button>
            </div>

            <button
              onClick={forceRefresh}
              disabled={!tokenInfo.refreshToken}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Force Manual Refresh
            </button>

            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>

        {/* Live Logs */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Info className="mr-2 h-5 w-5 text-blue-600" />
            Live Activity Logs
          </h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">No activity yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Timing Explanation */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⏱️ How Dynamic Timing Works:</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Check Interval:</strong> Service checks every 1/10th of your auth token's lifetime</p>
          <p><strong>Refresh Buffer:</strong> Refreshes when 10% of auth token lifetime remains</p>
          <p><strong>Example:</strong> 10-minute token → Check every 1 minute → Refresh at 1 minute remaining</p>
          <p><strong>Boundaries:</strong> Min check: 30s, Max check: 5min, Min buffer: 1min, Max buffer: 5min</p>
        </div>
      </div>
    </div>
  );
};
