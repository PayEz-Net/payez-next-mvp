export interface AuditLogEntry {
    id?: number;
    category: string;
    action: string;
    userId?: number;
    adminUserId?: number;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
}
export interface AuditLogQuery {
    category?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}
export interface AuditLogResponse {
    success: boolean;
    data: AuditLogEntry[];
    pagination?: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}
