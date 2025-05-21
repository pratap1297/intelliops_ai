// Centralized logger utility for frontend (TypeScript)
// Usage: import logger from 'lib/logger'; logger.log(...), logger.error(...), etc.

const isProduction = process.env.NODE_ENV === 'production' || import.meta.env.MODE === 'production';

const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors in all environments
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  }
};

export default logger;
