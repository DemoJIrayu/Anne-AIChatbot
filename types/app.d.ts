import { Application } from 'express';
declare class App {
    app: Application;
    port: number;
    constructor(port: number);
    private initializeMiddlewares;
    private initializeRoutes;
    listen(): void;
}
export default App;
//# sourceMappingURL=app.d.ts.map