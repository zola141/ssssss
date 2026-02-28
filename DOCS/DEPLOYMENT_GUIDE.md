# Production Deployment & Best Practices

## Table of Contents
1. [Testing Strategy](#testing)
2. [Monitoring & Observability](#monitoring)
3. [Security Hardening](#security)
4. [Performance Optimization](#performance)
5. [Deployment Checklist](#checklist)
6. [Disaster Recovery](#recovery)

---

## Testing Strategy

### Unit Tests: Game Logic

```javascript
// src/tests/unit/validator.test.js

const ValidatorService = require('../../services/ValidatorService');

describe('ValidatorService', () => {
  let validator;

  beforeEach(() => {
    validator = new ValidatorService();
  });

  describe('validateDiceRoll', () => {
    test('should allow roll on current player turn', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_1',
          diceRolled: false
        },
        status: 'PLAYING'
      };

      const result = validator.validateDiceRoll('player_1', gameState);
      expect(result.valid).toBe(true);
    });

    test('should reject roll not on current player turn', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_2',
          diceRolled: false
        }
      };

      const result = validator.validateDiceRoll('player_1', gameState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('NOT_YOUR_TURN');
    });

    test('should reject double roll', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_1',
          diceRolled: true
        }
      };

      const result = validator.validateDiceRoll('player_1', gameState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ALREADY_ROLLED');
    });
  });

  describe('validatePieceMove', () => {
    test('should allow valid move', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_1',
          diceRolled: true,
          diceValue: 3
        },
        pieces: [
          { id: 'piece_1', ownerId: 'player_1', position: 10 }
        ]
      };

      const result = validator.validatePieceMove(
        'player_1',
        'piece_1',
        13, // 10 + 3
        gameState
      );

      expect(result.valid).toBe(true);
    });

    test('should reject move with wrong distance', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_1',
          diceRolled: true,
          diceValue: 3
        },
        pieces: [
          { id: 'piece_1', ownerId: 'player_1', position: 10 }
        ]
      };

      const result = validator.validatePieceMove(
        'player_1',
        'piece_1',
        14, // Wrong distance
        gameState
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_DISTANCE');
    });

    test('should reject move of opponent piece', () => {
      const gameState = {
        currentTurn: {
          playerId: 'player_1',
          diceRolled: true,
          diceValue: 3
        },
        pieces: [
          { id: 'piece_2', ownerId: 'player_2', position: 10 }
        ]
      };

      const result = validator.validatePieceMove(
        'player_1',
        'piece_2',
        13,
        gameState
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('NOT_YOUR_PIECE');
    });
  });
});
```

### Integration Tests: Game Flow

```javascript
// src/tests/integration/gameFlow.test.js

const GameService = require('../../services/GameService');
const RoomService = require('../../services/RoomService');
const RedisManager = require('../../config/redis');

describe('GameFlow Integration', () => {
  let gameService, roomService, room;

  beforeEach(async () => {
    await RedisManager.connect();
    gameService = new GameService(RedisManager, { to: jest.fn(), emit: jest.fn() });
    roomService = new RoomService(RedisManager, { to: jest.fn(), emit: jest.fn() });
  });

  test('should complete full game flow', async () => {
    // 1. Create room
    const room = await roomService.createRoom('player_1', 'Test Room');
    expect(room.status).toBe('WAITING');

    // 2. Join players
    await roomService.joinRoom(room.roomId, 'player_2', 'Player 2');
    await roomService.joinRoom(room.roomId, 'player_3', 'Player 3');
    await roomService.joinRoom(room.roomId, 'player_4', 'Player 4');

    // 3. Start game
    const updatedRoom = await RedisManager.getRoom(room.roomId);
    expect(updatedRoom.players.length).toBe(4);

    await gameService.startGame(room.roomId, 'player_1');

    // 4. Roll dice
    const rollResult = await gameService.rollDice('player_1', room.roomId);
    expect(rollResult.success).toBe(true);
    expect(rollResult.diceValue).toBeGreaterThanOrEqual(1);
    expect(rollResult.diceValue).toBeLessThanOrEqual(6);

    // 5. Move piece
    const currentRoom = await RedisManager.getRoom(room.roomId);
    const availableMoves = rollResult.availableMoves;

    if (availableMoves.length > 0) {
      const move = availableMoves[0];
      const moveResult = await gameService.movePiece(
        'player_1',
        room.roomId,
        move.pieceId,
        move.to
      );
      expect(moveResult.success).toBe(true);
    }
  });

  test('should handle disconnection and reconnection', async () => {
    // Create and join room
    const room = await roomService.createRoom('player_1', 'Test');
    await roomService.joinRoom(room.roomId, 'player_2', 'Player 2');

    // Disconnect
    await roomService.handlePlayerDisconnection(room.roomId, 'player_2');
    let updatedRoom = await RedisManager.getRoom(room.roomId);
    expect(updatedRoom.players[1].status).toBe('DISCONNECTED');

    // Reconnect
    await roomService.reconnectPlayer(room.roomId, 'player_2', 'new_socket_id');
    updatedRoom = await RedisManager.getRoom(room.roomId);
    expect(updatedRoom.players[1].status).toBe('CONNECTED');
  });
});
```

---

## Monitoring & Observability

### Structured Logging

```javascript
// src/utils/logger.js

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata,
      pid: process.pid,
      env: process.env.NODE_ENV
    };

    console.log(JSON.stringify(logEntry));

    // Also write to file
    const logFile = path.join(
      this.logDir,
      `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
    );

    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf-8' }
    );
  }

  info(message, metadata) {
    this.log('INFO', message, metadata);
  }

  warn(message, metadata) {
    this.log('WARN', message, metadata);
  }

  error(message, metadata) {
    this.log('ERROR', message, metadata);
  }

  debug(message, metadata) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, metadata);
    }
  }
}

