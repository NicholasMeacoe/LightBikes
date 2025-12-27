/**
 * Centralized Logging Utility
 * Wraps Winston logger with a consistent interface for the application
 * Automatically disables console output in production
 */

const winston = require('winston');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create Winston logger instance
const winstonLogger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'lightbikes' },
    transports: [
        // Write all logs to combined.log
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Add console transport in development
if (!isProduction) {
    winstonLogger.add(
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        })
    );
}

/**
 * Logger class providing namespaced logging
 */
class Logger {
    constructor(namespace = 'app') {
        this.namespace = namespace;

        // Bind methods to instance to preserve 'this' context
        this.debug = this.debug.bind(this);
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);
        this.log = this.log.bind(this);
    }

    /**
     * Create a child logger with a specific namespace
     * @param {string} namespace - Logger namespace (e.g., 'GameEngine', 'Audio')
     * @returns {Logger} Child logger instance
     */
    static create(namespace) {
        return new Logger(namespace);
    }

    /**
     * Format message with namespace
     * @private
     */
    _formatMessage(message) {
        return `[${this.namespace}] ${message}`;
    }

    /**
     * Log debug message (verbose development info)
     * @param {string} message - Log message
     * @param {object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        winstonLogger.debug(this._formatMessage(message), meta);
    }

    /**
     * Log info message (general information)
     * @param {string} message - Log message
     * @param {object} meta - Additional metadata
     */
    info(message, meta = {}) {
        winstonLogger.info(this._formatMessage(message), meta);
    }

    /**
     * Log warning message (something unexpected but handled)
     * @param {string} message - Log message
     * @param {object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        winstonLogger.warn(this._formatMessage(message), meta);
    }

    /**
     * Log error message (errors that need attention)
     * @param {string} message - Log message
     * @param {Error|object} error - Error object or metadata
     */
    error(message, error = {}) {
        if (error instanceof Error) {
            winstonLogger.error(this._formatMessage(message), {
                error: error.message,
                stack: error.stack,
            });
        } else {
            winstonLogger.error(this._formatMessage(message), error);
        }
    }

    /**
     * Log with custom level
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {object} meta - Additional metadata
     */
    log(level, message, meta = {}) {
        winstonLogger.log(level, this._formatMessage(message), meta);
    }
}

// Create default logger
const defaultLogger = new Logger('app');

// Export both the Logger class and default instance
module.exports = {
    Logger,
    logger: defaultLogger,
    createLogger: Logger.create,
};
