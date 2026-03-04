import { Application } from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare const app: Application;
export declare const getIO: () => SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export default app;
//# sourceMappingURL=server.d.ts.map