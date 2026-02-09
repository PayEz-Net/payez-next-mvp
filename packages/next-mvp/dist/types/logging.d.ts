export interface LoggingConfig {
    logLevel: LogLevel;
    console: {
        enabled: boolean;
        colors: boolean;
    };
    graylog: {
        enabled: boolean;
        host: string;
        port: number;
        facility: string;
        staticMeta: {
            service: string;
            application: string;
            version: string;
            [key: string]: any;
        };
    };
    components: {
        [key: string]: {
            enabled: boolean;
            prefix: string;
        };
    };
    levels: {
        [key: string]: number;
    };
}
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';
export interface ComponentLoggerConfig {
    enabled: boolean;
    prefix: string;
}
export interface Logger {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    http: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
}
export interface ComponentLogger extends Logger {
}
