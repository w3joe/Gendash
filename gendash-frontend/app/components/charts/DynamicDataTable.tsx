"use client";

import { useState, useMemo } from "react";

interface DynamicDataTableProps {
  data: any[];
  columns?: string[];  // If not provided, will use all keys from first object
  title?: string;
  pageSize?: number;
  isDarkMode?: boolean;
  maxRows?: number;  // Maximum rows to display (default: 1000)
}

export default function DynamicDataTable({
  data,
  columns,
  title,
  pageSize = 10,
  isDarkMode = true,
  maxRows = 1000
}: DynamicDataTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Limit data to prevent performance issues
  const limitedData = useMemo(() => {
    return data.length > maxRows ? data.slice(0, maxRows) : data;
  }, [data, maxRows]);

  const isTruncated = data.length > maxRows;
  const totalDataCount = data.length;

  // Determine columns from data if not provided
  const tableColumns = useMemo(() => {
    if (columns) return columns;
    if (limitedData && limitedData.length > 0) {
      return Object.keys(limitedData[0]);
    }
    return [];
  }, [limitedData, columns]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return limitedData;

    return limitedData.filter(row =>
      tableColumns.some(col => {
        const value = row[col];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [limitedData, searchTerm, tableColumns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric values
      if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <svg className={`w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return value.toString();
  };

  return (
    <div className="w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border transition-colors ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-purple-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
          } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 sm:rounded-xl">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? 'border-zinc-700/50' : 'border-gray-200'}`}>
              {tableColumns.map((col) => (
                <th
                  key={col}
                  className={`px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold cursor-pointer hover:text-purple-400 transition-colors whitespace-nowrap ${
                    isDarkMode ? 'text-zinc-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[100px] sm:max-w-none">{col}</span>
                    <SortIcon field={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className={`border-b transition-all duration-200 cursor-pointer ${
                  isDarkMode
                    ? `border-zinc-800/50 ${hoveredRow === index ? "bg-zinc-800/40" : ""}`
                    : `border-gray-200 ${hoveredRow === index ? "bg-gray-50" : ""}`
                }`}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  opacity: 0,
                  animation: `fadeIn 500ms ease-out ${index * 50}ms forwards`,
                }}
              >
                {tableColumns.map((col) => (
                  <td
                    key={col}
                    className={`px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap ${
                      isDarkMode ? 'text-zinc-300' : 'text-gray-600'
                    }`}
                  >
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data info and truncation warning */}
      {isTruncated && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs sm:text-sm ${
          isDarkMode ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          ⚠️ Showing first {maxRows} of {totalDataCount} rows for performance
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
          <div className="text-xs sm:text-sm">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            {isTruncated && ` (limited from ${totalDataCount})`}
          </div>
          <div className="flex gap-1 sm:gap-2 items-center flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-purple-500/20'
              } ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}
            >
              Prev
            </button>

            {/* Page numbers with ellipsis - show max 5 pages */}
            <div className="flex gap-1 items-center">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className={`px-1 sm:px-2 py-1 text-xs sm:text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>...</span>
                  )}
                </>
              )}

              {/* Pages around current (max 5 visible) */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                .map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-purple-500 text-white'
                        : isDarkMode
                        ? 'bg-zinc-800 hover:bg-zinc-700'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className={`px-1 sm:px-2 py-1 text-xs sm:text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                      isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-purple-500/20'
              } ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
