import { apiService } from '../api';
import { decodeJwtToAppUser } from '../utils/jwtUtils';
import { envConfig } from '../utils/envConfig';
import type { AppUser } from '../models';

/**
 * TokenRefreshService - Automatically manages token refresh in a timely manner
 * This service handles proactive token refreshing before expiration
 */
export class TokenRefreshService {
  private static instance: TokenRefreshService | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private onTokenRefreshSuccess?: (user: AppUser) => void;
  private onTokenRefreshFailure?: () => void;

  // Dynamic check interval: configurable from environment variables
  private readonly MIN_CHECK_INTERVAL = envConfig.tokenMinCheckInterval * 1000; // Convert seconds to milliseconds
  private readonly MAX_CHECK_INTERVAL = envConfig.tokenMaxCheckInterval * 1000; // Convert seconds to milliseconds
  
  // Dynamic refresh buffer: calculated based on check intervals and multiplier
  private readonly MIN_REFRESH_BUFFER = Math.max(envConfig.tokenMinCheckInterval * 1000, envConfig.tokenMinCheckInterval * 1000 * 2); // Minimum 2x check interval
  private readonly MAX_REFRESH_BUFFER = Math.min(envConfig.tokenMaxCheckInterval * 1000, envConfig.tokenMaxCheckInterval * 1000 * 1.5); // Maximum 1.5x max check interval

  /**
   * Calculate optimal check interval based on token lifetime and environment configuration
   */
  private calculateCheckInterval(): number {
    const authTokenExp = apiService.getAuthTokenExpiration();
    if (!authTokenExp) return this.MIN_CHECK_INTERVAL;

    const tokenLifetime = new Date(authTokenExp).getTime() - Date.now();
    
    // Check every 1/10th of token lifetime, but within min/max bounds from environment
    const optimalInterval = Math.max(
      this.MIN_CHECK_INTERVAL,
      Math.min(this.MAX_CHECK_INTERVAL, tokenLifetime / 10)
    );

    console.log(`[TokenRefreshService] Calculated check interval: ${optimalInterval / 1000}s (token lifetime: ${tokenLifetime / 60000}min, bounds: ${envConfig.tokenMinCheckInterval}s-${envConfig.tokenMaxCheckInterval}s)`);
    return optimalInterval;
  }

  /**
   * Calculate dynamic refresh buffer based on token lifetime and environment configuration
   */
  private calculateRefreshBuffer(): number {
    const authTokenExp = apiService.getAuthTokenExpiration();
    if (!authTokenExp) return this.MIN_REFRESH_BUFFER;

    const tokenLifetime = new Date(authTokenExp).getTime() - Date.now();
    
    // Refresh when configured percentage of token lifetime remains, but within min/max bounds
    const optimalBuffer = Math.max(
      this.MIN_REFRESH_BUFFER,
      Math.min(this.MAX_REFRESH_BUFFER, tokenLifetime * envConfig.tokenRefreshBufferMultiplier)
    );

    const bufferPercentage = (envConfig.tokenRefreshBufferMultiplier * 100).toFixed(1);
    console.log(`[TokenRefreshService] Calculated refresh buffer: ${optimalBuffer / 1000}s (${bufferPercentage}% of ${tokenLifetime / 60000}min lifetime)`);
    return optimalBuffer;
  }

  private constructor() {
    // Log configuration on initialization (only in debug mode)
    if (envConfig.debugApi) {
      this.logConfiguration();
    }
  }

  /**
   * Log the current configuration for debugging
   */
  private logConfiguration(): void {
    console.log('[TokenRefreshService] Configuration:');
    console.log(`  - Min Check Interval: ${envConfig.tokenMinCheckInterval}s (${this.MIN_CHECK_INTERVAL}ms)`);
    console.log(`  - Max Check Interval: ${envConfig.tokenMaxCheckInterval}s (${this.MAX_CHECK_INTERVAL}ms)`);
    console.log(`  - Refresh Buffer Multiplier: ${(envConfig.tokenRefreshBufferMultiplier * 100).toFixed(1)}%`);
    console.log(`  - Min Refresh Buffer: ${this.MIN_REFRESH_BUFFER / 1000}s`);
    console.log(`  - Max Refresh Buffer: ${this.MAX_REFRESH_BUFFER / 1000}s`);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }

