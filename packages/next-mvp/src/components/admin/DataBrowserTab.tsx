'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Table2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface CollectionInfo {
  name: string;
  tableCount: number;
}

export interface TableInfo {
  name: string;
  count: number;
}

interface TableData {
  data: any[];
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

interface CollectionWithTables extends CollectionInfo {
  tables: TableInfo[];
  loadingTables: boolean;
}

export interface DataBrowserTabProps {
  isDark?: boolean;
  /** Base API path for admin vibe data (default: /api/admin/vibe) */
  apiBasePath?: string;
  /** Collection to focus on (optional - shows all if not specified) */
  focusCollection?: string;
  /** Title for the data browser */
  title?: string;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function DataBrowserTab({
  isDark = true,
  apiBasePath = '/api/admin/vibe',
  focusCollection,
  title = 'Data Browser',
}: DataBrowserTabProps) {
  // Collections state
  const [collections, setCollections] = useState<CollectionWithTables[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  // Selection state
  const [selectedCollection, setSelectedCollection] = useState<string | null>(focusCollection || null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Table data state
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track rows being deleted
  const [deletingRows, setDeletingRows] = useState<Set<string | number>>(new Set());

  const themeClasses = {
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    inputBg: isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
    tableBg: isDark ? 'bg-slate-900' : 'bg-gray-50',
    tableHeader: isDark ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-700',
    tableRow: isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50',
  };

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true);
    setError(null);
    try {
      const response = await fetch(`${apiBasePath}/collections`);
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();

      const rawCollections = Array.isArray(data) ? data
        : Array.isArray(data.collections) ? data.collections
        : Array.isArray(data.data) ? data.data
        : [];

      const collectionList: CollectionWithTables[] = rawCollections.map((c: any) => ({
        name: typeof c === 'string' ? c : c.name,
        tableCount: typeof c === 'object' ? (c.table_count || c.tableCount || 0) : 0,
        tables: [],
        loadingTables: false,
      }));

      // If focusCollection is set, filter to just that collection
      const filteredList = focusCollection
        ? collectionList.filter(c => c.name === focusCollection)
        : collectionList;

      setCollections(filteredList);

      // Auto-expand first collection
      if (filteredList.length > 0) {
        const firstName = filteredList[0].name;
        setExpandedCollections(new Set([firstName]));
        fetchTablesForCollection(firstName);
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to fetch collections');
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  }, [apiBasePath, focusCollection]);

  // Fetch tables for a collection
  const fetchTablesForCollection = useCallback(async (collectionName: string) => {
    setCollections(prev => prev.map(c =>
      c.name === collectionName ? { ...c, loadingTables: true } : c
    ));

    try {
      const response = await fetch(`${apiBasePath}/collections/${collectionName}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();

      const rawTables = Array.isArray(data) ? data
        : Array.isArray(data.tables) ? data.tables
        : Array.isArray(data.data) ? data.data
        : [];

      const tableList: TableInfo[] = rawTables.map((t: any) => ({
        name: typeof t === 'string' ? t : t.name,
        count: typeof t === 'object' ? (t.document_count || t.count || 0) : 0,
      }));

      setCollections(prev => prev.map(c =>
        c.name === collectionName ? { ...c, tables: tableList, loadingTables: false } : c
      ));
    } catch (err) {
      console.error(`Failed to fetch tables for ${collectionName}:`, err);
      setCollections(prev => prev.map(c =>
        c.name === collectionName ? { ...c, loadingTables: false } : c
      ));
    }
  }, [apiBasePath]);

  // Fetch table data
  const fetchTableData = useCallback(async (collection: string, table: string) => {
    setLoadingData(true);
    setError(null);
    setExpandedRow(null);

    try {
      const response = await fetch(`${apiBasePath}/data/${collection}/${table}?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();

      const records = Array.isArray(data) ? data
        : Array.isArray(data.data) ? data.data
        : Array.isArray(data.documents) ? data.documents
        : [];

      setTableData({
        data: records,
        meta: data.meta || { total: records.length, limit: 50, offset: 0 },
      });
    } catch (err) {
      console.error(`Failed to fetch data for ${collection}/${table}:`, err);
      setError(`Failed to fetch data: ${err}`);
      setTableData(null);
    } finally {
      setLoadingData(false);
    }
  }, [apiBasePath]);

  // Delete record
  const handleDelete = useCallback(async (id: string | number) => {
    if (!selectedCollection || !selectedTable) return;
    if (!confirm(`Delete record ${id}?`)) return;

    setDeletingRows(prev => new Set(prev).add(id));

    try {
      const response = await fetch(`${apiBasePath}/data/${selectedCollection}/${selectedTable}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Delete failed');
      }

      setSuccess(`Record ${id} deleted`);
      setTimeout(() => setSuccess(null), 3000);

      // Remove from local state
      setTableData(prev => prev ? {
        ...prev,
        data: prev.data.filter(row => (row.id || row.document_id) !== id),
      } : null);
    } catch (err) {
      setError(`Failed to delete: ${err}`);
    } finally {
      setDeletingRows(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [selectedCollection, selectedTable, apiBasePath]);

  // Toggle collection expansion
  const toggleCollection = (name: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        // Fetch tables if not loaded
        const coll = collections.find(c => c.name === name);
        if (coll && coll.tables.length === 0 && !coll.loadingTables) {
          fetchTablesForCollection(name);
        }
      }
      return next;
    });
  };

  // Select table
  const selectTable = (collection: string, table: string) => {
    setSelectedCollection(collection);
    setSelectedTable(table);
    fetchTableData(collection, table);
  };

  // Initial load
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Get columns from data
  const getColumns = () => {
    if (!tableData?.data?.length) return [];
    const firstRow = tableData.data[0];
    return Object.keys(firstRow).filter(k => !['data', '__metadata'].includes(k));
  };

  // Filter data by search term
  const filteredData = tableData?.data?.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchLower)
    );
  }) || [];

  const columns = getColumns();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>{title}</h2>
        </div>
        <button
          onClick={fetchCollections}
          disabled={loadingCollections}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${themeClasses.hoverBg} ${themeClasses.textSecondary}`}
        >
          <RefreshCw className={`w-4 h-4 ${loadingCollections ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <div className="flex gap-4">
        {/* Collections sidebar */}
        <div className={`w-64 flex-shrink-0 rounded-lg border ${themeClasses.cardBg} p-3`}>
          <h3 className={`text-sm font-medium mb-3 ${themeClasses.textSecondary}`}>Collections</h3>
          {loadingCollections ? (
            <div className={`text-sm ${themeClasses.textMuted}`}>Loading...</div>
          ) : collections.length === 0 ? (
            <div className={`text-sm ${themeClasses.textMuted}`}>No collections found</div>
          ) : (
            <div className="space-y-1">
              {collections.map(coll => (
                <div key={coll.name}>
                  <button
                    onClick={() => toggleCollection(coll.name)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm ${themeClasses.hoverBg} ${themeClasses.textPrimary}`}
                  >
                    {expandedCollections.has(coll.name) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <Database className="w-4 h-4" />
                    <span className="truncate flex-1">{coll.name}</span>
                    {coll.tableCount > 0 && (
                      <span className={`text-xs ${themeClasses.textMuted}`}>{coll.tableCount}</span>
                    )}
                  </button>
                  {expandedCollections.has(coll.name) && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      {coll.loadingTables ? (
                        <div className={`text-xs px-2 py-1 ${themeClasses.textMuted}`}>Loading...</div>
                      ) : coll.tables.length === 0 ? (
                        <div className={`text-xs px-2 py-1 ${themeClasses.textMuted}`}>No tables</div>
                      ) : (
                        coll.tables.map(table => (
                          <button
                            key={table.name}
                            onClick={() => selectTable(coll.name, table.name)}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm ${
                              selectedCollection === coll.name && selectedTable === table.name
                                ? isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                : themeClasses.hoverBg + ' ' + themeClasses.textSecondary
                            }`}
                          >
                            <Table2 className="w-3 h-3" />
                            <span className="truncate flex-1">{table.name}</span>
                            {table.count > 0 && (
                              <span className={`text-xs ${themeClasses.textMuted}`}>{table.count}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data panel */}
        <div className="flex-1 min-w-0">
          {!selectedTable ? (
            <div className={`rounded-lg border ${themeClasses.cardBg} p-8 text-center`}>
              <Table2 className={`w-12 h-12 mx-auto mb-4 ${themeClasses.textMuted}`} />
              <p className={themeClasses.textSecondary}>Select a table to view data</p>
            </div>
          ) : (
            <div className={`rounded-lg border ${themeClasses.cardBg}`}>
              {/* Table header */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div>
                  <h3 className={`font-medium ${themeClasses.textPrimary}`}>
                    {selectedCollection} / {selectedTable}
                  </h3>
                  <p className={`text-sm ${themeClasses.textMuted}`}>
                    {tableData?.meta?.total || filteredData.length} records
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}`} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-3 py-1.5 rounded-lg border text-sm ${themeClasses.inputBg}`}
                    />
                  </div>
                  <button
                    onClick={() => fetchTableData(selectedCollection!, selectedTable!)}
                    disabled={loadingData}
                    className={`p-1.5 rounded-lg ${themeClasses.hoverBg}`}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''} ${themeClasses.textSecondary}`} />
                  </button>
                </div>
              </div>

              {/* Table content */}
              {loadingData ? (
                <div className="p-8 text-center">
                  <RefreshCw className={`w-8 h-8 mx-auto animate-spin ${themeClasses.textMuted}`} />
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={themeClasses.textMuted}>No records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={themeClasses.tableHeader}>
                        {columns.slice(0, 6).map(col => (
                          <th key={col} className="px-4 py-2 text-left font-medium">{col}</th>
                        ))}
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, idx) => {
                        const rowId = row.id || row.document_id || idx;
                        const isExpanded = expandedRow === rowId;
                        const isDeleting = deletingRows.has(rowId);

                        return (
                          <React.Fragment key={rowId}>
                            <tr className={`border-t ${themeClasses.tableRow} ${isDeleting ? 'opacity-50' : ''}`}>
                              {columns.slice(0, 6).map(col => (
                                <td key={col} className={`px-4 py-2 ${themeClasses.textPrimary}`}>
                                  <div className="max-w-xs truncate">
                                    {typeof row[col] === 'object'
                                      ? JSON.stringify(row[col]).slice(0, 50)
                                      : String(row[col] ?? '')}
                                  </div>
                                </td>
                              ))}
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                                    className={`p-1 rounded ${themeClasses.hoverBg}`}
                                    title="View details"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                                    ) : (
                                      <ChevronDown className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(rowId)}
                                    disabled={isDeleting}
                                    className="p-1 rounded hover:bg-red-900/20 text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className={`px-4 py-3 ${themeClasses.tableBg}`}>
                                  <pre className={`text-xs overflow-auto max-h-64 p-3 rounded ${isDark ? 'bg-slate-950' : 'bg-gray-100'} ${themeClasses.textSecondary}`}>
                                    {JSON.stringify(row, null, 2)}
                                  </pre>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataBrowserTab;
