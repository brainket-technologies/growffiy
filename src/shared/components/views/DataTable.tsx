'use client';

import React, { ReactNode, useState, useMemo } from 'react';
import { Search, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportCSV, exportPDF } from './tableExport';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  exportable?: boolean;
  exportFilename?: string;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  compact?: boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  filters,
  filterValues,
  onFilterChange,
  exportable = true,
  exportFilename = 'export',
  emptyMessage = 'No data found.',
  pageSize: defaultPageSize = 15,
  showPagination = true,
  compact = false,
  onRowClick,
  loading = false,
  actions,
  children,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = data;

    if (searchQuery && searchKeys) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row =>
        searchKeys.some(key => {
          const val = row[key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchQuery, sortKey, sortDir, searchKeys]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    exportCSV(filtered, columns.map(c => ({ key: c.key, label: c.label })), exportFilename);
  };

  const handleExportPDF = () => {
    exportPDF(exportFilename);
  };

  return (
    <div>
      {/* Toolbar */}
      {(title || searchable || filters || exportable || actions || children) && (
        <div className="table-toolbar">
          {title && <h3 className="table-toolbar-title">{title}</h3>}
          <div className="table-toolbar-actions">
            {children}
            {actions}
            {(exportable && filtered.length > 0) && (
              <>
                <button className="btn-export" onClick={handleExportCSV}>
                  <Download size={14} /> Excel
                </button>
                <button className="btn-export btn-export-pdf" onClick={handleExportPDF}>
                  <FileText size={14} /> PDF
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      {(searchable || filters) && (
        <div className="search-filter-bar">
          {searchable && (
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
          )}
          {filters?.map(f => (
            <select
              key={f.key}
              value={filterValues?.[f.key] || 'all'}
              onChange={e => onFilterChange?.(f.key, e.target.value)}
              className="filter-select"
            >
              <option value="all">All {f.label}</option>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className={`table-responsive${compact ? ' table-compact' : ''}`}>
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={col.className ? { textAlign: col.className === 'text-right' ? 'right' : 'left' } : undefined}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="sort-indicator">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-subtle)' }}>
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-subtle)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={(row as any).id || (row as any)._id || i}
                  className={onRowClick ? 'clickable-row' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={col.key} className={col.className || ''}>
                      {col.render
                        ? col.render(row[col.key], row, i)
                        : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="pagination-bar">
          <span className="page-info">
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`page-btn${pageNum === currentPage ? ' page-btn-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[10, 15, 25, 50, 100].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
