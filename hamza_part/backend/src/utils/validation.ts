import Joi from 'joi';

// Validation for analytics filters
export const analyticsFilterSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  userId: Joi.string().uuid().optional(),
  gameType: Joi.string().optional(),
});

// Validation for data import
// Schema is intentionally permissive to allow round-trip import of exported data.
// DB-generated fields (id, winner_id, created_at) are accepted but stripped before insertion.
export const dataImportSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      profile_picture: Joi.string().allow(null, '').optional(),
      bio: Joi.string().allow(null, '').optional(),
    }).options({ allowUnknown: true, stripUnknown: true })
  ).optional(),
  matches: Joi.array().items(
    Joi.object({
      player1_id: Joi.string().uuid().required(),
      player2_id: Joi.string().uuid().required(),
      player3_id: Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.valid(null, '')
      ).optional().default(null),
      player4_id: Joi.alternatives().try(
        Joi.string().uuid(),
        Joi.valid(null, '')
      ).optional().default(null),
      score1: Joi.number().required(),
      score2: Joi.number().required(),
      score3: Joi.number().optional().allow(null).default(null),
      score4: Joi.number().optional().allow(null).default(null),
      player_count: Joi.number().valid(2, 3, 4).optional(),
      duration: Joi.number().required(),
    }).options({ allowUnknown: true, stripUnknown: true })
  ).optional(),
  userStats: Joi.array().items(
    Joi.object({
      user_id: Joi.string().uuid().required(),
      total_wins: Joi.number().required(),
      total_losses: Joi.number().required(),
      level: Joi.number().required(),
      xp: Joi.number().required(),
    }).options({ allowUnknown: true, stripUnknown: true })
  ).optional(),
  userActivity: Joi.array().items(
    Joi.object({
      user_id: Joi.string().uuid().required(),
      action: Joi.string().required(),
      timestamp: Joi.date().required(),
    }).options({ allowUnknown: true, stripUnknown: true })
  ).optional(),
}).options({ allowUnknown: true, stripUnknown: true });

// Validation for GDPR data deletion
export const gdprDeletionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  confirmationCode: Joi.string().required(),
});

// Validation for data request
export const dataRequestSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});
