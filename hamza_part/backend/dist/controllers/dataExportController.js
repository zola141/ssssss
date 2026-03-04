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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImportFile = exports.importData = exports.exportMatchesData = exports.exportAllData = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const database_1 = require("../models/database");
const dataExport_1 = require("../utils/dataExport");
const validation_1 = require("../utils/validation");
const exportAllData = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const validFormats = ['json', 'csv', 'xml'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({ error: 'Invalid format' });
        }
        // Fetch all data
        const matchesResult = await (0, database_1.query)('SELECT * FROM matches');
        const statsResult = await (0, database_1.query)('SELECT * FROM user_stats');
        const activityResult = await (0, database_1.query)('SELECT * FROM user_activity');
        const exportData = {
            matches: matchesResult.rows,
            userStats: statsResult.rows,
            userActivity: activityResult.rows,
        };
        let content;
        const fileName = `transcendence-export-${Date.now()}`;
        if (format === 'json') {
            content = (0, dataExport_1.exportToJSON)(exportData);
        }
        else if (format === 'csv') {
            content = (0, dataExport_1.exportToCSV)(exportData, 'matches');
        }
        else {
            content = (0, dataExport_1.exportToXML)(exportData);
        }
        const contentType = format === 'json'
            ? 'application/json'
            : format === 'csv'
                ? 'text/csv'
                : 'application/xml';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${format}"`);
        res.send(content);
    }
    catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
};
exports.exportAllData = exportAllData;
const exportMatchesData = async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const result = await (0, database_1.query)('SELECT * FROM matches ORDER BY created_at DESC');
        const exportData = { matches: result.rows };
        let content;
        const fileName = `matches-export-${Date.now()}`;
        if (format === 'json') {
            content = (0, dataExport_1.exportToJSON)(exportData);
        }
        else if (format === 'csv') {
            content = (0, dataExport_1.exportToCSV)(exportData, 'matches');
        }
        else {
            content = (0, dataExport_1.exportToXML)(exportData);
        }
        const contentType = format === 'json'
            ? 'application/json'
            : format === 'csv'
                ? 'text/csv'
                : 'application/xml';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${format}"`);
        res.send(content);
    }
    catch (error) {
        console.error('Error exporting matches:', error);
        res.status(500).json({ error: 'Failed to export matches' });
    }
};
exports.exportMatchesData = exportMatchesData;
const importData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
        const validFormats = ['json', 'csv', 'xml'];
        if (!validFormats.includes(fileExt)) {
            return res.status(400).json({ error: 'Invalid file format' });
        }
        const importedData = await (0, dataExport_1.parseImportFile)(req.file.path, fileExt);
        // Validate data
        const { error, value } = validation_1.dataImportSchema.validate(importedData);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        let insertedRecords = 0;
        // Insert users first (to satisfy foreign keys)
        if (value.users && value.users.length > 0) {
            for (const user of value.users) {
                await (0, database_1.query)(`INSERT INTO users (id, username, email, profile_picture, bio)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`, [user.id, user.username, user.email, user.profile_picture, user.bio]);
                insertedRecords++;
            }
        }
        // Insert matches
        if (value.matches && value.matches.length > 0) {
            for (const match of value.matches) {
                // Determine player count
                let playerCount = 2;
                if (match.player3_id)
                    playerCount = 3;
                if (match.player4_id)
                    playerCount = 4;
                await (0, database_1.query)(`INSERT INTO matches (player1_id, player2_id, player3_id, player4_id, score1, score2, score3, score4, player_count, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
                    match.player1_id, match.player2_id,
                    match.player3_id || null, match.player4_id || null,
                    match.score1, match.score2,
                    match.score3 ?? null, match.score4 ?? null,
                    playerCount, match.duration,
                ]);
                insertedRecords++;
            }
        }
        // Insert user stats
        if (value.userStats && value.userStats.length > 0) {
            for (const stat of value.userStats) {
                await (0, database_1.query)(`INSERT INTO user_stats (user_id, total_wins, total_losses, level, xp)
           VALUES ($1, $2, $3, $4, $5)`, [stat.user_id, stat.total_wins, stat.total_losses, stat.level, stat.xp]);
                insertedRecords++;
            }
        }
        // Insert user activity
        if (value.userActivity && value.userActivity.length > 0) {
            for (const activity of value.userActivity) {
                await (0, database_1.query)(`INSERT INTO user_activity (user_id, action, timestamp)
           VALUES ($1, $2, $3)`, [activity.user_id, activity.action, activity.timestamp]);
                insertedRecords++;
            }
        }
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        res.json({
            success: true,
            message: `Successfully imported ${insertedRecords} records`,
            recordsImported: insertedRecords,
        });
    }
    catch (error) {
        console.error('Error importing data:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to import data' });
    }
};
exports.importData = importData;
const validateImportFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
        const importedData = await (0, dataExport_1.parseImportFile)(req.file.path, fileExt);
        const { error, value } = validation_1.dataImportSchema.validate(importedData);
        if (error) {
            return res.status(400).json({
                valid: false,
                error: error.details[0].message,
            });
        }
        fs.unlinkSync(req.file.path);
        res.json({
            valid: true,
            recordCount: {
                users: value.users?.length || 0,
                matches: value.matches?.length || 0,
                userStats: value.userStats?.length || 0,
                userActivity: value.userActivity?.length || 0,
            },
        });
    }
    catch (error) {
        console.error('Error validating file:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to validate file' });
    }
};
exports.validateImportFile = validateImportFile;
//# sourceMappingURL=dataExportController.js.map