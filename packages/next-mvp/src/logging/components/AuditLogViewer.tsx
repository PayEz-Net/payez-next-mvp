'use client';

import { useState, useEffect } from 'react';
import { AuditLogEntry, AuditLogQuery } from '../types';
import { queryAuditLog } from '../api/audit-log';

interface AuditLogViewerProps {
  query?: Partial<AuditLogQuery>;
  className?: string;
}

export function AuditLogViewer({ query = {}, className }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function fetchLogs() {
      try {
        setLoading(true);
        const result = await queryAuditLog({
          ...query,
          page,
          pageSize: 20,
        });

        if (mounted) {
          setLogs(result.data);
          setTotalPages(result.pagination?.totalPages || 1);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      mounted = false;
    };
  }, [query, page]);

  if (loading) return <div className={className}>Loading audit logs...</div>;
  if (error) return <div className={className}>Error: {error}</div>;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Audit Log</h3>

      {/* Logs table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                User ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">{log.category}</td>
                <td className="px-4 py-2 text-sm text-gray-900 font-mono">{log.action}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{log.userId || '-'}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
