import { ReactNode } from 'react';
import { TimeRange } from '../types';
interface AdminAnalyticsLayoutProps {
    title: string;
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    children: ReactNode;
}
export declare function AdminAnalyticsLayout({ title, timeRange, onTimeRangeChange, children, }: AdminAnalyticsLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
