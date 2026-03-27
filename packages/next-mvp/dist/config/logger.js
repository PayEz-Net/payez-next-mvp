"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisLogger = exports.tokenRefreshLogger = exports.tokenSyncLogger = exports.tokenLogger = exports.circuitBreakerLogger = exports.apiLogger = exports.idpLogger = exports.authLogger = exports.logger = exports.log = void 0;
const logging_config_1 = require("./logging-config");
const vibe_log_transport_1 = require("./vibe-log-transport");
let loggingConfig = (0, logging_config_1.getLoggingConfigSync)();
(0, logging_config_1.startConfigWatching)();
const isEdgeRuntime = () => {
    return typeof globalThis.EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
};
const isBrowser = () => typeof window !== 'undefined';
class EdgeLogger {
    logLevel = loggingConfig.logLevel;
    levelOrder = Object.keys(loggingConfig.levels);
    shouldLog(level) { const currentLevelIndex = this.levelOrder.indexOf(this.logLevel); const messageLevelIndex = this.levelOrder.indexOf(level); return messageLevelIndex <= currentLevelIndex; }
    format(level, message, meta) { const timestamp = new Date().toISOString(); const metaString = meta ? ` ${JSON.stringify(meta)}` : ''; return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`; }
    error(m, meta) { if (this.shouldLog('error'))
        console.error(this.format('error', m, meta)); }
    warn(m, meta) { if (this.shouldLog('warn'))
        console.warn(this.format('warn', m, meta)); }
    info(m, meta) { if (this.shouldLog('info'))
        console.info(this.format('info', m, meta)); }
    http(m, meta) { if (this.shouldLog('http'))
        console.log(this.format('http', m, meta)); }
    debug(m, meta) { if (this.shouldLog('debug'))
        console.debug(this.format('debug', m, meta)); }
}
const createLogger = () => {
    if (isEdgeRuntime())
        return new EdgeLogger();
    if (isBrowser())
        return { error: (m, meta) => console.error(m, meta), warn: (m, meta) => console.warn(m, meta), info: (m, meta) => console.info(m, meta), http: (m, meta) => console.log(m, meta), debug: (m, meta) => console.debug(m, meta) };
    try {
        const winston = require('winston');
        const transports = [];
        if (loggingConfig.console.enabled) {
            transports.push(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }) => { const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''; return `[${timestamp}] ${level}: ${message}${metaString}`; })) }));
        }
        // Add Vibe log transport (sends warn/error to Redis for drain to Vibe)
        const vibeTransport = (0, vibe_log_transport_1.createVibeLogTransport)({ minLevel: 'warn' });
        if (vibeTransport) {
            transports.push(vibeTransport);
            console.log('[LOGGER] Vibe Redis transport ENABLED - logs will buffer to Redis');
        }
        else {
            console.log('[LOGGER] Vibe Redis transport DISABLED - no REDIS_URL configured');
        }
        return winston.createLogger({ level: loggingConfig.logLevel, levels: loggingConfig.levels, format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()), transports, exitOnError: false });
    }
    catch (error) {
        console.warn('Failed to initialize Winston logger, falling back to EdgeLogger:', error);
        return new EdgeLogger();
    }
};
let logger;
if (!globalThis.process?.browser) {
    exports.logger = logger = createLogger();
    (0, logging_config_1.addConfigWatcher)((updatedConfig) => { loggingConfig = updatedConfig; if (logger && logger.level !== undefined) {
        logger.level = loggingConfig.logLevel;
    } });
}
else {
    exports.logger = logger = console;
}
exports.log = { error: (m, meta) => logger.error(m, meta), warn: (m, meta) => logger.warn(m, meta), info: (m, meta) => logger.info(m, meta), http: (m, meta) => logger.http(m, meta), debug: (m, meta) => logger.debug(m, meta) };
exports.authLogger = { error: (m, meta) => logger.error(`[AUTH] ${m}`, meta), warn: (m, meta) => logger.warn(`[AUTH] ${m}`, meta), info: (m, meta) => logger.info(`[AUTH] ${m}`, meta), debug: (m, meta) => logger.debug(`[AUTH] ${m}`, meta) };
exports.idpLogger = { error: (m, meta) => logger.error(`[IDP] ${m}`, meta), warn: (m, meta) => logger.warn(`[IDP] ${m}`, meta), info: (m, meta) => logger.info(`[IDP] ${m}`, meta), debug: (m, meta) => logger.debug(`[IDP] ${m}`, meta) };
exports.apiLogger = { error: (m, meta) => logger.error(`[API] ${m}`, meta), warn: (m, meta) => logger.warn(`[API] ${m}`, meta), info: (m, meta) => logger.info(`[API] ${m}`, meta), debug: (m, meta) => logger.debug(`[API] ${m}`, meta) };
exports.circuitBreakerLogger = { error: (m, meta) => logger.error(`[CIRCUIT-BREAKER] ${m}`, meta), warn: (m, meta) => logger.warn(`[CIRCUIT-BREAKER] ${m}`, meta), info: (m, meta) => logger.info(`[CIRCUIT-BREAKER] ${m}`, meta), debug: (m, meta) => logger.debug(`[CIRCUIT-BREAKER] ${m}`, meta) };
exports.tokenLogger = { error: (m, meta) => logger.error(`[TOKEN] ${m}`, meta), warn: (m, meta) => logger.warn(`[TOKEN] ${m}`, meta), info: (m, meta) => logger.info(`[TOKEN] ${m}`, meta), debug: (m, meta) => logger.debug(`[TOKEN] ${m}`, meta) };
exports.tokenSyncLogger = { error: (m, meta) => logger.error(`[TOKEN-SYNC] ${m}`, meta), warn: (m, meta) => logger.warn(`[TOKEN-SYNC] ${m}`, meta), info: (m, meta) => logger.info(`[TOKEN-SYNC] ${m}`, meta), debug: (m, meta) => logger.debug(`[TOKEN-SYNC] ${m}`, meta) };
exports.tokenRefreshLogger = { error: (m, meta) => logger.error(`[TOKEN-REFRESH] ${m}`, meta), warn: (m, meta) => logger.warn(`[TOKEN-REFRESH] ${m}`, meta), info: (m, meta) => logger.info(`[TOKEN-REFRESH] ${m}`, meta), debug: (m, meta) => logger.debug(`[TOKEN-REFRESH] ${m}`, meta) };
exports.redisLogger = { error: (m, meta) => logger.error(`[REDIS] ${m}`, meta), warn: (m, meta) => logger.warn(`[REDIS] ${m}`, meta), info: (m, meta) => logger.info(`[REDIS] ${m}`, meta), debug: (m, meta) => logger.debug(`[REDIS] ${m}`, meta) };
