# Server Security Implementation

This document describes the security measures implemented in the LightBikes server.

## Security Features

### 1. Helmet.js - Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)
- X-DNS-Prefetch-Control

### 2. Rate Limiting
- **HTTP endpoints**: 100 requests per 15 minutes per IP
- **WebSocket connections**: 10 connections per minute per IP
- Automatic cleanup of old rate limit records

### 3. Input Validation
All user inputs are validated and sanitized:
- Player names: 2-20 alphanumeric characters, underscores, hyphens
- Room codes: 6 uppercase alphanumeric characters
- Game modes: Must be one of: classic, elimination, survival, team
- General input: Limited to 1000 characters, trimmed

### 4. Structured Logging (Winston)
- JSON format for easy parsing
- Separate error and combined logs
- Timestamps and stack traces
- Environment-based log levels
- Console output in development

### 5. Environment Variables
Sensitive configuration should be stored in `.env`:
```
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

## Usage

### Importing Security Middleware

```javascript
const { 
    logger, 
    socketRateLimiter, 
    validation 
} = require('./security');

// Use logger instead of console.log
logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { error: err.message });

// Validate inputs
if (!validation.isValidPlayerName(name)) {
    logger.warn('Invalid player name', { name });
    return;
}

// Check rate limits
const clientIp = socket.handshake.address;
if (!socketRateLimiter.checkLimit(clientIp)) {
    logger.warn('Rate limit exceeded', { ip: clientIp });
    socket.disconnect();
    return;
}
```

## Best Practices

1. **Never log sensitive data** (passwords, API keys, tokens)
2. **Always validate user input** before processing
3. **Use rate limiting** on all public endpoints
4. **Keep dependencies updated** (`npm audit`)
5. **Use environment variables** for configuration
6. **Enable HTTPS** in production
7. **Implement CORS** properly for your domain

## Future Enhancements

- [ ] Add express-validator for REST endpoints
- [ ] Implement JWT authentication
- [ ] Add Redis for distributed rate limiting
- [ ] Set up centralized log aggregation (ELK/CloudWatch)
- [ ] Add monitoring and alerting (Prometheus/Grafana)
- [ ] Implement IP whitelist/blacklist
