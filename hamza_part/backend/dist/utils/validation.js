"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataRequestSchema = exports.gdprDeletionSchema = exports.dataImportSchema = exports.analyticsFilterSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Validation for analytics filters
exports.analyticsFilterSchema = joi_1.default.object({
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().optional(),
    userId: joi_1.default.string().uuid().optional(),
    gameType: joi_1.default.string().optional(),
});
// Validation for data import
// Schema is intentionally permissive to allow round-trip import of exported data.
// DB-generated fields (id, winner_id, created_at) are accepted but stripped before insertion.
exports.dataImportSchema = joi_1.default.object({
    users: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid().required(),
        username: joi_1.default.string().required(),
        email: joi_1.default.string().email().required(),
        profile_picture: joi_1.default.string().allow(null, '').optional(),
        bio: joi_1.default.string().allow(null, '').optional(),
    }).options({ allowUnknown: true, stripUnknown: true })).optional(),
    matches: joi_1.default.array().items(joi_1.default.object({
        player1_id: joi_1.default.string().uuid().required(),
        player2_id: joi_1.default.string().uuid().required(),
        player3_id: joi_1.default.alternatives().try(joi_1.default.string().uuid(), joi_1.default.valid(null, '')).optional().default(null),
        player4_id: joi_1.default.alternatives().try(joi_1.default.string().uuid(), joi_1.default.valid(null, '')).optional().default(null),
        score1: joi_1.default.number().required(),
        score2: joi_1.default.number().required(),
        score3: joi_1.default.number().optional().allow(null).default(null),
        score4: joi_1.default.number().optional().allow(null).default(null),
        player_count: joi_1.default.number().valid(2, 3, 4).optional(),
        duration: joi_1.default.number().required(),
    }).options({ allowUnknown: true, stripUnknown: true })).optional(),
    userStats: joi_1.default.array().items(joi_1.default.object({
        user_id: joi_1.default.string().uuid().required(),
        total_wins: joi_1.default.number().required(),
        total_losses: joi_1.default.number().required(),
        level: joi_1.default.number().required(),
        xp: joi_1.default.number().required(),
    }).options({ allowUnknown: true, stripUnknown: true })).optional(),
    userActivity: joi_1.default.array().items(joi_1.default.object({
        user_id: joi_1.default.string().uuid().required(),
        action: joi_1.default.string().required(),
        timestamp: joi_1.default.date().required(),
    }).options({ allowUnknown: true, stripUnknown: true })).optional(),
}).options({ allowUnknown: true, stripUnknown: true });
// Validation for GDPR data deletion
exports.gdprDeletionSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
    confirmationCode: joi_1.default.string().required(),
});
// Validation for data request
exports.dataRequestSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
});
//# sourceMappingURL=validation.js.map