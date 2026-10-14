"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./utils/logger"));
const facebook_1 = require("./integrations/facebook");
const line_1 = require("./integrations/line");
const api_1 = __importDefault(require("./api"));
const client_1 = require("@prisma/client");
class App {
    constructor(port) {
        this.app = (0, express_1.default)();
        this.port = port;
        this.prisma = new client_1.PrismaClient();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeIntegrations();
    }
    initializeMiddlewares() {
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            logger_1.default.info('Incoming request', {
                method: req.method,
                url: req.url,
                ip: req.ip
            });
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        this.app.use('/api', api_1.default);
        this.app.get('/webhook/facebook', facebook_1.verifyWebhook);
        this.app.post('/webhook/facebook', facebook_1.handleWebhook);
        this.app.post('/webhook/line', line_1.verifySignature, line_1.handleWebhook);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                status: 'error',
                message: 'Route not found'
            });
        });
    }
    initializeIntegrations() {
        (0, facebook_1.initializeFacebookIntegration)(this.prisma);
        (0, line_1.initializeLineIntegration)(this.prisma);
    }
    async listen() {
        try {
            await this.prisma.$connect();
            logger_1.default.info('Connected to PostgreSQL database');
            this.app.listen(this.port, () => {
                logger_1.default.info(`Server started on port ${this.port}`, {
                    port: this.port,
                    environment: process.env.NODE_ENV
                });
            });
        }
        catch (error) {
            logger_1.default.error('Failed to start server', { error: error.message || error });
            process.exit(1);
        }
    }
    async close() {
        await this.prisma.$disconnect();
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map