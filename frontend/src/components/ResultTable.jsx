import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import i18n from '../i18n';

// Highlight rules for critical values
const HIGHLIGHT_RULES = {
  loading_percent: (value) => {
    if (value > 100) return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
    if (value > 80) return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
    return null;
  },
  vm_pu: (value) => {
    if (value >= 0.95 && value <= 1.05) return null;
    if (value < 0.90 || value > 1.10) return { bg: 'bg-rose-500/20', text: 'text-rose-400' };
    return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
  },
};

const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 400;
const DEFAULT_COLUMN_WIDTH = 120;

const FROZEN_COLUMNS = ['idx', 'name'];

const isFrozenColumn = (column) => FROZEN_COLUMNS.includes(column);

const isLastFrozenColumn = (column) => column === FROZEN_COLUMNS[FROZEN_COLUMNS.length - 1];

const getFrozenColumnLeft = (column, columnWidths) => {
  const frozenIndex = FROZEN_COLUMNS.indexOf(column);
  if (frozenIndex <= 0) return 0;

  let offset = 0;
  for (let i = 0; i < frozenIndex; i++) {
    const prevColumn = FROZEN_COLUMNS[i];
    offset += columnWidths[prevColumn] || DEFAULT_COLUMN_WIDTH;
  }
  return offset;
};

const getInitialColumnWidth = (columnName) => {
  const lowerCol = columnName.toLowerCase();

  if (lowerCol === 'idx' || lowerCol === 'index') return 60;
  if (lowerCol === 'name' || lowerCol.endsWith('_name')) return 180;
  if (lowerCol === 'in_service' || lowerCol === 'closed' || lowerCol === 'tap_side') return 80;
  if (lowerCol === 'zone' || lowerCol === 'type') return 70;
  if (lowerCol.includes('bus') && !lowerCol.includes('_mw') && !lowerCol.includes('_mvar')) return 70;

  return DEFAULT_COLUMN_WIDTH;
};

