"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMergedStats = exports.syncMergedStatsJson = exports.getPositionWinRates = exports.recordMatch = exports.exportAnalytics = exports.getActivityTrends = exports.getUserRankings = exports.getStatsSummary = exports.getUserActivity = exports.getStats = exports.getMatchHistory = void 0;
const database_1 = require("../models/database");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const getMatchHistory = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        let queryStr = `
      SELECT id, player1_id, player2_id, player3_id, player4_id,
             score1, score2, score3, score4,
             winner_id, player_count, duration, created_at
      FROM matches
      WHERE 1=1
    `;
        const params = [];
        if (startDate) {
            params.push(startDate + ' 00:00:00');
            queryStr += ` AND created_at >= $${params.length}::timestamp`;
        }
        if (endDate) {
            params.push(endDate + ' 23:59:59');
            queryStr += ` AND created_at <= $${params.length}::timestamp`;
        }
        if (userId) {
            params.push(userId);
            queryStr += ` AND (player1_id = $${params.length} OR player2_id = $${params.length} OR player3_id = $${params.length} OR player4_id = $${params.length})`;
        }
        queryStr += ` ORDER BY created_at DESC`;
        const result = await (0, database_1.query)(queryStr, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ error: 'Failed to fetch match history' });
    }
};
exports.getMatchHistory = getMatchHistory;
const getStats = async (req, res) => {
    try {
        const { userId } = req.query;
        let queryStr = `
      SELECT us.user_id, u.username, us.total_wins, us.total_losses, us.level, us.xp
      FROM user_stats us
      JOIN users u ON u.id = us.user_id
      WHERE 1=1
    `;
        const params = [];
        if (userId) {
            params.push(userId);
            queryStr += ` AND us.user_id = $${params.length}`;
        }
        const result = await (0, database_1.query)(queryStr, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
exports.getStats = getStats;
const getUserActivity = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        let queryStr = `
      SELECT user_id, action, timestamp
      FROM user_activity
      WHERE 1=1
    `;
        const params = [];
        if (startDate) {
            params.push(startDate + ' 00:00:00');
            queryStr += ` AND timestamp >= $${params.length}::timestamp`;
        }
        if (endDate) {
            params.push(endDate + ' 23:59:59');
            queryStr += ` AND timestamp <= $${params.length}::timestamp`;
        }
        if (userId) {
            params.push(userId);
            queryStr += ` AND user_id = $${params.length}`;
        }
        queryStr += ` ORDER BY timestamp DESC`;
        const result = await (0, database_1.query)(queryStr, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
};
exports.getUserActivity = getUserActivity;
const getStatsSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchesQuery = `
      SELECT COUNT(*) as total_matches,
             AVG(duration) as avg_duration
      FROM matches
      WHERE 1=1
    `;
        const params = [];
        if (startDate) {
            params.push(startDate + ' 00:00:00');
            matchesQuery += ` AND created_at >= $${params.length}::timestamp`;
        }
        if (endDate) {
            params.push(endDate + ' 23:59:59');
            matchesQuery += ` AND created_at <= $${params.length}::timestamp`;
        }
        const matchResult = await (0, database_1.query)(matchesQuery, params);
        const userStatsQuery = `
      SELECT COUNT(*) as total_users,
             AVG(total_wins) as avg_wins,
             AVG(total_losses) as avg_losses,
             AVG(level) as avg_level,
             MAX(level) as max_level
      FROM user_stats
    `;
        const userResult = await (0, database_1.query)(userStatsQuery);
        // Multi-game trend: average duration by player count
        const trendQuery = `
      SELECT player_count,
             COUNT(*) as match_count,
             AVG(duration) as avg_duration
      FROM matches
      WHERE 1=1
      GROUP BY player_count
      ORDER BY player_count
    `;
        const trendResult = await (0, database_1.query)(trendQuery);
        res.json({
            matches: matchResult.rows[0],
            users: userResult.rows[0],
            durationByPlayerCount: trendResult.rows,
            timestamp: new Date(),
        });
    }
    catch (error) {
        console.error('Error fetching stats summary:', error);
        res.status(500).json({ error: 'Failed to fetch stats summary' });
    }
};
exports.getStatsSummary = getStatsSummary;
const getUserRankings = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const queryStr = `
      SELECT user_id, total_wins, total_losses, level, xp,
             ROUND(100.0 * total_wins / (total_wins + total_losses), 2) as win_rate
      FROM user_stats
      WHERE (total_wins + total_losses) > 0
      ORDER BY level DESC, xp DESC
      LIMIT $1
    `;
        const result = await (0, database_1.query)(queryStr, [limit]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
};
exports.getUserRankings = getUserRankings;
const getActivityTrends = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStr = `
      SELECT DATE(timestamp) as date, action, COUNT(*) as count
      FROM user_activity
      WHERE 1=1
    `;
        const params = [];
        if (startDate) {
            params.push(startDate + ' 00:00:00');
            queryStr += ` AND timestamp >= $${params.length}::timestamp`;
        }
        if (endDate) {
            params.push(endDate + ' 23:59:59');
            queryStr += ` AND timestamp <= $${params.length}::timestamp`;
        }
        queryStr += ` GROUP BY DATE(timestamp), action ORDER BY date ASC`;
        const result = await (0, database_1.query)(queryStr, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching activity trends:', error);
        res.status(500).json({ error: 'Failed to fetch activity trends' });
    }
};
exports.getActivityTrends = getActivityTrends;
const exportAnalytics = async (req, res) => {
    try {
        const { format = 'csv', startDate, endDate } = req.query;
        let matchQueryStr = `
      SELECT id, player1_id, player2_id, player3_id, player4_id,
             score1, score2, score3, score4,
             winner_id, player_count, duration, created_at
      FROM matches
      WHERE 1=1
    `;
        const params = [];
        if (startDate) {
            params.push(startDate + ' 00:00:00');
            matchQueryStr += ` AND created_at >= $${params.length}::timestamp`;
        }
        if (endDate) {
            params.push(endDate + ' 23:59:59');
            matchQueryStr += ` AND created_at <= $${params.length}::timestamp`;
        }
        const matchResult = await (0, database_1.query)(matchQueryStr, params);
        if (format === 'csv') {
            const headers = [
                'ID', 'Player 1', 'Player 2', 'Player 3', 'Player 4',
                'Score 1', 'Score 2', 'Score 3', 'Score 4',
                'Winner', 'Player Count', 'Duration (s)', 'Date',
            ];
            const rows = matchResult.rows.map((match) => [
                match.id,
                match.player1_id,
                match.player2_id,
                match.player3_id || '',
                match.player4_id || '',
                match.score1,
                match.score2,
                match.score3 ?? '',
                match.score4 ?? '',
                match.winner_id || '',
                match.player_count,
                match.duration,
                new Date(match.created_at).toISOString(),
            ]);
            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
            ].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
            res.send(csvContent);
        }
        else if (format === 'pdf') {
            const formatMatch = (m) => {
                let text = `- Match ${m.id}: ${m.player1_id} vs ${m.player2_id}`;
                if (m.player3_id)
                    text += ` vs ${m.player3_id}`;
                if (m.player4_id)
                    text += ` vs ${m.player4_id}`;
                text += ` (${m.score1}:${m.score2}`;
                if (m.score3 !== null && m.score3 !== undefined)
                    text += `:${m.score3}`;
                if (m.score4 !== null && m.score4 !== undefined)
                    text += `:${m.score4}`;
                text += `)`;
                if (m.winner_id)
                    text += ` Winner: ${m.winner_id}`;
                return text;
            };
            const pdfContent = `
ANALYTICS REPORT
Generated: ${new Date().toISOString()}
Date Range: ${startDate || 'All'} to ${endDate || 'All'}

MATCHES DATA
${matchResult.rows.map(formatMatch).join('\n')}

Total Matches: ${matchResult.rows.length}
      `.trim();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="analytics.pdf"');
            res.send(pdfContent);
        }
        else {
            res.status(400).json({ error: 'Unsupported format' });
        }
    }
    catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({ error: 'Failed to export analytics' });
    }
};
exports.exportAnalytics = exportAnalytics;
const recordMatch = async (req, res) => {
    try {
        const { player1_id, player2_id, player3_id, player4_id, score1, score2, score3, score4, duration, } = req.body;
        // Determine player count
        let playerCount = 2;
        if (player3_id)
            playerCount = 3;
        if (player4_id)
            playerCount = 4;
        // Determine winner (highest score)
        const participants = [
            { id: player1_id, score: score1 },
            { id: player2_id, score: score2 },
        ];
        if (player3_id && score3 !== undefined && score3 !== null) {
            participants.push({ id: player3_id, score: score3 });
        }
        if (player4_id && score4 !== undefined && score4 !== null) {
            participants.push({ id: player4_id, score: score4 });
        }
        const winner = participants.reduce((best, p) => p.score > best.score ? p : best, participants[0]);
        const winnerId = winner.id;
        // Insert the match (trigger will also update stats, but we do it explicitly for reliability)
        const insertQuery = `
      INSERT INTO matches (
        player1_id, player2_id, player3_id, player4_id,
        score1, score2, score3, score4,
        winner_id, player_count, duration, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
        const insertParams = [
            player1_id, player2_id, player3_id || null, player4_id || null,
            score1, score2, score3 ?? null, score4 ?? null,
            winnerId, playerCount, duration,
        ];
        const result = await (0, database_1.query)(insertQuery, insertParams);
        const newMatch = result.rows[0];
        // Emit real-time update event
        const io = require('../server').getIO();
        io.emit('dashboard-update', { type: 'new_match', data: newMatch });
        res.status(201).json(newMatch);
    }
    catch (error) {
        console.error('Error recording match:', error);
        res.status(500).json({ error: 'Failed to record match' });
    }
};
exports.recordMatch = recordMatch;
// Win rate by starting position (for multi-game trend analysis)
const getPositionWinRates = async (req, res) => {
    try {
        const { playerCount } = req.query;
        const pc = playerCount ? Number(playerCount) : 4;
        const queryStr = `
      SELECT
        'position_1' as position,
        COUNT(*) FILTER (WHERE winner_id = player1_id) as wins,
        COUNT(*) as total
      FROM matches WHERE player_count = $1
      UNION ALL
      SELECT
        'position_2',
        COUNT(*) FILTER (WHERE winner_id = player2_id),
        COUNT(*)
      FROM matches WHERE player_count = $1
      UNION ALL
      SELECT
        'position_3',
        COUNT(*) FILTER (WHERE winner_id = player3_id),
        COUNT(*)
      FROM matches WHERE player_count = $1 AND player3_id IS NOT NULL
      UNION ALL
      SELECT
        'position_4',
        COUNT(*) FILTER (WHERE winner_id = player4_id),
        COUNT(*)
      FROM matches WHERE player_count = $1 AND player4_id IS NOT NULL
    `;
        const result = await (0, database_1.query)(queryStr, [pc]);
        const rates = result.rows.map((row) => ({
            position: row.position,
            wins: parseInt(row.wins, 10),
            total: parseInt(row.total, 10),
            winRate: row.total > 0 ? Math.round((row.wins / row.total) * 10000) / 100 : 0,
        }));
        res.json(rates);
    }
    catch (error) {
        console.error('Error fetching position win rates:', error);
        res.status(500).json({ error: 'Failed to fetch position win rates' });
    }
};
exports.getPositionWinRates = getPositionWinRates;
const ANALYTICS_JSON_PATH = path_1.default.resolve(__dirname, '../../data/analytics-stats.json');
const httpGetJson = (url) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https_1.default : http_1.default;
        const req = client.get(urlObj, (resp) => {
            let raw = '';
            resp.on('data', (chunk) => {
                raw += chunk;
            });
            resp.on('end', () => {
                if (!resp.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
                    reject(new Error(`Request failed with status ${resp.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(raw));
                }
                catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
};
const normalizeStats = (rows) => {
    return (rows || []).map((row) => ({
        user_id: String(row.user_id),
        username: String(row.username || `Player-${row.user_id}`),
        total_wins: Number(row.total_wins || 0),
        total_losses: Number(row.total_losses || 0),
        level: Number(row.level || 1),
        xp: Number(row.xp || 0),
    }));
};
const buildPayload = (stats) => {
    const totals = stats.reduce((acc, row) => {
        const wins = Number(row.total_wins || 0);
        const losses = Number(row.total_losses || 0);
        acc.totalWins += wins;
        acc.totalLosses += losses;
        acc.totalMatches += wins + losses;
        return acc;
    }, { totalWins: 0, totalLosses: 0, totalMatches: 0 });
    return {
        generatedAt: new Date().toISOString(),
        source: 'main-backend-mongodb',
        stats,
        summary: {
            playerCount: stats.length,
            ...totals,
        },
    };
};
const syncMergedStatsJson = async (req, res) => {
    try {
        const mainBackendUrl = process.env.MAIN_BACKEND_URL || 'http://localhost:3000';
        const response = await httpGetJson(`${mainBackendUrl}/api/analytics/stats`);
        if (!Array.isArray(response)) {
            return res.status(502).json({ error: 'Main backend returned invalid stats format' });
        }
        const stats = normalizeStats(response);
        const payload = buildPayload(stats);
        await promises_1.default.mkdir(path_1.default.dirname(ANALYTICS_JSON_PATH), { recursive: true });
        await promises_1.default.writeFile(ANALYTICS_JSON_PATH, JSON.stringify(payload, null, 2), 'utf-8');
        res.json({
            success: true,
            path: ANALYTICS_JSON_PATH,
            summary: payload.summary,
            generatedAt: payload.generatedAt,
        });
    }
    catch (error) {
        console.error('Error syncing merged stats JSON:', error);
        res.status(500).json({ error: 'Failed to sync merged stats JSON' });
    }
};
exports.syncMergedStatsJson = syncMergedStatsJson;
const getMergedStats = async (req, res) => {
    try {
        const content = await promises_1.default.readFile(ANALYTICS_JSON_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        if (!parsed || !Array.isArray(parsed.stats)) {
            return res.status(500).json({ error: 'Invalid merged stats JSON format' });
        }
        res.json(parsed);
    }
    catch (error) {
        console.error('Error reading merged stats JSON:', error);
        res.status(404).json({
            error: 'Merged stats JSON not found. Call /api/analytics/sync-json first.',
        });
    }
};
exports.getMergedStats = getMergedStats;
//# sourceMappingURL=analyticsController.js.map