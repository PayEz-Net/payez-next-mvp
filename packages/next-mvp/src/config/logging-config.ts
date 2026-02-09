import { promises as fs } from 'fs';
import { watch, existsSync } from 'fs';
import { LoggingConfig, LogLevel } from '../types/logging';

const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';

class LoggingConfigManager {
  private config: LoggingConfig | null = null;
  private configPath: string;
  private watchers: Set<(config: LoggingConfig) => void> = new Set();
  private fileWatcher: ReturnType<typeof watch> | null = null;
  private isEdgeRuntime: boolean;
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';
    if (this.isEdgeRuntime || this.isBrowser) {
      this.configPath = '/config/logging.json';
      this.config = this.getDefaultConfig();
    } else {
      const cwd = process.cwd().replace(/\\/g, '/');
      this.configPath = cwd + '/config/logging.json';
    }
  }

  async loadConfig(): Promise<LoggingConfig> {
    if (this.isEdgeRuntime || this.isBrowser) {
      if (!this.config) { this.config = this.getDefaultConfig(); }
      return this.config;
    }
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const rawConfig = JSON.parse(configContent);
      const config = this.validateAndMergeConfig(rawConfig);
      this.config = config; this.notifyWatchers(config); return config;
    } catch (error) {
      console.warn(`Failed to load logging config from ${this.configPath}:`, error);
      return this.getDefaultConfig();
    }
  }

  async getConfig(): Promise<LoggingConfig> { if (!this.config) { return await this.loadConfig(); } return this.config; }
  getConfigSync(): LoggingConfig { return this.config || this.getDefaultConfig(); }

  startWatching(): void { if (this.isEdgeRuntime || this.isBrowser) { return; } if (this.fileWatcher) { return; } try { if (!existsSync(this.configPath)) { console.warn(`Logging config file not found at ${this.configPath} — watch disabled`); return; } this.fileWatcher = watch(this.configPath, { persistent: false }, (eventType) => { if (eventType === 'change') { this.loadConfig().catch(console.error); } }); } catch (error) { console.warn('Failed to start watching logging config file:', error); } }
  stopWatching(): void { if (this.isEdgeRuntime || this.isBrowser) { return; } if (this.fileWatcher) { this.fileWatcher.close(); this.fileWatcher = null; } }
  addWatcher(callback: (config: LoggingConfig) => void): void { this.watchers.add(callback); }
  removeWatcher(callback: (config: LoggingConfig) => void): void { this.watchers.delete(callback); }
  private notifyWatchers(config: LoggingConfig): void { this.watchers.forEach(cb => { try { cb(config); } catch (error) { console.error('Error in logging config watcher:', error); } }); }

  private validateAndMergeConfig(rawConfig: any): LoggingConfig {
    const defaults = this.getDefaultConfig();
    const config: LoggingConfig = {
      logLevel: this.validateLogLevel(rawConfig.logLevel) || this.validateLogLevel(process.env.LOG_LEVEL) || defaults.logLevel,
      console: { enabled: rawConfig.console?.enabled ?? (process.env.LOG_CONSOLE === 'true' || process.env.NODE_ENV === 'development'), colors: rawConfig.console?.colors ?? defaults.console.colors },
      graylog: { enabled: false, host: defaults.graylog.host, port: defaults.graylog.port, facility: defaults.graylog.facility, staticMeta: { ...defaults.graylog.staticMeta } },
      components: { ...defaults.components, ...rawConfig.components },
      levels: { ...defaults.levels, ...rawConfig.levels }
    };
    return config;
  }
  private validateLogLevel(level: any): LogLevel | null { const validLevels: LogLevel[] = ['error', 'warn', 'info', 'http', 'debug']; return validLevels.includes(level) ? level : null; }
  private getHostname(): string { if (this.isEdgeRuntime) return 'edge-runtime'; if (this.isBrowser) return 'browser-client'; try { return require('os').hostname(); } catch { return 'unknown'; } }
  private getDefaultConfig(): LoggingConfig {
    return {
      logLevel: 'info',
      console: { enabled: process.env.NODE_ENV === 'development', colors: true },
      graylog: { enabled: false, host: '127.0.0.1', port: 12201, facility: 'next-mvp', staticMeta: { service: 'next-mvp', application: 'next-mvp', version: '1.0.0', environment: process.env.NODE_ENV || 'development', hostname: this.getHostname(), instance: process.env.NEXT_INSTANCE_ID || 'unknown' } },
      components: { auth: { enabled: true, prefix: '[AUTH]' }, idp: { enabled: true, prefix: '[IDP]' }, api: { enabled: true, prefix: '[API]' }, circuitBreaker: { enabled: true, prefix: '[CIRCUIT-BREAKER]' }, token: { enabled: true, prefix: '[TOKEN]' }, tokenSync: { enabled: true, prefix: '[TOKEN-SYNC]' }, tokenRefresh: { enabled: true, prefix: '[TOKEN-REFRESH]' }, redis: { enabled: true, prefix: '[REDIS]' } },
      levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 }
    };
  }
}

export const loggingConfigManager = new LoggingConfigManager();
export const getLoggingConfig = () => loggingConfigManager.getConfig();
export const getLoggingConfigSync = () => loggingConfigManager.getConfigSync();
export const startConfigWatching = () => loggingConfigManager.startWatching();
export const stopConfigWatching = () => loggingConfigManager.stopWatching();
export const addConfigWatcher = (callback: (config: LoggingConfig) => void) => loggingConfigManager.addWatcher(callback);
export const removeConfigWatcher = (callback: (config: LoggingConfig) => void) => loggingConfigManager.removeWatcher(callback);
