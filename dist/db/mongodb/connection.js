"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../utils/logger"));
class MongoConnection {
    constructor() {
        this.connection = null;
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is required');
        }
    }
    static getInstance() {
        if (!MongoConnection.instance) {
            MongoConnection.instance = new MongoConnection();
        }
        return MongoConnection.instance;
    }
    async connect() {
        try {
            mongoose_1.default.set('debug', process.env.NODE_ENV === 'development');
            await mongoose_1.default.connect(process.env.MONGODB_URI);
            this.connection = mongoose_1.default.connection;
            this.connection.on('connected', () => {
                logger_1.default.info('Connected to MongoDB database');
            });
            this.connection.on('error', (err) => {
                logger_1.default.error('MongoDB connection error:', err);
            });
            this.connection.on('disconnected', () => {
                logger_1.default.info('Disconnected from MongoDB database');
            });
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to connect to MongoDB database:', error);
            throw error;
        }
    }
    getConnection() {
        return this.connection;
    }
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose_1.default.disconnect();
                logger_1.default.info('Disconnected from MongoDB database');
            }
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from MongoDB database:', error);
            throw error;
        }
    }
}
exports.default = MongoConnection;
//# sourceMappingURL=connection.js.map