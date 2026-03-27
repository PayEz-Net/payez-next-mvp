import { getLoggingConfigSync, startConfigWatching, addConfigWatcher } from './logging-config';
import { LoggingConfig } from '../types/logging';
import { createVibeLogTransport } from './vibe-log-transport';

let loggingConfig: LoggingConfig = getLoggingConfigSync();
startConfigWatching();

const isEdgeRuntime = (): boolean => {
  return typeof (globalThis as any).EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
};
const isBrowser = (): boolean => typeof window !== 'undefined';

interface Logger { error: (message: string, meta?: any) => void; warn: (message: string, meta?: any) => void; info: (message: string, meta?: any) => void; http: (message: string, meta?: any) => void; debug: (message: string, meta?: any) => void; }

class EdgeLogger implements Logger {
  private logLevel: string = loggingConfig.logLevel; private levelOrder: string[] = Object.keys(loggingConfig.levels);
  private shouldLog(level: string): boolean { const currentLevelIndex = this.levelOrder.indexOf(this.logLevel); const messageLevelIndex = this.levelOrder.indexOf(level); return messageLevelIndex <= currentLevelIndex; }
  private format(level: string, message: string, meta?: any) { const timestamp = new Date().toISOString(); const metaString = meta ? ` ${JSON.stringify(meta)}` : ''; return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`; }
  error(m: string, meta?: any) { if (this.shouldLog('error')) console.error(this.format('error', m, meta)); }
  warn(m: string, meta?: any) { if (this.shouldLog('warn')) console.warn(this.format('warn', m, meta)); }
  info(m: string, meta?: any) { if (this.shouldLog('info')) console.info(this.format('info', m, meta)); }
  http(m: string, meta?: any) { if (this.shouldLog('http')) console.log(this.format('http', m, meta)); }
  debug(m: string, meta?: any) { if (this.shouldLog('debug')) console.debug(this.format('debug', m, meta)); }
}

const createLogger = (): any => {
  if (isEdgeRuntime()) return new EdgeLogger();
  if (isBrowser()) return { error: (m: string, meta?: any) => console.error(m, meta), warn: (m: string, meta?: any) => console.warn(m, meta), info: (m: string, meta?: any) => console.info(m, meta), http: (m: string, meta?: any) => console.log(m, meta), debug: (m: string, meta?: any) => console.debug(m, meta) };
  try {
    const winston = require('winston');
    const transports: any[] = [];
    if (loggingConfig.console.enabled) {
      transports.push(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }: any) => { const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''; return `[${timestamp}] ${level}: ${message}${metaString}`; })) }));
    }
    // Add Vibe log transport (sends warn/error to Redis for drain to Vibe)
    const vibeTransport = createVibeLogTransport({ minLevel: 'warn' });
    if (vibeTransport) {
      transports.push(vibeTransport);
      console.log('[LOGGER] Vibe Redis transport ENABLED - logs will buffer to Redis');
    } else {
      console.log('[LOGGER] Vibe Redis transport DISABLED - no REDIS_URL configured');
    }
    return winston.createLogger({ level: loggingConfig.logLevel, levels: loggingConfig.levels, format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()), transports, exitOnError: false });
  } catch (error) { console.warn('Failed to initialize Winston logger, falling back to EdgeLogger:', error); return new EdgeLogger(); }
};

let logger: any;
if (!(globalThis.process as any)?.browser) {
  logger = createLogger();
  addConfigWatcher((updatedConfig) => { loggingConfig = updatedConfig; if (logger && logger.level !== undefined) { logger.level = loggingConfig.logLevel; } });
} else { logger = console; }

export const log = { error: (m: string, meta?: any) => logger.error(m, meta), warn: (m: string, meta?: any) => logger.warn(m, meta), info: (m: string, meta?: any) => logger.info(m, meta), http: (m: string, meta?: any) => logger.http(m, meta), debug: (m: string, meta?: any) => logger.debug(m, meta) };
export { logger };
export const authLogger = { error: (m: string, meta?: any) => logger.error(`[AUTH] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[AUTH] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[AUTH] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[AUTH] ${m}`, meta) };
export const idpLogger = { error: (m: string, meta?: any) => logger.error(`[IDP] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[IDP] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[IDP] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[IDP] ${m}`, meta) };
export const apiLogger = { error: (m: string, meta?: any) => logger.error(`[API] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[API] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[API] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[API] ${m}`, meta) };
export const circuitBreakerLogger = { error: (m: string, meta?: any) => logger.error(`[CIRCUIT-BREAKER] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[CIRCUIT-BREAKER] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[CIRCUIT-BREAKER] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[CIRCUIT-BREAKER] ${m}`, meta) };
export const tokenLogger = { error: (m: string, meta?: any) => logger.error(`[TOKEN] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[TOKEN] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[TOKEN] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[TOKEN] ${m}`, meta) };
export const tokenSyncLogger = { error: (m: string, meta?: any) => logger.error(`[TOKEN-SYNC] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[TOKEN-SYNC] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[TOKEN-SYNC] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[TOKEN-SYNC] ${m}`, meta) };
export const tokenRefreshLogger = { error: (m: string, meta?: any) => logger.error(`[TOKEN-REFRESH] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[TOKEN-REFRESH] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[TOKEN-REFRESH] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[TOKEN-REFRESH] ${m}`, meta) };
export const redisLogger = { error: (m: string, meta?: any) => logger.error(`[REDIS] ${m}`, meta), warn: (m: string, meta?: any) => logger.warn(`[REDIS] ${m}`, meta), info: (m: string, meta?: any) => logger.info(`[REDIS] ${m}`, meta), debug: (m: string, meta?: any) => logger.debug(`[REDIS] ${m}`, meta) };
