import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import analyticsRoutes from './routes/analyticsRoutes';
import dataExportRoutes from './routes/dataExportRoutes';
import gdprRoutes from './routes/gdprRoutes';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/gdpr', gdprRoutes);

// Serve merged frontend (hamza_part/frontend build)
const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.get(/^\/(?!api\/|health$).*/, (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Socket.io connection for real-time updates
io.on('connection', (socket) => {
  socket.on('subscribe-dashboard', () => {
    // Client subscribed to dashboard updates
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Export io instance for use in other modules
export const getIO = () => io;

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  }
);

const PORT = process.env.PORT || 5000;

const postJson = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(
      urlObj,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (resp) => {
        let raw = '';
        resp.on('data', (chunk) => {
          raw += chunk;
        });

        resp.on('end', () => {
          if (!resp.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
            reject(new Error(`Sync request failed with status ${resp.statusCode}`));
            return;
          }

          try {
            resolve(raw ? JSON.parse(raw) : {});
          } catch (error) {
            resolve({});
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
};

const triggerMergedStatsSync = async () => {
  try {
    const syncUrl = process.env.SELF_SYNC_URL || `http://localhost:${PORT}/api/analytics/sync-json`;
    const result = await postJson(syncUrl);
    console.log('Merged stats sync completed', result?.summary || '');
  } catch (error) {
    console.error('Merged stats sync failed:', error);
  }
};

httpServer.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Auto-sync merged stats JSON at startup and periodically
  triggerMergedStatsSync();
  const intervalMs = Number(process.env.MERGED_STATS_SYNC_INTERVAL_MS || 300000);
  if (intervalMs > 0) {
    setInterval(() => {
      triggerMergedStatsSync();
    }, intervalMs);
  }
});

export default app;
