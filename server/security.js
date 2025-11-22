const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

/**
 * Configure Winston logger for structured logging
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'lightbikes-server' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

/**
 * Rate limiting configuration for WebSocket connections
 */
const socketRateLimiter = {
    maxConnectionsPerMinute: 10,
    connections: new Map(),
    
    checkLimit(ip) {
        const now = Date.now();
        const record = this.connections.get(ip) || { count: 0, resetTime: now + 60000 };
        
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + 60000;
        }
        
        record.count++;
        this.connections.set(ip, record);
        
        return record.count <= this.maxConnectionsPerMinute;
    },
    
    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.connections.entries()) {
            if (now > record.resetTime) {
                this.connections.delete(ip);
            }
        }
    }
};

// Cleanup old rate limit records every minute
setInterval(() => socketRateLimiter.cleanup(), 60000);

/**
 * HTTP rate limiter for REST endpoints
 */
const httpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Security headers configuration
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow loading external resources
});

/**
 * Input validation helpers
 */
const validation = {
    isValidPlayerName(name) {
        return typeof name === 'string' && 
               name.length >= 2 && 
               name.length <= 20 && 
               /^[a-zA-Z0-9_-]+$/.test(name);
    },
    
    isValidRoomCode(code) {
        return typeof code === 'string' && 
               /^[A-Z0-9]{6}$/.test(code);
    },
    
    isValidGameMode(mode) {
        const validModes = ['classic', 'elimination', 'survival', 'team'];
        return validModes.includes(mode);
    },
    
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().slice(0, 1000); // Limit length
    }
};

module.exports = {
    logger,
    socketRateLimiter,
    httpRateLimiter,
    securityHeaders,
    validation,
};