  /**
   * Start automatic token refresh monitoring
   * Call this when user logs in
   */
  start(
    onTokenRefreshSuccess?: (user: AppUser) => void,
    onTokenRefreshFailure?: () => void
  ): void {
    if (this.isActive) {
      console.log('[TokenRefreshService] Already active, stopping previous instance');
      this.stop();
    }

    this.onTokenRefreshSuccess = onTokenRefreshSuccess;
    this.onTokenRefreshFailure = onTokenRefreshFailure;
    this.isActive = true;

    console.log('[TokenRefreshService] Starting automatic token refresh monitoring');

    // Calculate optimal check interval based on current token expiration
    const checkInterval = this.calculateCheckInterval();

    // Start monitoring interval with dynamic timing
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshTokens();
    }, checkInterval);

    // Initial check
    this.checkAndRefreshTokens();
  }

  /**
   * Stop automatic token refresh monitoring
   * Call this when user logs out
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    this.isActive = false;
    this.onTokenRefreshSuccess = undefined;
    this.onTokenRefreshFailure = undefined;
    
    console.log('[TokenRefreshService] Stopped automatic token refresh monitoring');
  }

  /**
   * Restart the monitoring interval with updated timing based on new token expiration
   */
  private restartWithNewTiming(): void {
    if (!this.isActive) return;

    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Calculate new optimal check interval
    const newCheckInterval = this.calculateCheckInterval();

    // Start new interval with updated timing
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshTokens();
    }, newCheckInterval);

    console.log(`[TokenRefreshService] Restarted monitoring with new interval: ${newCheckInterval / 1000}s`);
  }
  private async checkAndRefreshTokens(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Check if user has valid tokens
      if (!apiService.hasValidTokens()) {
        console.log('[TokenRefreshService] No valid tokens found, stopping service');
        this.handleRefreshFailure();
        return;
      }

      // Check if refresh token is expired
      if (apiService.isRefreshTokenExpired()) {
        console.log('[TokenRefreshService] Refresh token expired, stopping service');
        this.handleRefreshFailure();
        return;
      }

      // Check if auth token needs refresh
      if (this.shouldRefreshAuthToken()) {
        console.log('[TokenRefreshService] Auth token needs refresh, attempting refresh...');
        await this.performTokenRefresh();
      } else {
        // Log token status for debugging
        const authTokenExp = apiService.getAuthTokenExpiration();
        if (authTokenExp) {
          const timeUntilExpiry = new Date(authTokenExp).getTime() - Date.now();
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / (60 * 1000));
          console.log(`[TokenRefreshService] Auth token valid for ${minutesUntilExpiry} more minutes`);
        }
      }
    } catch (error) {
      console.error('[TokenRefreshService] Error during token check:', error);
    }
  }

  /**
   * Check if auth token should be refreshed based on dynamic buffer
   */
  private shouldRefreshAuthToken(): boolean {
    const authTokenExp = apiService.getAuthTokenExpiration();
    if (!authTokenExp) {
      console.log('[TokenRefreshService] No auth token expiration found');
      return true;
    }

    const expiration = new Date(authTokenExp);
    const now = new Date();
    const timeUntilExpiry = expiration.getTime() - now.getTime();

    // Calculate dynamic refresh buffer based on token lifetime
    const refreshBuffer = this.calculateRefreshBuffer();

    // Refresh if token expires within the dynamic buffer time
    const shouldRefresh = timeUntilExpiry <= refreshBuffer;
    
    if (shouldRefresh) {
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / (60 * 1000));
      const bufferMinutes = Math.floor(refreshBuffer / (60 * 1000));
      console.log(`[TokenRefreshService] Auth token expires in ${minutesUntilExpiry} minutes, refreshing now (buffer: ${bufferMinutes}min)`);
    }

    return shouldRefresh;
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      console.log('[TokenRefreshService] Attempting to refresh tokens...');
      
      const refreshedCredentials = await apiService.refreshTokens();
      
      if (refreshedCredentials) {
        console.log('[TokenRefreshService] Tokens refreshed successfully');
        
        // Verify that ApiService has stored the new tokens properly
        const storedAuthToken = apiService.getAuthToken();
        const storedRefreshToken = apiService.getRefreshToken();
        const storedAuthTokenExp = apiService.getAuthTokenExpiration();
        const storedRefreshTokenExp = apiService.getRefreshTokenExpiration();
        
        console.log('[TokenRefreshService] Token storage verification:');
        console.log(`  - Auth token stored: ${!!storedAuthToken}`);
        console.log(`  - Refresh token stored: ${!!storedRefreshToken}`);
        console.log(`  - Auth token expiration: ${storedAuthTokenExp}`);
        console.log(`  - Refresh token expiration: ${storedRefreshTokenExp}`);
        
        // Decode user from new auth token and notify success callback
        const user = decodeJwtToAppUser(refreshedCredentials.authToken);
        if (user && this.onTokenRefreshSuccess) {
          this.onTokenRefreshSuccess(user);
        }
        
        // Log new expiration times
        const authTokenExp = new Date(refreshedCredentials.authTokenExp);
        const refreshTokenExp = new Date(refreshedCredentials.refreshTokenExp);
        console.log(`[TokenRefreshService] New auth token expires at: ${authTokenExp.toLocaleString()}`);
        console.log(`[TokenRefreshService] New refresh token expires at: ${refreshTokenExp.toLocaleString()}`);
        
        // Restart monitoring with new timing based on updated token expiration
        this.restartWithNewTiming();
        
      } else {
        console.error('[TokenRefreshService] Token refresh failed - no credentials returned');
        this.handleRefreshFailure();
      }
    } catch (error) {
      console.error('[TokenRefreshService] Token refresh failed:', error);
      this.handleRefreshFailure();
    }
  }

  /**
   * Handle refresh failure
   */
  private handleRefreshFailure(): void {
    console.log('[TokenRefreshService] Handling refresh failure, stopping service');
    this.stop();
    
    if (this.onTokenRefreshFailure) {
      this.onTokenRefreshFailure();
    }
  }

  /**
   * Force refresh tokens now (for manual refresh)
   */
  async forceRefresh(): Promise<boolean> {
    if (!this.isActive) {
      console.log('[TokenRefreshService] Service not active, cannot force refresh');
      return false;
    }

    try {
      await this.performTokenRefresh();
      return true;
    } catch (error) {
      console.error('[TokenRefreshService] Force refresh failed:', error);
      return false;
    }
  }

  /**
   * Manual token refresh for 401 error recovery
   * This method can be called even when the service is not active
   */
  async manualRefresh(): Promise<{ authToken: string; refreshToken: string; authTokenExp: string; refreshTokenExp: string } | null> {
    try {
      console.log('[TokenRefreshService] Manual token refresh requested');
      
      const refreshedCredentials = await apiService.refreshTokens();
      
      if (refreshedCredentials) {
        console.log('[TokenRefreshService] Manual token refresh successful');
        
        // Log new expiration times
        const authTokenExp = new Date(refreshedCredentials.authTokenExp);
        const refreshTokenExp = new Date(refreshedCredentials.refreshTokenExp);
        console.log(`[TokenRefreshService] New auth token expires at: ${authTokenExp.toLocaleString()}`);
        console.log(`[TokenRefreshService] New refresh token expires at: ${refreshTokenExp.toLocaleString()}`);
        
        return refreshedCredentials;
      } else {
        console.error('[TokenRefreshService] Manual token refresh failed - no credentials returned');
        return null;
      }
    } catch (error) {
      console.error('[TokenRefreshService] Manual token refresh failed:', error);
      return null;
    }
  }

  /**
   * Get current service status
   */
  getStatus(): {
    isActive: boolean;
    hasValidTokens: boolean;
    authTokenExpiration: string | null;
    refreshTokenExpiration: string | null;
    shouldRefresh: boolean;
  } {
    return {
      isActive: this.isActive,
      hasValidTokens: apiService.hasValidTokens(),
      authTokenExpiration: apiService.getAuthTokenExpiration(),
      refreshTokenExpiration: apiService.getRefreshTokenExpiration(),
      shouldRefresh: this.isActive ? this.shouldRefreshAuthToken() : false,
    };
  }
}

// Export singleton instance for easy use
export const tokenRefreshService = TokenRefreshService.getInstance();
