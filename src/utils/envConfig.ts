// Environment configuration utilities for CalVent

export const envConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "https://localhost:7049",
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Storage Configuration
  localStoragePrefix: import.meta.env.VITE_LOCAL_STORAGE_PREFIX || "calvent_",
  tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY || "AppUser",
  fallbackTokenKey: import.meta.env.VITE_FALLBACK_TOKEN_KEY || "authToken",
  
  // Development Configuration
  debugApi: import.meta.env.VITE_DEBUG_API === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || "info",
  
  // Token Refresh Service Configuration
  tokenMinCheckInterval: parseInt(import.meta.env.VITE_TOKEN_MIN_CHECK_INTERVAL) || 30, // seconds
  tokenMaxCheckInterval: parseInt(import.meta.env.VITE_TOKEN_MAX_CHECK_INTERVAL) || 300, // seconds (5 minutes)
  tokenRefreshBufferMultiplier: parseFloat(import.meta.env.VITE_TOKEN_REFRESH_BUFFER_MULTIPLIER) || 0.1, // 10%
  
  // Application Configuration
  appName: import.meta.env.VITE_APP_NAME || "CalVent",
  appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
  
  // Environment Detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Type-safe environment variable getter
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Required environment variable ${key} is not defined`);
  }
  return value || defaultValue || '';
}

// Validate required environment variables
export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_API_BASE_URL'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing optional environment variables:', missing);
    console.warn('Using default values. Consider creating a .env.local file.');
  }
}

// Initialize environment validation
validateEnvironment();
