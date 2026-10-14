import { Application } from 'express';
declare class App {
    app: Application;
    port: number;
    private prisma;
    constructor(port: number);
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeIntegrations;
    listen(): Promise<void>;
    close(): Promise<void>;
}
export default App;
//# sourceMappingURL=app.d.ts.map