module.exports = new Logger();
```

### Metrics Collection

```javascript
// src/utils/metrics.js

class MetricsCollector {
  constructor() {
    this.metrics = {
      games: { total: 0, active: 0, finished: 0 },
      players: { total: 0, connected: 0, disconnected: 0 },
      events: { diceRolls: 0, pieceMoves: 0, captures: 0 },
      performance: { avgTurnTime: 0, avgEventLatency: 0 },
      errors: { invalid: 0, security: 0, network: 0 }
    };

    this.startTime = Date.now();
  }

  recordEvent(type, metadata = {}) {
    switch (type) {
      case 'DICE_ROLL':
        this.metrics.events.diceRolls++;
        break;
      case 'PIECE_MOVE':
        this.metrics.events.pieceMoves++;
        break;
      case 'CAPTURE':
        this.metrics.events.captures++;
        break;
    }
  }

  recordError(type) {
    switch (type) {
      case 'INVALID_MOVE':
        this.metrics.errors.invalid++;
        break;
      case 'SECURITY':
        this.metrics.errors.security++;
        break;
      case 'NETWORK':
        this.metrics.errors.network++;
        break;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.startTime = Date.now();
  }
}

module.exports = new MetricsCollector();
```

### Health Check Endpoint

```javascript
// src/routes/health.js

const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    const redisOk = await checkRedis();

    // Check system resources
    const systemHealth = checkSystem();

    const health = {
      status: redisOk && systemHealth.ok ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      redis: { connected: redisOk },
      system: systemHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

function checkRedis() {
  // Implement Redis health check
  return Promise.resolve(true);
}

function checkSystem() {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  return {
    ok: heapUsedPercent < 90,
    heapUsedPercent: heapUsedPercent.toFixed(2),
    cpuUsage: process.cpuUsage()
  };
}

module.exports = router;
```

---

## Security Hardening

### Input Validation Middleware

```javascript
// src/middleware/validation.js

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const validationRules = {
  playerId: /^[a-zA-Z0-9_-]{3,50}$/,
  playerName: /^[a-zA-Z0-9\s]{2,30}$/,
  roomName: /^[a-zA-Z0-9\s_-]{3,50}$/,
  roomId: /^room_[a-f0-9]{16}$/
};

function validateInput(schema) {
  return (req, res, next) => {
    for (const field in schema) {
      if (!(schema[field].test(req.body[field]))) {
        return res.status(400).json({
          error: `Invalid ${field}`,
          expected: schema[field].toString()
        });
      }
    }
    next();
  };
}

// Apply helmet for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per windowMs
  message: 'Too many requests from this IP'
});

const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 rooms per hour per IP
  skipSuccessfulRequests: true
});

module.exports = {
  validateInput,
  validationRules,
  helmetConfig,
  apiLimiter,
  createRoomLimiter
};
```

### Anti-Cheat Detection

```javascript
// src/services/AnticheatService.js

class AnticheatService {
  constructor(redisManager) {
    this.redis = redisManager;
    this.suspiciousThreshold = 5; // Flag after 5 suspicious events
    this.banThreshold = 10; // Ban after 10 suspicious events
  }

