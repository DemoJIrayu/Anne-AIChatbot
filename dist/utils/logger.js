"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
class Logger {
    formatLog(level, message, meta) {
        const logEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...meta,
        };
        if (config_1.default.logFormat === 'json') {
            return JSON.stringify(logEntry);
        }
        else {
            return `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message} ${meta ? JSON.stringify(meta) : ''}`;
        }
    }
    log(level, message, meta) {
        const logLine = this.formatLog(level, message, meta);
        console.log(logLine);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    debug(message, meta) {
        if (config_1.default.logLevel === 'debug') {
            this.log('debug', message, meta);
        }
    }
}
exports.default = new Logger();
//# sourceMappingURL=logger.js.map