import { useState } from 'react';
import { AuditLogEntry } from '../types';
import { writeAuditLog } from '../api/audit-log';

export function useAuditLog() {
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    try {
      setWriting(true);
      setError(null);
      await writeAuditLog(entry);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to write audit log';
      setError(errMessage);
      throw err;
    } finally {
      setWriting(false);
    }
  }

  return { log, writing, error };
}