  async recordSuspiciousActivity(playerId, activityType, severity = 'low') {
    const key = `anticheat:${playerId}`;
    const count = await this.redis.client.incr(key);
    await this.redis.client.expire(key, 3600); // 1 hour window

    const activity = {
      playerId,
      type: activityType,
      severity,
      timestamp: Date.now()
    };

    // Log to database
    await this.logActivity(activity);

    if (count >= this.banThreshold) {
      await this.banPlayer(playerId);
      return 'BANNED';
    }

    if (count >= this.suspiciousThreshold) {
      return 'FLAGGED';
    }

    return 'MONITORED';
  }

  async validateSequence(playerId, expectedSequence, receivedSequence) {
    if (receivedSequence !== expectedSequence) {
      await this.recordSuspiciousActivity(
        playerId,
        'SEQUENCE_MISMATCH',
        'high'
      );
      return false;
    }
    return true;
  }

  async validateChecksum(playerId, expectedChecksum, receivedChecksum) {
    if (receivedChecksum !== expectedChecksum) {
      await this.recordSuspiciousActivity(
        playerId,
        'CHECKSUM_MISMATCH',
        'high'
      );
      return false;
    }
    return true;
  }

  async validateTimestamp(actionTime, currentTime) {
    const diff = currentTime - actionTime;

    // Reject if more than 5 seconds in the future
    if (diff < -5000) {
      return { valid: false, reason: 'FUTURE_TIMESTAMP' };
    }

    // Reject if more than 5 minutes in the past
    if (diff > 300000) {
      return { valid: false, reason: 'STALE_TIMESTAMP' };
    }

    return { valid: true };
  }

  async banPlayer(playerId) {
    await this.redis.client.setex(
      `banned:${playerId}`,
      86400, // 24 hours
      'banned'
    );

    console.warn(`Player ${playerId} banned due to suspicious activity`);
  }

  async isBanned(playerId) {
    const banned = await this.redis.client.get(`banned:${playerId}`);
    return !!banned;
  }

  async logActivity(activity) {
    // Store in database for review
    console.log('ANTICHEAT ALERT:', activity);
  }
}

module.exports = AnticheatService;
```

---

## Performance Optimization

### Caching Strategy

```javascript
// src/services/CacheService.js

class CacheService {
  constructor(redisManager) {
    this.redis = redisManager;
    this.localCache = new Map(); // Optional local cache for ultra-hot data
    this.ttls = {
      ROOM: 3600, // 1 hour
      PLAYER_STATS: 300, // 5 minutes
      GAME_RESULT: 86400, // 24 hours
      LEADERBOARD: 600 // 10 minutes
    };
  }

  async getOrCompute(key, ttl, computeFn) {
    // Try local cache first
    if (this.localCache.has(key)) {
      const { value, expiresAt } = this.localCache.get(key);
      if (expiresAt > Date.now()) {
        return value;
      }
      this.localCache.delete(key);
    }

    // Try Redis
    const cached = await this.redis.client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Compute and cache
    const value = await computeFn();
    await this.redis.client.setex(key, ttl, JSON.stringify(value));

    // Also store in local cache
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    });

    return value;
  }

  async invalidate(pattern) {
    // Clear from Redis
    const keys = await this.redis.client.keys(pattern);
    if (keys.length > 0) {
      await this.redis.client.del(...keys);
    }

    // Clear from local cache
    for (const key of this.localCache.keys()) {
      if (new RegExp(pattern).test(key)) {
        this.localCache.delete(key);
      }
    }
  }
}
```

### Query Optimization

```javascript
// src/services/QueryService.js

class QueryService {
  constructor(redisManager) {
    this.redis = redisManager;
  }

  // Use Redis pipelines for batch operations
  async getMultipleRooms(roomIds) {
    const pipeline = this.redis.client.pipeline();

    for (const roomId of roomIds) {
      pipeline.get(`room:${roomId}`);
    }

    const results = await pipeline.exec();
    return results.map((result, index) => {
      if (result[0]) throw result[0]; // Handle errors
      return result[1] ? JSON.parse(result[1]) : null;
    });
  }

  // Batch write with pipeline
  async updateMultiplePlayers(updates) {
    const pipeline = this.redis.client.pipeline();

    for (const [playerId, data] of Object.entries(updates)) {
      pipeline.setex(
        `player:${playerId}`,
        3600,
        JSON.stringify(data)
      );
    }

    await pipeline.exec();
  }

