# Anti-Cheat System Quick Reference

## Quick Start

The anti-cheat system is automatically integrated into GameRoom. No additional setup required.

## Key Methods

### Validation Methods

```javascript
// Validate position change
antiCheat.validatePosition(playerId, newPosition, timestamp)
// Returns: { valid: boolean, violation?: string, details?: object }

// Validate direction change
antiCheat.validateDirection(playerId, newDirection, timestamp)
// Returns: { valid: boolean, violation?: string, details?: object }

// Validate speed
antiCheat.validateSpeed(playerId, distance, deltaTime)
// Returns: { valid: boolean, violation?: string, details?: object }
```

### Pattern Detection Methods

```javascript
// Detect speed hacking patterns
antiCheat.detectSpeedHacking(playerId)
// Returns: { detected: boolean, pattern?: string, details?: object }

// Detect teleportation patterns
antiCheat.detectTeleportation(playerId)
// Returns: { detected: boolean, pattern?: string, details?: object }

// Detect collision bypass
antiCheat.detectCollisionBypass(playerId, position, allTrails)
// Returns: { detected: boolean, pattern?: string, details?: object }
```

### Response Methods

```javascript
// Flag suspicious activity
antiCheat.flagSuspiciousActivity(playerId, violation)
// Returns: { action: 'warning'|'disconnect'|'ban', reason: string, violationCount: number }

// Disconnect cheater
antiCheat.disconnectCheater(playerId, reason)
// Returns: boolean

// Get player statistics
antiCheat.getPlayerStats(playerId)
// Returns: { totalViolations, recentViolations, positionHistorySize, speedHistorySize, violations }
```

## Violation Types

| Type | Description | Severity |
|------|-------------|----------|
| `teleportation` | Position jump > 1.0 units | High |
| `invalid_direction` | Non-standard direction vector | Medium |
| `illegal_reversal` | 180-degree turn attempt | Medium |
| `speed_hack` | Speed > 0.15 units/frame | High |
| `collision_bypass` | Surviving collision | Critical |
| `boundary_bypass` | Outside arena bounds | Critical |

## Response Actions

| Action | Trigger | Effect |
|--------|---------|--------|
| `warning` | 1-2 violations | Player notified, game continues |
| `disconnect` | 3+ recent violations | Player removed from game |
| `ban` | 10+ total violations | Player removed, logged for ban |

## Configuration

Adjust thresholds in `AntiCheatValidator` constructor:

```javascript
// Movement limits
this.maxSpeed = 0.15;              // Units per frame
this.maxTeleportDistance = 1.0;    // Maximum position jump
this.collisionTolerance = 0.5;     // Collision radius

// Response thresholds
this.warningThreshold = 3;         // Warnings before disconnect
this.banThreshold = 10;            // Total violations before ban

// History limits
this.maxPositionHistory = 100;     // Position samples to track
this.maxSpeedHistory = 60;         // Speed samples to track
this.maxViolationHistory = 50;     // Violations to remember
```

## Events

The anti-cheat system emits the following events to players:

```javascript
// Warning event
socket.emit('antiCheatWarning', {
    reason: 'speed_hack',
    violationCount: 2
});

// Kick event
socket.emit('kicked', {
    reason: 'anti_cheat_violation',
    details: 'multiple_violations',
    violationCount: 4
});
```

## Best Practices

1. **Don't disable validation**: Always keep anti-cheat enabled in production
2. **Monitor logs**: Review violation logs regularly for patterns
3. **Adjust thresholds carefully**: Too strict = false positives, too loose = cheaters slip through
4. **Test with network conditions**: Simulate lag to ensure legitimate players aren't flagged
5. **Provide appeal process**: Allow players to contest false positives

## Debugging

Enable detailed logging:

```javascript
// Anti-cheat logs are automatically written to console
// Look for lines starting with [AntiCheat]

// Get player stats for debugging
const stats = gameRoom.antiCheat.getPlayerStats(playerId);
console.log('Player stats:', stats);
```

## Common Issues

### False Positives
- **Cause**: Network lag causing position jumps
- **Solution**: Increase `maxTeleportDistance` or add lag compensation

### Cheaters Not Detected
- **Cause**: Thresholds too lenient
- **Solution**: Decrease `maxSpeed` or `warningThreshold`

### Performance Impact
- **Cause**: Too much history tracking
- **Solution**: Reduce `maxPositionHistory` and `maxSpeedHistory`

## Testing

Run anti-cheat tests:

```bash
# Unit tests
npx jest server/AntiCheatValidator.test.js

# Integration tests
npx jest server/anti-cheat-integration.test.js

# All server tests
npx jest server/
```
