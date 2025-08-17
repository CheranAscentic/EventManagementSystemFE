// Token Refresh Service Configuration Demo
import { useState, useEffect } from 'react';
import { tokenRefreshService } from '../services';
import { envConfig } from '../utils/envConfig';
import { Settings, Clock, Percent, Info, CheckCircle } from 'lucide-react';

interface ConfigInfo {
  minCheckInterval: number;
  maxCheckInterval: number;
  refreshBufferMultiplier: number;
  minRefreshBuffer: number;
  maxRefreshBuffer: number;
  currentCheckInterval?: number;
  currentRefreshBuffer?: number;
}

interface ServiceStatus {
  isActive: boolean;
  hasValidTokens: boolean;
  authTokenExpiration: string | null;
  refreshTokenExpiration: string | null;
  shouldRefresh: boolean;
}

export const TokenRefreshConfigDemo = () => {
  const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

  useEffect(() => {
    // Get configuration information
    const info: ConfigInfo = {
      minCheckInterval: envConfig.tokenMinCheckInterval,
      maxCheckInterval: envConfig.tokenMaxCheckInterval,
      refreshBufferMultiplier: envConfig.tokenRefreshBufferMultiplier,
      minRefreshBuffer: envConfig.tokenMinCheckInterval * 1000 * 2, // From TokenRefreshService logic
      maxRefreshBuffer: envConfig.tokenMaxCheckInterval * 1000 * 1.5, // From TokenRefreshService logic
    };

    // Get current service status
    const status = tokenRefreshService.getStatus();
    
    setConfigInfo(info);
    setServiceStatus(status);
  }, []);

  const calculateExampleTiming = (tokenLifetime: number) => {
    if (!configInfo) return { checkInterval: 0, refreshBuffer: 0 };

    // Simulate the TokenRefreshService calculations
    const optimalCheckInterval = Math.max(
      configInfo.minCheckInterval * 1000,
      Math.min(configInfo.maxCheckInterval * 1000, tokenLifetime / 10)
    );

    const optimalRefreshBuffer = Math.max(
      configInfo.minRefreshBuffer,
      Math.min(configInfo.maxRefreshBuffer, tokenLifetime * configInfo.refreshBufferMultiplier)
    );

    return {
      checkInterval: optimalCheckInterval,
      refreshBuffer: optimalRefreshBuffer
    };
  };

  const exampleScenarios = [
    { name: '5-minute token', lifetime: 5 * 60 * 1000 },
    { name: '10-minute token', lifetime: 10 * 60 * 1000 },
    { name: '30-minute token', lifetime: 30 * 60 * 1000 },
    { name: '60-minute token', lifetime: 60 * 60 * 1000 },
  ];

  if (!configInfo) {
    return <div className="p-4">Loading configuration...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
        <Settings className="mr-2 h-6 w-6" />
        Token Refresh Service Configuration
      </h2>

      {/* Environment Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Info className="mr-2 h-5 w-5 text-blue-600" />
          Environment Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="flex items-center mb-1">
              <Clock className="h-4 w-4 text-blue-600 mr-1" />
              <span className="font-medium text-blue-800">Check Intervals</span>
            </div>
            <div className="text-sm text-blue-700">
              <div>Min: {configInfo.minCheckInterval}s</div>
              <div>Max: {configInfo.maxCheckInterval}s</div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded">
            <div className="flex items-center mb-1">
              <Percent className="h-4 w-4 text-green-600 mr-1" />
              <span className="font-medium text-green-800">Buffer Multiplier</span>
            </div>
            <div className="text-sm text-green-700">
              <div>{(configInfo.refreshBufferMultiplier * 100).toFixed(1)}%</div>
              <div className="text-xs">of token lifetime</div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded">
            <div className="flex items-center mb-1">
              <CheckCircle className="h-4 w-4 text-purple-600 mr-1" />
              <span className="font-medium text-purple-800">Buffer Bounds</span>
            </div>
            <div className="text-sm text-purple-700">
              <div>Min: {configInfo.minRefreshBuffer / 1000}s</div>
              <div>Max: {configInfo.maxRefreshBuffer / 1000}s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Scenarios */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Timing Examples for Different Token Lifetimes</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2">Token Lifetime</th>
                <th className="text-left p-2">Check Interval</th>
                <th className="text-left p-2">Refresh Buffer</th>
                <th className="text-left p-2">Refresh Timing</th>
                <th className="text-left p-2">Refresh Count</th>
              </tr>
            </thead>
            <tbody>
              {exampleScenarios.map((scenario) => {
                const timing = calculateExampleTiming(scenario.lifetime);
                const refreshAt = scenario.lifetime - timing.refreshBuffer;
                const refreshCount = Math.floor(scenario.lifetime / timing.checkInterval);
                
                return (
                  <tr key={scenario.name} className="border-b border-gray-100">
                    <td className="p-2 font-medium">{scenario.name}</td>
                    <td className="p-2">{(timing.checkInterval / 1000).toFixed(0)}s</td>
                    <td className="p-2">{(timing.refreshBuffer / 1000).toFixed(0)}s</td>
                    <td className="p-2">
                      At {(refreshAt / 60000).toFixed(1)}min
                      <div className="text-xs text-gray-500">
                        ({(timing.refreshBuffer / scenario.lifetime * 100).toFixed(1)}% before expiry)
                      </div>
                    </td>
                    <td className="p-2">~{refreshCount} checks</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Service Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Current Service Status</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Active</div>
            <div className={serviceStatus?.isActive ? 'text-green-600' : 'text-red-600'}>
              {serviceStatus?.isActive ? '✅ Running' : '❌ Stopped'}
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Valid Tokens</div>
            <div className={serviceStatus?.hasValidTokens ? 'text-green-600' : 'text-red-600'}>
              {serviceStatus?.hasValidTokens ? '✅ Yes' : '❌ No'}
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Should Refresh</div>
            <div className={serviceStatus?.shouldRefresh ? 'text-orange-600' : 'text-green-600'}>
              {serviceStatus?.shouldRefresh ? '⚠️ Yes' : '✅ No'}
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Auth Token Exp</div>
            <div className="text-xs text-gray-500">
              {serviceStatus?.authTokenExpiration ? 
                new Date(serviceStatus.authTokenExpiration).toLocaleTimeString() : 
                'None'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables Guide */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 Environment Variables Guide:</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div><code className="bg-yellow-100 px-1 rounded">VITE_TOKEN_MIN_CHECK_INTERVAL</code> - Minimum seconds between token checks (default: 30)</div>
          <div><code className="bg-yellow-100 px-1 rounded">VITE_TOKEN_MAX_CHECK_INTERVAL</code> - Maximum seconds between token checks (default: 300)</div>
          <div><code className="bg-yellow-100 px-1 rounded">VITE_TOKEN_REFRESH_BUFFER_MULTIPLIER</code> - Percentage of token lifetime to use as refresh buffer (default: 0.1)</div>
        </div>
      </div>

      {/* Configuration Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Configuration Tips:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>Lower check intervals:</strong> More responsive but higher CPU usage</div>
          <div><strong>Higher check intervals:</strong> Less CPU usage but may miss quick expirations</div>
          <div><strong>Buffer multiplier:</strong> 0.1 (10%) is recommended for most use cases</div>
          <div><strong>For high-traffic apps:</strong> Consider higher max intervals (600s+)</div>
          <div><strong>For real-time apps:</strong> Consider lower min intervals (15s)</div>
        </div>
      </div>
    </div>
  );
};
