import { Request, Response } from 'express';
export declare const exportAllData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const exportMatchesData: (req: Request, res: Response) => Promise<void>;
export declare const importData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateImportFile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=dataExportController.d.ts.map