  // Index-based queries for discovering rooms
  async findRoomsByStatus(status) {
    const roomIds = await this.redis.client.smembers(`rooms:status:${status}`);
    return this.getMultipleRooms(roomIds);
  }

  async findPublicRooms(limit = 10) {
    const roomIds = await this.redis.client.zrevrange(
      'rooms:created',
      0,
      limit - 1
    );

    const rooms = await this.getMultipleRooms(roomIds);
    return rooms.filter(r => r && r.visibility === 'PUBLIC');
  }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
  ```bash
  npm test
  npm run test:coverage
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  npm run format
  ```

- [ ] Environment variables configured
  ```bash
  cp .env.example .env
  # Edit .env with production values
  ```

- [ ] Database migrations applied
  ```bash
  npm run migrate
  ```

- [ ] Load testing completed
  ```bash
  npm run load-test
  # Should handle 10,000+ concurrent connections
  ```

### Deployment Steps

```bash
#!/bin/bash
# deployment.sh

set -e

echo "Starting deployment..."

# 1. Build Docker image
docker build -t game-server:$VERSION .

# 2. Push to registry
docker push game-server:$VERSION

# 3. Update Kubernetes deployment
kubectl set image deployment/game-server \
  game-server=game-server:$VERSION \
  --record

# 4. Wait for rollout
kubectl rollout status deployment/game-server

# 5. Run smoke tests
npm run smoke-test

# 6. Monitor metrics
echo "Deployment complete. Monitor metrics at:"
echo "https://monitoring.game.com/dashboard"
```

### Kubernetes Deployment

```yaml
# kubernetes/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-server
  namespace: game
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  selector:
    matchLabels:
      app: game-server

  template:
    metadata:
      labels:
        app: game-server

    spec:
      containers:
      - name: game-server
        image: game-server:latest
        imagePullPolicy: Always

        ports:
        - containerPort: 3000
          name: http

        env:
        - name: NODE_ENV
          value: production
        - name: REDIS_HOST
          value: redis-cluster.game.svc.cluster.local
        - name: PORT
          value: "3000"

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "1000m"

        volumeMounts:
        - name: logs
          mountPath: /app/logs

      volumes:
      - name: logs
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: game-server
  namespace: game
spec:
  type: LoadBalancer
  selector:
    app: game-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
    name: http
```

---

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Daily backup of Redis
redis-cli --rdb /backups/redis-$(date +%Y%m%d).rdb

# Archive old backups
find /backups -name "redis-*.rdb" -mtime +30 -delete

# Upload to S3
aws s3 sync /backups s3://game-backups/$(date +%Y/%m/%d)/

# Verify backup
redis-cli --rdb /tmp/test.rdb && echo "Backup verified"
```

### Recovery Procedure

```javascript
// src/scripts/recover.js

const redis = require('redis');
const fs = require('fs');

async function recoverFromBackup(backupFile) {
  console.log(`Recovering from ${backupFile}...`);

  // 1. Stop accepting new connections
  console.log('Stopping new connections...');

  // 2. Wait for existing connections to finish
  console.log('Waiting for existing games to complete...');
  await sleep(5000);

  // 3. Restore Redis from backup
  console.log('Restoring Redis database...');
  const client = redis.createClient();

  // Flush all data
  await client.flushall();

  // Load backup data
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  for (const [key, value] of Object.entries(backupData)) {
    await client.set(key, JSON.stringify(value));
  }

  // 4. Verify recovery
  const recoveredRooms = await client.keys('room:*');
  console.log(`Recovered ${recoveredRooms.length} rooms`);

  // 5. Resume operations
  console.log('Recovery complete. Resuming operations...');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Monitoring Dashboards

### Grafana Configuration

```json
{
  "dashboard": {
    "title": "Parcheesi Game Server",
    "panels": [
      {
        "title": "Active Games",
        "targets": [
          {
            "expr": "count(redis_info{name='rooms:active'})"
          }
        ]
      },
      {
        "title": "Connected Players",
        "targets": [
          {
            "expr": "sum(game_players_connected)"
          }
        ]
      },
      {
        "title": "Average Turn Time",
        "targets": [
          {
            "expr": "rate(game_turn_duration_sum[5m]) / rate(game_turn_duration_count[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(game_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Server Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

---

**This comprehensive guide covers everything needed for production deployment and maintenance.**

