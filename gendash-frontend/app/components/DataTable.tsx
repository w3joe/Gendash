"use client";

import { useState } from "react";

interface TableRow {
  id: number;
  name: string;
  status: string;
  progress: number;
  revenue: string;
}

interface DataTableProps {
  data: TableRow[];
  isDarkMode?: boolean;
}

export default function DataTable({ data, isDarkMode = true }: DataTableProps) {
  const [sortField, setSortField] = useState<keyof TableRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleSort = (field: keyof TableRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;

    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle revenue sorting (remove $ and commas)
    if (sortField === "revenue") {
      aVal = parseFloat(aVal.toString().replace(/[$,]/g, ""));
      bVal = parseFloat(bVal.toString().replace(/[$,]/g, ""));
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const SortIcon = ({ field }: { field: keyof TableRow }) => {
    if (sortField !== field) {
      return (
        <svg className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${isDarkMode ? 'border-zinc-700/50' : 'border-gray-200'}`}>
            <th
              className={`px-6 py-5 text-left text-base font-semibold cursor-pointer hover:text-purple-400 transition-colors ${
                isDarkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort("id")}
            >
              <div className="flex items-center gap-2">
                ID
                <SortIcon field="id" />
              </div>
            </th>
            <th
              className={`px-6 py-5 text-left text-base font-semibold cursor-pointer hover:text-purple-400 transition-colors ${
                isDarkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                Project Name
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className={`px-6 py-5 text-left text-base font-semibold cursor-pointer hover:text-purple-400 transition-colors ${
                isDarkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </th>
            <th
              className={`px-6 py-5 text-left text-base font-semibold cursor-pointer hover:text-purple-400 transition-colors ${
                isDarkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort("progress")}
            >
              <div className="flex items-center gap-2">
                Progress
                <SortIcon field="progress" />
              </div>
            </th>
            <th
              className={`px-6 py-5 text-left text-base font-semibold cursor-pointer hover:text-purple-400 transition-colors ${
                isDarkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort("revenue")}
            >
              <div className="flex items-center gap-2">
                Revenue
                <SortIcon field="revenue" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b transition-all duration-200 cursor-pointer ${
                isDarkMode
                  ? `border-zinc-800/50 ${hoveredRow === index ? "bg-zinc-800/40" : ""}`
                  : `border-gray-200 ${hoveredRow === index ? "bg-gray-50" : ""}`
              }`}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                opacity: 0,
                animation: `fadeIn 500ms ease-out ${index * 100}ms forwards`,
              }}
            >
              <td className={`px-6 py-5 text-base ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
                #{row.id}
              </td>
              <td className="px-6 py-5">
                <span className={`text-base font-medium ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                  {row.name}
                </span>
              </td>
              <td className="px-6 py-5">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(
                    row.status
                  )}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                      style={{
                        width: `${row.progress}%`,
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium min-w-[3rem] text-right ${
                    isDarkMode ? 'text-zinc-400' : 'text-gray-600'
                  }`}>
                    {row.progress}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-base font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {row.revenue}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
