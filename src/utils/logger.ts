import config from '../config';

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  [key: string]: string | number | boolean | object;
}

class Logger {
  private formatLog(level: string, message: string, meta?: Record<string, unknown>): string {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (config.logFormat === 'json') {
      return JSON.stringify(logEntry);
    } else {
      return `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message} ${meta ? JSON.stringify(meta) : ''}`;
    }
  }

  private log(level: string, message: string, meta?: Record<string, unknown>): void {
    const logLine = this.formatLog(level, message, meta);
    console.log(logLine);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (config.logLevel === 'debug') {
      this.log('debug', message, meta);
    }
  }
}

export default new Logger();