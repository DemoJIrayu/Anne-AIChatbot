declare class Logger {
    private formatLog;
    private log;
    info(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
}
declare const _default: Logger;
export default _default;
//# sourceMappingURL=logger.d.ts.map