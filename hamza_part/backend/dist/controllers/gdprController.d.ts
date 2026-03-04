import { Request, Response } from 'express';
export declare const requestUserData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadUserData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requestAccountDeletion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const confirmAccountDeletion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listDataRequests: (req: Request, res: Response) => Promise<void>;
export declare const getAccountDeletionStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=gdprController.d.ts.map