function SortIcon({ direction }) {
  if (!direction) {
    return (
      <svg className="w-3 h-3 text-slate-500 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  if (direction === 'asc') {
    return (
      <svg className="w-3 h-3 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FilterIcon({ active }) {
  return (
    <svg className={`w-3 h-3 flex-shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
  );
}

function ResizeHandle({ onMouseDown }) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group z-20 hover:bg-cyan-500/50"
      onMouseDown={onMouseDown}
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
    </div>
  );
}

export default function ResultTable({ title, tableData }) {
  const { t } = useTranslation();

  if (!tableData || tableData.row_count === 0) {
    return null;
  }

  const { columns, data } = tableData;
  const parentRef = useRef(null);

  const [sortConfig, setSortConfig] = useState(null);
  const [filterConfig, setFilterConfig] = useState({});
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);

  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    columns.forEach(col => {
      widths[col] = getInitialColumnWidth(col);
    });
    return widths;
  });

  const [resizing, setResizing] = useState(null);

  useEffect(() => {
    setColumnWidths(prev => {
      const widths = { ...prev };
      columns.forEach(col => {
        if (!(col in widths)) {
          widths[col] = getInitialColumnWidth(col);
        }
      });
      return widths;
    });
  }, [columns]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, resizing.startWidth + delta));
      setColumnWidths(prev => ({
        ...prev,
        [resizing.column]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleResizeStart = useCallback((column, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column]
    });
  }, [columnWidths]);

  const formatValue = useCallback((value, column) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value : value.toFixed(4);
    }
    if (typeof value === 'boolean') return value ? t('resultTable.yes') : t('resultTable.no');
    return String(value);
  }, [t]);

  const getCellStyle = useCallback((value, column) => {
    const rule = HIGHLIGHT_RULES[column];
    if (rule && typeof value === 'number') {
      return rule(value);
    }
    return null;
  }, []);

  const processedData = useMemo(() => {
    let result = [...data];

    Object.entries(filterConfig).forEach(([column, filterText]) => {
      if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        result = result.filter(row => {
          const value = row[column];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerFilter);
        });
      }
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en';
        const comparison = aStr.localeCompare(bStr, locale);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, sortConfig, filterConfig]);

  const rowVirtualizer = useVirtualizer({
    count: processedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleSort = useCallback((column) => {
    setSortConfig(prev => {
      if (!prev || prev.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
  }, []);

  const handleFilterChange = useCallback((column, value) => {
    setFilterConfig(prev => {
      if (!value) {
        const { [column]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [column]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilterConfig({});
    setActiveFilterColumn(null);
  }, []);

  const toggleFilterPopover = useCallback((column, e) => {
    e.stopPropagation();
    setActiveFilterColumn(prev => prev === column ? null : column);
  }, []);

  const hasActiveFilters = Object.keys(filterConfig).length > 0;

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [filterConfig]);

  const tableWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + (columnWidths[col] || DEFAULT_COLUMN_WIDTH), 0);
  }, [columns, columnWidths]);

  return (
    <div className={`rounded-xl border border-slate-700/30 overflow-hidden ${resizing ? 'select-none' : ''}`}>
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/30 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">
          {title}{t('results.resultSuffix')}
        </h4>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('resultTable.clearFilter')}
            </button>
          )}
          <span className="text-xs text-slate-500 font-mono">
            {processedData.length === data.length
              ? t('resultTable.rows', { count: data.length })
              : t('resultTable.filteredRows', { filtered: processedData.length, total: data.length })
            }
          </span>
        </div>
      </div>

      <div
        ref={parentRef}
        className="overflow-auto max-h-[500px]"
      >
        <div style={{ width: `${tableWidth}px`, minWidth: '100%' }}>
          <div className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/30">
            <div className="flex">
              {columns.map((col) => {
                const colWidth = columnWidths[col] || DEFAULT_COLUMN_WIDTH;
                const frozen = isFrozenColumn(col);
                const lastFrozen = isLastFrozenColumn(col);
                return (
                  <div
                    key={col}
                    className={`relative flex-shrink-0 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono select-none hover:text-slate-200 transition-colors ${
                      frozen ? 'sticky z-30 bg-slate-800/95 backdrop-blur-sm' : ''
                    } ${
                      lastFrozen ? 'shadow-[2px_0_8px_rgba(6,182,212,0.15)]' : ''
                    }`}
                    style={{
                      width: `${colWidth}px`,
                      minWidth: `${colWidth}px`,
                      ...(frozen ? { left: `${getFrozenColumnLeft(col, columnWidths)}px` } : {})
                    }}
                    title={col}
                  >
                    <div className="flex items-center h-full px-2 py-3 pr-3">
                      <button
                        onClick={() => handleSort(col)}
                        className="flex items-center gap-1 hover:text-cyan-400 transition-colors min-w-0 flex-1 overflow-hidden"
                        title={col}
                      >
                        <span className="truncate">{col}</span>
                        <SortIcon direction={sortConfig?.column === col ? sortConfig.direction : null} />
                      </button>
                      <button
                        onClick={(e) => toggleFilterPopover(col, e)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0 ml-1"
                      >
                        <FilterIcon active={!!filterConfig[col]} />
                      </button>
                    </div>

                    <ResizeHandle onMouseDown={(e) => handleResizeStart(col, e)} />

                    {activeFilterColumn === col && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[200px]">
                        <input
                          type="text"
                          placeholder={t('resultTable.filterPlaceholder', { column: col })}
                          value={filterConfig[col] || ''}
                          onChange={(e) => handleFilterChange(col, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                        />
                        {filterConfig[col] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterChange(col, '');
                            }}
                            className="mt-2 text-xs text-slate-400 hover:text-slate-200"
                          >
                            {t('resultTable.clear')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = processedData[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className="flex border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${tableWidth}px`,
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {columns.map((col) => {
                    const cellStyle = getCellStyle(row[col], col);
                    const colWidth = columnWidths[col] || DEFAULT_COLUMN_WIDTH;
                    const value = formatValue(row[col], col);
                    const frozen = isFrozenColumn(col);
                    const lastFrozen = isLastFrozenColumn(col);
                    return (
                      <div
                        key={col}
                        className={`flex-shrink-0 px-2 py-2 text-slate-300 font-mono text-xs flex items-center overflow-hidden ${
                          frozen
                            ? `sticky z-10 bg-slate-900 ${cellStyle ? `${cellStyle.bg} ${cellStyle.text}` : ''}`
                            : cellStyle ? `${cellStyle.bg} ${cellStyle.text}` : ''
                        } ${
                          lastFrozen ? 'shadow-[2px_0_8px_rgba(6,182,212,0.1)]' : ''
                        }`}
                        style={{
                          width: `${colWidth}px`,
                          minWidth: `${colWidth}px`,
                          ...(frozen ? { left: `${getFrozenColumnLeft(col, columnWidths)}px` } : {})
                        }}
                        title={String(row[col] ?? '')}
                      >
                        <span className="truncate">{value}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {processedData.length === 0 && data.length > 0 && (
        <div className="px-4 py-8 text-center text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">{t('resultTable.noMatch')}</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
          >
            {t('resultTable.clearFilterCondition')}
          </button>
        </div>
      )}

      {activeFilterColumn && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveFilterColumn(null)}
        />
      )}
    </div>
  );
}
