// Production-ready logging utility
// Only logs in development mode or when debug is explicitly enabled

interface LogConfig {
  enableInProduction?: boolean;
  prefix?: string;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private isDebugEnabled = false;

  constructor() {
    // Check if debug is enabled via localStorage
    this.isDebugEnabled = localStorage.getItem('debug-mode') === 'true';
  }

  private shouldLog(config?: LogConfig): boolean {
    return this.isDevelopment || this.isDebugEnabled || config?.enableInProduction || false;
  }

  private formatMessage(message: string, prefix?: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefixStr = prefix ? `[${prefix}] ` : '';
    return `${timestamp} ${prefixStr}${message}`;
  }

  log(message: string, data?: any, config?: LogConfig): void {
    if (this.shouldLog(config)) {
      if (data !== undefined) {
        console.log(this.formatMessage(message, config?.prefix), data);
      } else {
        console.log(this.formatMessage(message, config?.prefix));
      }
    }
  }

  warn(message: string, data?: any, config?: LogConfig): void {
    if (this.shouldLog(config)) {
      if (data !== undefined) {
        console.warn(this.formatMessage(message, config?.prefix), data);
      } else {
        console.warn(this.formatMessage(message, config?.prefix));
      }
    }
  }

  error(message: string, data?: any, config?: LogConfig): void {
    // Always log errors, even in production
    if (data !== undefined) {
      console.error(this.formatMessage(message, config?.prefix), data);
    } else {
      console.error(this.formatMessage(message, config?.prefix));
    }
  }

  debug(message: string, data?: any, config?: LogConfig): void {
    if (this.shouldLog(config)) {
      if (data !== undefined) {
        console.debug(this.formatMessage(`[DEBUG] ${message}`, config?.prefix), data);
      } else {
        console.debug(this.formatMessage(`[DEBUG] ${message}`, config?.prefix));
      }
    }
  }

  // Enable/disable debug mode
  enableDebug(): void {
    this.isDebugEnabled = true;
    localStorage.setItem('debug-mode', 'true');
    console.log('🐛 Debug logging enabled');
  }

  disableDebug(): void {
    this.isDebugEnabled = false;
    localStorage.removeItem('debug-mode');
    console.log('🐛 Debug logging disabled');
  }
}

// Export singleton instance
export const logger = new Logger();

// Global debug functions for easy access
declare global {
  interface Window {
    enableDebug: () => void;
    disableDebug: () => void;
  }
}

// Make debug functions globally available
if (typeof window !== 'undefined') {
  window.enableDebug = () => logger.enableDebug();
  window.disableDebug = () => logger.disableDebug();
} 