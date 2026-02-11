/**
 * Frontend logging utility with structured output.
 *
 * Provides consistent logging with timestamps and context data.
 * Debug logs are suppressed in production builds.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Suppress debug logs in production
const MIN_LOG_LEVEL = import.meta.env.PROD ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Format a timestamp in ISO 8601 format.
 */
function formatTimestamp() {
  return new Date().toISOString();
}

/**
 * Format context data for logging.
 */
function formatContext(context) {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }
  return JSON.stringify(context);
}

/**
 * Core logging function.
 */
function log(level, levelName, message, context = {}) {
  if (level < MIN_LOG_LEVEL) {
    return;
  }

  const timestamp = formatTimestamp();
  const contextStr = formatContext(context);
  const prefix = `[${timestamp}] [${levelName}]`;

  // Choose appropriate console method
  let consoleFn;
  switch (level) {
    case LOG_LEVELS.ERROR:
      consoleFn = console.error;
      break;
    case LOG_LEVELS.WARN:
      consoleFn = console.warn;
      break;
    case LOG_LEVELS.DEBUG:
      consoleFn = console.debug;
      break;
    default:
      consoleFn = console.log;
  }

  if (contextStr) {
    consoleFn(`${prefix} ${message}`, context);
  } else {
    consoleFn(`${prefix} ${message}`);
  }
}

/**
 * Logger interface for the application.
 */
export const logger = {
  /**
   * Log a debug message (suppressed in production).
   * @param {string} message - Log message
   * @param {object} context - Additional context data
   */
  debug(message, context = {}) {
    log(LOG_LEVELS.DEBUG, 'DEBUG', message, context);
  },

  /**
   * Log an informational message.
   * @param {string} message - Log message
   * @param {object} context - Additional context data
   */
  info(message, context = {}) {
    log(LOG_LEVELS.INFO, 'INFO', message, context);
  },

  /**
   * Log a warning message.
   * @param {string} message - Log message
   * @param {object} context - Additional context data
   */
  warn(message, context = {}) {
    log(LOG_LEVELS.WARN, 'WARN', message, context);
  },

  /**
   * Log an error message.
   * @param {string} message - Log message
   * @param {object} context - Additional context data
   */
  error(message, context = {}) {
    log(LOG_LEVELS.ERROR, 'ERROR', message, context);
  },
};

export default logger;
