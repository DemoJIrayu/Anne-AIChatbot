"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const authenticate = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        logger_1.default.warn('Missing Authorization header');
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
        logger_1.default.warn('Invalid Authorization header format');
        res.status(401).json({ error: 'Invalid Authorization header format' });
        return;
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        if (process.env.NODE_ENV === 'test') {
            next();
            return;
        }
        logger_1.default.error('API_KEY not configured in environment');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    if (token !== apiKey) {
        logger_1.default.warn('Invalid API key');
        res.status(401).json({ error: 'Invalid API key' });
        return;
    }
    next();
};
exports.authenticate = authenticate;
//# sourceMappingURL=middleware.js.map