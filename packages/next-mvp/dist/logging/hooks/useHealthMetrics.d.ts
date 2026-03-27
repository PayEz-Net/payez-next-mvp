import { HealthMetrics, TimeRange } from '../types';
export declare function useHealthMetrics(timeRange?: TimeRange): {
    data: HealthMetrics | null;
    loading: boolean;
    error: string | null;
};
