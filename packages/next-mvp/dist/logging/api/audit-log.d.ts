import { AuditLogEntry, AuditLogQuery, AuditLogResponse } from '../types';
export declare function writeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<any>;
export declare function queryAuditLog(query: AuditLogQuery): Promise<AuditLogResponse>;
