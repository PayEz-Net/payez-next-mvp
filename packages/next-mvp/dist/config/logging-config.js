"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeConfigWatcher = exports.addConfigWatcher = exports.stopConfigWatching = exports.startConfigWatching = exports.getLoggingConfigSync = exports.getLoggingConfig = exports.loggingConfigManager = void 0;
const fs_1 = require("fs");
const fs_2 = require("fs");
const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
class LoggingConfigManager {
    config = null;
    configPath;
    watchers = new Set();
    fileWatcher = null;
    isEdgeRuntime;
    isBrowser;
    constructor() {
        this.isBrowser = typeof window !== 'undefined';
        this.isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
        if (this.isEdgeRuntime || this.isBrowser) {
            this.configPath = '/config/logging.json';
            this.config = this.getDefaultConfig();
        }
        else {
            const cwd = process.cwd().replace(/\\/g, '/');
            this.configPath = cwd + '/config/logging.json';
        }
    }
    async loadConfig() {
        if (this.isEdgeRuntime || this.isBrowser) {
            if (!this.config) {
                this.config = this.getDefaultConfig();
            }
            return this.config;
        }
        try {
            const configContent = await fs_1.promises.readFile(this.configPath, 'utf-8');
            const rawConfig = JSON.parse(configContent);
            const config = this.validateAndMergeConfig(rawConfig);
            this.config = config;
            this.notifyWatchers(config);
            return config;
        }
        catch (error) {
            console.warn(`Failed to load logging config from ${this.configPath}:`, error);
            return this.getDefaultConfig();
        }
    }
    async getConfig() { if (!this.config) {
        return await this.loadConfig();
    } return this.config; }
    getConfigSync() { return this.config || this.getDefaultConfig(); }
    startWatching() { if (this.isEdgeRuntime || this.isBrowser) {
        return;
    } if (this.fileWatcher) {
        return;
    } try {
        if (!(0, fs_2.existsSync)(this.configPath)) {
            console.warn(`Logging config file not found at ${this.configPath} — watch disabled`);
            return;
        }
        this.fileWatcher = (0, fs_2.watch)(this.configPath, { persistent: false }, (eventType) => { if (eventType === 'change') {
            this.loadConfig().catch(console.error);
        } });
    }
    catch (error) {
        console.warn('Failed to start watching logging config file:', error);
    } }
    stopWatching() { if (this.isEdgeRuntime || this.isBrowser) {
        return;
    } if (this.fileWatcher) {
        this.fileWatcher.close();
        this.fileWatcher = null;
    } }
    addWatcher(callback) { this.watchers.add(callback); }
    removeWatcher(callback) { this.watchers.delete(callback); }
    notifyWatchers(config) { this.watchers.forEach(cb => { try {
        cb(config);
    }
    catch (error) {
        console.error('Error in logging config watcher:', error);
    } }); }
    validateAndMergeConfig(rawConfig) {
        const defaults = this.getDefaultConfig();
        const config = {
            logLevel: this.validateLogLevel(rawConfig.logLevel) || this.validateLogLevel(process.env.LOG_LEVEL) || defaults.logLevel,
            console: { enabled: rawConfig.console?.enabled ?? (process.env.LOG_CONSOLE === 'true' || process.env.NODE_ENV === 'development'), colors: rawConfig.console?.colors ?? defaults.console.colors },
            graylog: { enabled: false, host: defaults.graylog.host, port: defaults.graylog.port, facility: defaults.graylog.facility, staticMeta: { ...defaults.graylog.staticMeta } },
            components: { ...defaults.components, ...rawConfig.components },
            levels: { ...defaults.levels, ...rawConfig.levels }
        };
        return config;
    }
    validateLogLevel(level) { const validLevels = ['error', 'warn', 'info', 'http', 'debug']; return validLevels.includes(level) ? level : null; }
    getHostname() { if (this.isEdgeRuntime)
        return 'edge-runtime'; if (this.isBrowser)
        return 'browser-client'; try {
        return require('os').hostname();
    }
    catch {
        return 'unknown';
    } }
    getDefaultConfig() {
        return {
            logLevel: 'info',
            console: { enabled: process.env.NODE_ENV === 'development', colors: true },
            graylog: { enabled: false, host: '127.0.0.1', port: 12201, facility: 'next-mvp', staticMeta: { service: 'next-mvp', application: 'next-mvp', version: '1.0.0', environment: process.env.NODE_ENV || 'development', hostname: this.getHostname(), instance: process.env.NEXT_INSTANCE_ID || 'unknown' } },
            components: { auth: { enabled: true, prefix: '[AUTH]' }, idp: { enabled: true, prefix: '[IDP]' }, api: { enabled: true, prefix: '[API]' }, circuitBreaker: { enabled: true, prefix: '[CIRCUIT-BREAKER]' }, token: { enabled: true, prefix: '[TOKEN]' }, tokenSync: { enabled: true, prefix: '[TOKEN-SYNC]' }, tokenRefresh: { enabled: true, prefix: '[TOKEN-REFRESH]' }, redis: { enabled: true, prefix: '[REDIS]' } },
            levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 }
        };
    }
}
exports.loggingConfigManager = new LoggingConfigManager();
const getLoggingConfig = () => exports.loggingConfigManager.getConfig();
exports.getLoggingConfig = getLoggingConfig;
const getLoggingConfigSync = () => exports.loggingConfigManager.getConfigSync();
exports.getLoggingConfigSync = getLoggingConfigSync;
const startConfigWatching = () => exports.loggingConfigManager.startWatching();
exports.startConfigWatching = startConfigWatching;
const stopConfigWatching = () => exports.loggingConfigManager.stopWatching();
exports.stopConfigWatching = stopConfigWatching;
const addConfigWatcher = (callback) => exports.loggingConfigManager.addWatcher(callback);
exports.addConfigWatcher = addConfigWatcher;
const removeConfigWatcher = (callback) => exports.loggingConfigManager.removeWatcher(callback);
exports.removeConfigWatcher = removeConfigWatcher;
