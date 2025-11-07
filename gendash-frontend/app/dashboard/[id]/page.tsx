"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import PieChart from "../../components/charts/PieChart";
import AreaChart from "../../components/charts/AreaChart";
import MetricCard from "../../components/MetricCard";
import DataTable from "../../components/DataTable";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [apiUrl, setApiUrl] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Retrieve the prompt from localStorage
    const storedPrompt = localStorage.getItem('dashboardPrompt');
    if (storedPrompt) {
      setApiUrl(storedPrompt);
    }
  }, []);

  // Dummy data for charts
  const lineData = [
    { date: "Jan", value: 30, value2: 20 },
    { date: "Feb", value: 45, value2: 35 },
    { date: "Mar", value: 28, value2: 40 },
    { date: "Apr", value: 60, value2: 50 },
    { date: "May", value: 55, value2: 45 },
    { date: "Jun", value: 75, value2: 65 },
    { date: "Jul", value: 70, value2: 60 },
  ];

  const barData = [
    { category: "Product A", value: 120 },
    { category: "Product B", value: 95 },
    { category: "Product C", value: 145 },
    { category: "Product D", value: 80 },
    { category: "Product E", value: 110 },
  ];

  const pieData = [
    { label: "Desktop", value: 45 },
    { label: "Mobile", value: 35 },
    { label: "Tablet", value: 15 },
    { label: "Other", value: 5 },
  ];

  const areaData = [
    { date: "Week 1", revenue: 12000, expenses: 8000 },
    { date: "Week 2", revenue: 15000, expenses: 9500 },
    { date: "Week 3", revenue: 13500, expenses: 8800 },
    { date: "Week 4", revenue: 18000, expenses: 11000 },
    { date: "Week 5", revenue: 22000, expenses: 12500 },
    { date: "Week 6", revenue: 20000, expenses: 11800 },
  ];

  const tableData = [
    { id: 1, name: "Project Alpha", status: "Active", progress: 75, revenue: "$45,000" },
    { id: 2, name: "Project Beta", status: "Completed", progress: 100, revenue: "$62,000" },
    { id: 3, name: "Project Gamma", status: "Active", progress: 45, revenue: "$28,000" },
    { id: 4, name: "Project Delta", status: "Pending", progress: 15, revenue: "$12,000" },
    { id: 5, name: "Project Epsilon", status: "Active", progress: 90, revenue: "$54,000" },
  ];

  return (
    <div
      className={`min-h-screen p-6 sm:p-8 lg:p-10 transition-colors duration-300 ${
        isDarkMode ? 'bg-zinc-900' : 'bg-white'
      }`}
    >
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className={`text-4xl sm:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400`}>
              Dashboard Analytics
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'} truncate max-w-xl`}>
              Data Source: {apiUrl || "Loading..."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Light/Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700'
                  : 'bg-white text-zinc-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl font-semibold text-white text-base
                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                hover:from-blue-600 hover:via-purple-600 hover:to-pink-600
                transition-all duration-300 shadow-lg hover:shadow-xl
                transform hover:scale-105 active:scale-95"
            >
              Create New Dashboard
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value="$145,320"
            change={12.5}
            icon="💰"
            color="from-blue-500 to-cyan-500"
            isDarkMode={isDarkMode}
          />
          <MetricCard
            title="Active Users"
            value="8,549"
            change={8.2}
            icon="👥"
            color="from-purple-500 to-pink-500"
            isDarkMode={isDarkMode}
          />
          <MetricCard
            title="Conversion Rate"
            value="3.24%"
            change={-2.4}
            icon="📈"
            color="from-green-500 to-emerald-500"
            isDarkMode={isDarkMode}
          />
          <MetricCard
            title="Avg. Session"
            value="4m 32s"
            change={5.7}
            icon="⏱️"
            color="from-orange-500 to-red-500"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Row 1: Line and Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`rounded-2xl p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
              Performance Trends
            </h3>
            <LineChart data={lineData} />
          </div>

          <div className={`rounded-2xl p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
              Product Sales
            </h3>
            <BarChart data={barData} />
          </div>
        </div>

        {/* Row 2: Pie and Area Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`rounded-2xl p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
              Device Distribution
            </h3>
            <PieChart data={pieData} />
          </div>

          <div className={`rounded-2xl p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
              Revenue vs Expenses
            </h3>
            <AreaChart data={areaData} />
          </div>
        </div>

        {/* Row 3: Data Table */}
        <div className={`rounded-2xl p-8 border shadow-xl transition-colors duration-300 ${
          isDarkMode
            ? 'bg-zinc-800/60 border-zinc-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
            Project Overview
          </h3>
          <DataTable data={tableData} isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
