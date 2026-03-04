export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendEmail: (options: EmailOptions) => Promise<void>;
export declare const sendDataRequestConfirmation: (userEmail: string, userName: string) => Promise<void>;
export declare const sendAccountDeletionConfirmation: (userEmail: string, userName: string) => Promise<void>;
export declare const sendDataExportNotification: (userEmail: string, userName: string) => Promise<void>;
//# sourceMappingURL=email.d.ts.map