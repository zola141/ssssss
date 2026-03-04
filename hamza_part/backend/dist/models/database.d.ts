import { Pool, QueryResult } from 'pg';
declare const pool: Pool;
export declare const query: (text: string, params?: any[]) => Promise<QueryResult>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export default pool;
//# sourceMappingURL=database.d.ts.map