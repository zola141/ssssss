import { Request, Response } from 'express';
export declare const getMatchHistory: (req: Request, res: Response) => Promise<void>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
export declare const getUserActivity: (req: Request, res: Response) => Promise<void>;
export declare const getStatsSummary: (req: Request, res: Response) => Promise<void>;
export declare const getUserRankings: (req: Request, res: Response) => Promise<void>;
export declare const getActivityTrends: (req: Request, res: Response) => Promise<void>;
export declare const exportAnalytics: (req: Request, res: Response) => Promise<void>;
export declare const recordMatch: (req: Request, res: Response) => Promise<void>;
export declare const getPositionWinRates: (req: Request, res: Response) => Promise<void>;
export declare const syncMergedStatsJson: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMergedStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=analyticsController.d.ts.map