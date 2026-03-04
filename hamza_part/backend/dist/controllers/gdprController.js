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
exports.getAccountDeletionStatus = exports.listDataRequests = exports.confirmAccountDeletion = exports.requestAccountDeletion = exports.downloadUserData = exports.requestUserData = void 0;
const crypto = __importStar(require("crypto"));
const database_1 = require("../models/database");
const email_1 = require("../utils/email");
const dataExport_1 = require("../utils/dataExport");
const fs = __importStar(require("fs"));
// Store pending deletion requests temporarily
const pendingDeletions = new Map();
// Store pending data requests temporarily
const pendingDataRequests = new Map();
const requestUserData = async (req, res) => {
    try {
        const { userId } = req.body;
        // Fetch user info
        const userResult = await (0, database_1.query)('SELECT id, email, username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Generate confirmation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Store request
        pendingDataRequests.set(token, { userId, token, expiresAt });
        // Send confirmation email (non-blocking — don't fail if SMTP isn't configured)
        try {
            await (0, email_1.sendDataRequestConfirmation)(user.email, user.username);
        }
        catch (emailErr) {
            console.error('Email send failed (SMTP may not be configured):', emailErr);
        }
        res.json({
            success: true,
            message: 'Data request received. Check your email for confirmation.',
            token,
        });
    }
    catch (error) {
        console.error('Error requesting data:', error);
        res.status(500).json({ error: 'Failed to process data request' });
    }
};
exports.requestUserData = requestUserData;
const downloadUserData = async (req, res) => {
    try {
        const { userId } = req.query;
        // Fetch all user data
        const userResult = await (0, database_1.query)('SELECT id, email, username, profile_picture, bio, created_at FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Fetch matches
        const matchesResult = await (0, database_1.query)(`SELECT * FROM matches 
       WHERE player1_id = $1 OR player2_id = $1 OR player3_id = $1 OR player4_id = $1
       ORDER BY created_at DESC`, [userId]);
        // Fetch stats
        const statsResult = await (0, database_1.query)('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
        // Fetch activity
        const activityResult = await (0, database_1.query)('SELECT * FROM user_activity WHERE user_id = $1 ORDER BY timestamp DESC', [userId]);
        const exportData = {
            userProfile: user,
            matches: matchesResult.rows,
            userStats: statsResult.rows,
            userActivity: activityResult.rows,
            exportDate: new Date(),
            gdprCompliant: true,
        };
        const content = (0, dataExport_1.exportToJSON)(exportData);
        const fileName = `user-data-${userId}`;
        const filePath = (0, dataExport_1.saveExportToFile)(content, 'json', fileName);
        res.download(filePath, `user-gdpr-data-${Date.now()}.json`, (err) => {
            if (err)
                console.error('Error downloading file:', err);
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }, 1000);
        });
        // Send notification email (non-blocking)
        try {
            await (0, email_1.sendDataExportNotification)(user.email, user.username);
        }
        catch (emailErr) {
            console.error('Email send failed (SMTP may not be configured):', emailErr);
        }
    }
    catch (error) {
        console.error('Error downloading user data:', error);
        res.status(500).json({ error: 'Failed to download user data' });
    }
};
exports.downloadUserData = downloadUserData;
const requestAccountDeletion = async (req, res) => {
    try {
        const { userId } = req.body;
        // Fetch user info
        const userResult = await (0, database_1.query)('SELECT id, email, username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Generate confirmation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Store request
        pendingDeletions.set(token, { userId, token, expiresAt });
        res.json({
            success: true,
            message: 'Account deletion request received. Confirm deletion with the token sent to your email.',
            token,
            confirmationUrl: `/api/gdpr/confirm-deletion/${token}`,
        });
    }
    catch (error) {
        console.error('Error requesting account deletion:', error);
        res.status(500).json({ error: 'Failed to process deletion request' });
    }
};
exports.requestAccountDeletion = requestAccountDeletion;
const confirmAccountDeletion = async (req, res) => {
    try {
        const { token } = req.params;
        // Verify token
        const deletionRequest = pendingDeletions.get(token);
        if (!deletionRequest) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        if (deletionRequest.expiresAt < new Date()) {
            pendingDeletions.delete(token);
            return res.status(400).json({ error: 'Token has expired' });
        }
        const userId = deletionRequest.userId;
        // Fetch user info before deletion
        const userResult = await (0, database_1.query)('SELECT id, email, username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Delete user data in correct order (foreign keys)
        await (0, database_1.query)('DELETE FROM user_activity WHERE user_id = $1', [userId]);
        await (0, database_1.query)('DELETE FROM matches WHERE player1_id = $1 OR player2_id = $1 OR player3_id = $1 OR player4_id = $1', [
            userId,
        ]);
        await (0, database_1.query)('DELETE FROM user_stats WHERE user_id = $1', [userId]);
        await (0, database_1.query)('DELETE FROM users WHERE id = $1', [userId]);
        // Remove token
        pendingDeletions.delete(token);
        // Send confirmation email (non-blocking)
        try {
            await (0, email_1.sendAccountDeletionConfirmation)(user.email, user.username);
        }
        catch (emailErr) {
            console.error('Email send failed (SMTP may not be configured):', emailErr);
        }
        res.json({
            success: true,
            message: 'Account and all associated data have been deleted.',
        });
    }
    catch (error) {
        console.error('Error confirming account deletion:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};
exports.confirmAccountDeletion = confirmAccountDeletion;
const listDataRequests = async (req, res) => {
    try {
        const requests = Array.from(pendingDataRequests.entries()).map(([token, data]) => ({
            token,
            userId: data.userId,
            expiresAt: data.expiresAt,
        }));
        res.json({
            pendingRequests: requests.length,
            requests,
        });
    }
    catch (error) {
        console.error('Error listing data requests:', error);
        res.status(500).json({ error: 'Failed to list data requests' });
    }
};
exports.listDataRequests = listDataRequests;
const getAccountDeletionStatus = async (req, res) => {
    try {
        const { userId } = req.query;
        // Check if there's a pending deletion request
        const pendingRequest = Array.from(pendingDeletions.values()).find((req) => req.userId === userId);
        res.json({
            hasPendingDeletion: !!pendingRequest,
            expiresAt: pendingRequest?.expiresAt || null,
        });
    }
    catch (error) {
        console.error('Error getting deletion status:', error);
        res.status(500).json({ error: 'Failed to get deletion status' });
    }
};
exports.getAccountDeletionStatus = getAccountDeletionStatus;
//# sourceMappingURL=gdprController.js.map