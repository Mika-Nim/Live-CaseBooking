/**
 * Connection monitoring and network status service
 * Provides real-time feedback on database connectivity for multi-user environment
 */

import React from 'react';
import { checkSupabaseConnection } from '../utils/errorHandler';

export interface ConnectionStatus {
  online: boolean;
  supabaseConnected: boolean;
  lastChecked: Date;
  error?: string;
}

class ConnectionService {
  private status: ConnectionStatus = {
    online: navigator.onLine,
    supabaseConnected: false,
    lastChecked: new Date()
  };

  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private checkInterval?: NodeJS.Timeout;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.setupEventListeners();
    this.startMonitoring();
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to connection status changes
   */
  subscribe(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Manually check connection status
   */
  async checkConnection(): Promise<ConnectionStatus> {
    const online = navigator.onLine;
    let supabaseConnected = false;
    let error: string | undefined;

    if (online) {
      try {
        supabaseConnected = await checkSupabaseConnection();
        if (!supabaseConnected) {
          error = 'Database connection failed';
        }
      } catch (err) {
        error = 'Failed to check database connection';
        console.error('Connection check failed:', err);
      }
    } else {
      error = 'No internet connection';
    }

    this.status = {
      online,
      supabaseConnected,
      lastChecked: new Date(),
      error
    };

    this.notifyListeners();
    return this.getStatus();
  }

  /**
   * Start automatic connection monitoring
   */
  startMonitoring(): void {
    this.stopMonitoring();
    this.checkConnection(); // Initial check
    
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop automatic connection monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Setup browser event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Browser came online');
      this.checkConnection();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Browser went offline');
      this.status = {
        ...this.status,
        online: false,
        supabaseConnected: false,
        error: 'No internet connection',
        lastChecked: new Date()
      };
      this.notifyListeners();
    });

    // Check when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection();
      }
    });
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  /**
   * Wait for connection to be restored
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.status.online && this.status.supabaseConnected) {
      return true;
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      const unsubscribe = this.subscribe((status) => {
        if (status.online && status.supabaseConnected) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });

      timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Execute operation with connection retry
   */
  async withConnectionRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 2000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection before attempting operation
        const status = await this.checkConnection();
        
        if (!status.online || !status.supabaseConnected) {
          if (attempt === maxRetries) {
            throw new Error(status.error || 'Connection unavailable');
          }
          
          console.log(`⏳ Waiting for connection... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`⏳ Retrying operation... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Max retries exceeded');
  }
}

// Create singleton instance
export const connectionService = new ConnectionService();

/**
 * React hook for connection status
 */
export function useConnectionStatus() {
  const [status, setStatus] = React.useState<ConnectionStatus>(connectionService.getStatus());

  React.useEffect(() => {
    return connectionService.subscribe(setStatus);
  }, []);

  return status;
}

// Export types and utilities
export { ConnectionService };
export default connectionService;