import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { query } from '../models/database';
import {
  exportToJSON,
  exportToCSV,
  exportToXML,
  saveExportToFile,
  parseImportFile,
} from '../utils/dataExport';
import { dataImportSchema } from '../utils/validation';

export const exportAllData = async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.query;
    const validFormats = ['json', 'csv', 'xml'];

    if (!validFormats.includes(format as string)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    // Fetch all data
    const matchesResult = await query('SELECT * FROM matches');
    const statsResult = await query('SELECT * FROM user_stats');
    const activityResult = await query('SELECT * FROM user_activity');

    const exportData = {
      matches: matchesResult.rows,
      userStats: statsResult.rows,
      userActivity: activityResult.rows,
    };

    let content: string;
    const fileName = `transcendence-export-${Date.now()}`;

    if (format === 'json') {
      content = exportToJSON(exportData);
    } else if (format === 'csv') {
      content = exportToCSV(exportData, 'matches');
    } else {
      content = exportToXML(exportData);
    }

    const contentType =
      format === 'json'
        ? 'application/json'
        : format === 'csv'
          ? 'text/csv'
          : 'application/xml';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}.${format}"`
    );
    res.send(content);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

export const exportMatchesData = async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.query;

    const result = await query('SELECT * FROM matches ORDER BY created_at DESC');
    const exportData = { matches: result.rows };

    let content: string;
    const fileName = `matches-export-${Date.now()}`;

    if (format === 'json') {
      content = exportToJSON(exportData);
    } else if (format === 'csv') {
      content = exportToCSV(exportData, 'matches');
    } else {
      content = exportToXML(exportData);
    }

    const contentType =
      format === 'json'
        ? 'application/json'
        : format === 'csv'
          ? 'text/csv'
          : 'application/xml';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}.${format}"`
    );
    res.send(content);
  } catch (error) {
    console.error('Error exporting matches:', error);
    res.status(500).json({ error: 'Failed to export matches' });
  }
};

export const importData = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
    const validFormats = ['json', 'csv', 'xml'];

    if (!validFormats.includes(fileExt)) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const importedData = await parseImportFile(req.file.path, fileExt as any);

    // Validate data
    const { error, value } = dataImportSchema.validate(importedData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let insertedRecords = 0;

    // Insert users first (to satisfy foreign keys)
    if (value.users && value.users.length > 0) {
      for (const user of value.users) {
        await query(
          `INSERT INTO users (id, username, email, profile_picture, bio)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.username, user.email, user.profile_picture, user.bio]
        );
        insertedRecords++;
      }
    }

    // Insert matches
    if (value.matches && value.matches.length > 0) {
      for (const match of value.matches) {
        // Determine player count
        let playerCount = 2;
        if (match.player3_id) playerCount = 3;
        if (match.player4_id) playerCount = 4;

        await query(
          `INSERT INTO matches (player1_id, player2_id, player3_id, player4_id, score1, score2, score3, score4, player_count, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            match.player1_id, match.player2_id,
            match.player3_id || null, match.player4_id || null,
            match.score1, match.score2,
            match.score3 ?? null, match.score4 ?? null,
            playerCount, match.duration,
          ]
        );
        insertedRecords++;
      }
    }

    // Insert user stats
    if (value.userStats && value.userStats.length > 0) {
      for (const stat of value.userStats) {
        await query(
          `INSERT INTO user_stats (user_id, total_wins, total_losses, level, xp)
           VALUES ($1, $2, $3, $4, $5)`,
          [stat.user_id, stat.total_wins, stat.total_losses, stat.level, stat.xp]
        );
        insertedRecords++;
      }
    }

    // Insert user activity
    if (value.userActivity && value.userActivity.length > 0) {
      for (const activity of value.userActivity) {
        await query(
          `INSERT INTO user_activity (user_id, action, timestamp)
           VALUES ($1, $2, $3)`,
          [activity.user_id, activity.action, activity.timestamp]
        );
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
  } catch (error) {
    console.error('Error importing data:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import data' });
  }
};

export const validateImportFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);
    const importedData = await parseImportFile(req.file.path, fileExt as any);

    const { error, value } = dataImportSchema.validate(importedData);

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
  } catch (error) {
    console.error('Error validating file:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to validate file' });
  }
};
