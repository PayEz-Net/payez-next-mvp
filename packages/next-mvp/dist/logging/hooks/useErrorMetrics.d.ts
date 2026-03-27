import { ErrorMetrics, TimeRange } from '../types';
export declare function useErrorMetrics(timeRange?: TimeRange): {
    data: ErrorMetrics | null;
    loading: boolean;
    error: string | null;
};
