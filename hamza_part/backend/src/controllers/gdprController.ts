import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { query } from '../models/database';
import {
  sendDataRequestConfirmation,
  sendAccountDeletionConfirmation,
  sendDataExportNotification,
} from '../utils/email';
import { exportToJSON, saveExportToFile } from '../utils/dataExport';
import * as fs from 'fs';

// Store pending deletion requests temporarily
const pendingDeletions: Map<
  string,
  {
    userId: string;
    token: string;
    expiresAt: Date;
  }
> = new Map();

// Store pending data requests temporarily
const pendingDataRequests: Map<
  string,
  {
    userId: string;
    token: string;
    expiresAt: Date;
  }
> = new Map();

export const requestUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Fetch user info
    const userResult = await query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );

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
      await sendDataRequestConfirmation(user.email, user.username);
    } catch (emailErr) {
      console.error('Email send failed (SMTP may not be configured):', emailErr);
    }

    res.json({
      success: true,
      message: 'Data request received. Check your email for confirmation.',
      token,
    });
  } catch (error) {
    console.error('Error requesting data:', error);
    res.status(500).json({ error: 'Failed to process data request' });
  }
};

export const downloadUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Fetch all user data
    const userResult = await query(
      'SELECT id, email, username, profile_picture, bio, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch matches
    const matchesResult = await query(
      `SELECT * FROM matches 
       WHERE player1_id = $1 OR player2_id = $1 OR player3_id = $1 OR player4_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch stats
    const statsResult = await query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );

    // Fetch activity
    const activityResult = await query(
      'SELECT * FROM user_activity WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );

    const exportData = {
      userProfile: user,
      matches: matchesResult.rows,
      userStats: statsResult.rows,
      userActivity: activityResult.rows,
      exportDate: new Date(),
      gdprCompliant: true,
    };

    const content = exportToJSON(exportData);
    const fileName = `user-data-${userId}`;

    const filePath = saveExportToFile(content, 'json', fileName);

    res.download(filePath, `user-gdpr-data-${Date.now()}.json`, (err) => {
      if (err) console.error('Error downloading file:', err);
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 1000);
    });

    // Send notification email (non-blocking)
    try {
      await sendDataExportNotification(user.email, user.username);
    } catch (emailErr) {
      console.error('Email send failed (SMTP may not be configured):', emailErr);
    }
  } catch (error) {
    console.error('Error downloading user data:', error);
    res.status(500).json({ error: 'Failed to download user data' });
  }
};

export const requestAccountDeletion = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Fetch user info
    const userResult = await query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );

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
      message:
        'Account deletion request received. Confirm deletion with the token sent to your email.',
      token,
      confirmationUrl: `/api/gdpr/confirm-deletion/${token}`,
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
};

export const confirmAccountDeletion = async (req: Request, res: Response) => {
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
    const userResult = await query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Delete user data in correct order (foreign keys)
    await query('DELETE FROM user_activity WHERE user_id = $1', [userId]);
    await query('DELETE FROM matches WHERE player1_id = $1 OR player2_id = $1 OR player3_id = $1 OR player4_id = $1', [
      userId,
    ]);
    await query('DELETE FROM user_stats WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Remove token
    pendingDeletions.delete(token);

    // Send confirmation email (non-blocking)
    try {
      await sendAccountDeletionConfirmation(user.email, user.username);
    } catch (emailErr) {
      console.error('Email send failed (SMTP may not be configured):', emailErr);
    }

    res.json({
      success: true,
      message: 'Account and all associated data have been deleted.',
    });
  } catch (error) {
    console.error('Error confirming account deletion:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

export const listDataRequests = async (req: Request, res: Response) => {
  try {
    const requests = Array.from(pendingDataRequests.entries()).map(
      ([token, data]) => ({
        token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      })
    );

    res.json({
      pendingRequests: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error listing data requests:', error);
    res.status(500).json({ error: 'Failed to list data requests' });
  }
};

export const getAccountDeletionStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Check if there's a pending deletion request
    const pendingRequest = Array.from(pendingDeletions.values()).find(
      (req) => req.userId === userId
    );

    res.json({
      hasPendingDeletion: !!pendingRequest,
      expiresAt: pendingRequest?.expiresAt || null,
    });
  } catch (error) {
    console.error('Error getting deletion status:', error);
    res.status(500).json({ error: 'Failed to get deletion status' });
  }
};
