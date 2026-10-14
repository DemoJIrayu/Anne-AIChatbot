"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../../utils/logger"));
class PostgresConnection {
    constructor() {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!PostgresConnection.instance) {
            PostgresConnection.instance = new PostgresConnection();
        }
        return PostgresConnection.instance;
    }
    getClient() {
        return this.prisma;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.default.info('Connected to PostgreSQL database');
        }
        catch (error) {
            logger_1.default.error('Failed to connect to PostgreSQL database', { error: error.message || error });
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.default.info('Disconnected from PostgreSQL database');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from PostgreSQL database', { error: error.message || error });
            throw error;
        }
    }
}
exports.default = PostgresConnection;
//# sourceMappingURL=connection.js.map