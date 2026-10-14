"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnection = exports.MongoConnection = exports.PostgresConnection = exports.lockRepository = exports.cacheRepository = exports.facebookMessageRepository = exports.lineMessageRepository = exports.knowledgeSourceRepository = exports.settingRepository = exports.shopRepository = exports.businessOwnerRepository = void 0;
exports.initializeDatabaseConnections = initializeDatabaseConnections;
exports.closeDatabaseConnections = closeDatabaseConnections;
const connection_1 = __importDefault(require("./postgres/connection"));
exports.PostgresConnection = connection_1.default;
const connection_2 = __importDefault(require("./mongodb/connection"));
exports.MongoConnection = connection_2.default;
const connection_3 = __importDefault(require("./redis/connection"));
exports.RedisConnection = connection_3.default;
const repositories_1 = require("./postgres/repositories");
Object.defineProperty(exports, "businessOwnerRepository", { enumerable: true, get: function () { return repositories_1.businessOwnerRepository; } });
Object.defineProperty(exports, "shopRepository", { enumerable: true, get: function () { return repositories_1.shopRepository; } });
Object.defineProperty(exports, "settingRepository", { enumerable: true, get: function () { return repositories_1.settingRepository; } });
Object.defineProperty(exports, "knowledgeSourceRepository", { enumerable: true, get: function () { return repositories_1.knowledgeSourceRepository; } });
const repositories_2 = require("./mongodb/repositories");
Object.defineProperty(exports, "lineMessageRepository", { enumerable: true, get: function () { return repositories_2.lineMessageRepository; } });
Object.defineProperty(exports, "facebookMessageRepository", { enumerable: true, get: function () { return repositories_2.facebookMessageRepository; } });
const repositories_3 = require("./redis/repositories");
Object.defineProperty(exports, "cacheRepository", { enumerable: true, get: function () { return repositories_3.cacheRepository; } });
Object.defineProperty(exports, "lockRepository", { enumerable: true, get: function () { return repositories_3.lockRepository; } });
async function initializeDatabaseConnections() {
    try {
        await connection_1.default.getInstance().connect();
        await connection_2.default.getInstance().connect();
        await connection_3.default.getInstance().connect();
        console.log('All database connections initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database connections:', error);
        throw error;
    }
}
async function closeDatabaseConnections() {
    try {
        await connection_1.default.getInstance().disconnect();
        await connection_2.default.getInstance().disconnect();
        await connection_3.default.getInstance().disconnect();
        console.log('All database connections closed successfully');
    }
    catch (error) {
        console.error('Error closing database connections:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map