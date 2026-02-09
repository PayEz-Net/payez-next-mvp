import { AuditLogEntry } from '../types';
export declare function useAuditLog(): {
    log: (entry: Omit<AuditLogEntry, "id" | "timestamp">) => Promise<void>;
    writing: boolean;
    error: string | null;
};
