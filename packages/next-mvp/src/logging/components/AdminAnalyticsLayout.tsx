'use client';

import { ReactNode } from 'react';
import { TimeRange } from '../types';

interface AdminAnalyticsLayoutProps {
  title: string;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  children: ReactNode;
}

export function AdminAnalyticsLayout({
  title,
  timeRange,
  onTimeRangeChange,
  children,
}: AdminAnalyticsLayoutProps) {
  const timeRanges: TimeRange[] = ['1h', '24h', '7d', '30d'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>

        {/* Time range selector */}
        <div className="flex gap-2">
          {timeRanges.map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
