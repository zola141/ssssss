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
exports.sendDataExportNotification = exports.sendAccountDeletionConfirmation = exports.sendDataRequestConfirmation = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
const sendDataRequestConfirmation = async (userEmail, userName) => {
    const html = `
    <h1>Data Request Received</h1>
    <p>Dear ${userName},</p>
    <p>Your request to access your personal data has been received and is being processed.</p>
    <p>You will receive your data export within 24 hours.</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;
    await (0, exports.sendEmail)({
        to: userEmail,
        subject: 'Data Request Confirmation - Transcendence',
        html,
    });
};
exports.sendDataRequestConfirmation = sendDataRequestConfirmation;
const sendAccountDeletionConfirmation = async (userEmail, userName) => {
    const html = `
    <h1>Account Deletion Confirmation</h1>
    <p>Dear ${userName},</p>
    <p>Your account and all associated data have been successfully deleted.</p>
    <p>We're sorry to see you go!</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;
    await (0, exports.sendEmail)({
        to: userEmail,
        subject: 'Account Deletion Confirmation - Transcendence',
        html,
    });
};
exports.sendAccountDeletionConfirmation = sendAccountDeletionConfirmation;
const sendDataExportNotification = async (userEmail, userName) => {
    const html = `
    <h1>Your Data Export is Ready</h1>
    <p>Dear ${userName},</p>
    <p>Your personal data export is now ready for download. It includes:</p>
    <ul>
      <li>Profile information</li>
      <li>Match history</li>
      <li>Game statistics</li>
      <li>Activity logs</li>
    </ul>
    <p>The file will be available for 30 days.</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;
    await (0, exports.sendEmail)({
        to: userEmail,
        subject: 'Your Data Export is Ready - Transcendence',
        html,
    });
};
exports.sendDataExportNotification = sendDataExportNotification;
//# sourceMappingURL=email.js.map