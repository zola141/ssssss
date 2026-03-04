"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv = __importStar(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const http_2 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const dataExportRoutes_1 = __importDefault(require("./routes/dataExportRoutes"));
const gdprRoutes_1 = __importDefault(require("./routes/gdprRoutes"));
dotenv.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
// API Routes
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/data-export', dataExportRoutes_1.default);
app.use('/api/gdpr', gdprRoutes_1.default);
// Serve merged frontend (hamza_part/frontend build)
const frontendBuildPath = path_1.default.resolve(__dirname, '../../frontend/build');
if (fs_1.default.existsSync(frontendBuildPath)) {
    app.use(express_1.default.static(frontendBuildPath));
    app.get(/^\/(?!api\/|health$).*/, (req, res) => {
        res.sendFile(path_1.default.join(frontendBuildPath, 'index.html'));
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
const getIO = () => io;
exports.getIO = getIO;
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
const PORT = process.env.PORT || 5000;
const postJson = (url) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https_1.default : http_2.default;
        const req = client.request(urlObj, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }, (resp) => {
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
                }
                catch (error) {
                    resolve({});
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
};
const triggerMergedStatsSync = async () => {
    try {
        const syncUrl = process.env.SELF_SYNC_URL || `http://localhost:${PORT}/api/analytics/sync-json`;
        const result = await postJson(syncUrl);
        console.log('Merged stats sync completed', result?.summary || '');
    }
    catch (error) {
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
exports.default = app;
//# sourceMappingURL=server.js.map