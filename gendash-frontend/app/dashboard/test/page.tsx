"use client";

import { useState } from "react";
import DynamicLineChart from "../../components/charts/DynamicLineChart";
import DynamicBarChart from "../../components/charts/DynamicBarChart";
import DynamicHorizontalBarChart from "../../components/charts/DynamicHorizontalBarChart";
import DynamicPieChart from "../../components/charts/DynamicPieChart";
import DynamicDataTable from "../../components/charts/DynamicDataTable";
import DynamicMetricCard from "../../components/charts/DynamicMetricCard";
import DynamicGlobeMap from "../../components/charts/DynamicGlobeMap";

export default function TestDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Dummy data for Line Chart
  const lineData = [
    { month: "Jan", revenue: 4500, expenses: 3200, profit: 1300 },
    { month: "Feb", revenue: 5200, expenses: 3600, profit: 1600 },
    { month: "Mar", revenue: 4800, expenses: 3400, profit: 1400 },
    { month: "Apr", revenue: 6200, expenses: 4100, profit: 2100 },
    { month: "May", revenue: 7100, expenses: 4500, profit: 2600 },
    { month: "Jun", revenue: 6800, expenses: 4200, profit: 2600 },
  ];

  // Dummy data for Bar Chart
  const barData = [
    { product: "Product A", sales: 145 },
    { product: "Product B", sales: 98 },
    { product: "Product C", sales: 176 },
    { product: "Product D", sales: 82 },
    { product: "Product E", sales: 134 },
  ];

  // Dummy data for Horizontal Bar Chart
  const horizontalBarData = [
    { region: "North America", value: 245 },
    { region: "Europe", value: 198 },
    { region: "Asia Pacific", value: 312 },
    { region: "Latin America", value: 156 },
    { region: "Middle East", value: 123 },
  ];

  // Dummy data for Pie Chart
  const pieData = [
    { category: "Electronics", amount: 35 },
    { category: "Clothing", amount: 25 },
    { category: "Food", amount: 20 },
    { category: "Books", amount: 12 },
    { category: "Other", amount: 8 },
  ];

  // Dummy data for Data Table
  const tableData = [
    { id: 1, customer: "John Doe", email: "john@example.com", orders: 5, revenue: 1250, status: "Active" },
    { id: 2, customer: "Jane Smith", email: "jane@example.com", orders: 8, revenue: 2100, status: "Active" },
    { id: 3, customer: "Bob Johnson", email: "bob@example.com", orders: 3, revenue: 750, status: "Pending" },
    { id: 4, customer: "Alice Brown", email: "alice@example.com", orders: 12, revenue: 3600, status: "Active" },
    { id: 5, customer: "Charlie Wilson", email: "charlie@example.com", orders: 2, revenue: 420, status: "Inactive" },
    { id: 6, customer: "Diana Prince", email: "diana@example.com", orders: 15, revenue: 4500, status: "Active" },
    { id: 7, customer: "Ethan Hunt", email: "ethan@example.com", orders: 6, revenue: 1680, status: "Active" },
    { id: 8, customer: "Fiona Apple", email: "fiona@example.com", orders: 4, revenue: 980, status: "Pending" },
  ];

  // Dummy data for Globe Map
  const globeData = [
    { lat: 40.7128, lon: -74.0060, value: 100, label: "New York" },
    { lat: 51.5074, lon: -0.1278, value: 85, label: "London" },
    { lat: 35.6762, lon: 139.6503, value: 120, label: "Tokyo" },
    { lat: -33.8688, lon: 151.2093, value: 65, label: "Sydney" },
    { lat: 48.8566, lon: 2.3522, value: 75, label: "Paris" },
    { lat: 37.7749, lon: -122.4194, value: 95, label: "San Francisco" },
    { lat: 52.5200, lon: 13.4050, value: 70, label: "Berlin" },
    { lat: 55.7558, lon: 37.6173, value: 80, label: "Moscow" },
    { lat: 39.9042, lon: 116.4074, value: 110, label: "Beijing" },
    { lat: -23.5505, lon: -46.6333, value: 60, label: "São Paulo" },
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
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Dynamic Charts Showcase
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              All charts are dynamically configurable via props
            </p>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
              isDarkMode
                ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700'
                : 'bg-white text-zinc-700 hover:bg-gray-100 border-2 border-gray-200'
            }`}
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
        </div>

        {/* Metric Cards - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DynamicMetricCard
            title="Total Revenue"
            value={145320}
            change={12.5}
            icon="💰"
            prefix="$"
            color="from-blue-500 to-cyan-500"
            isDarkMode={isDarkMode}
          />
          <DynamicMetricCard
            title="Active Users"
            value={8549}
            change={8.2}
            icon="👥"
            color="from-purple-500 to-pink-500"
            isDarkMode={isDarkMode}
          />
          <DynamicMetricCard
            title="Conversion Rate"
            value={3.24}
            change={-2.4}
            icon="📈"
            suffix="%"
            color="from-green-500 to-emerald-500"
            isDarkMode={isDarkMode}
          />
          <DynamicMetricCard
            title="Average Order"
            value={284}
            change={5.7}
            icon="🛒"
            prefix="$"
            color="from-orange-500 to-red-500"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* 2x2 Grid for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <DynamicLineChart
              data={lineData}
              xKey="month"
              yKeys={["revenue", "expenses", "profit"]}
              colors={["#3b82f6", "#ef4444", "#10b981"]}
              title="Financial Performance (Multi-line)"
              isDarkMode={isDarkMode}
            />
          </div>

          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <DynamicBarChart
              data={barData}
              xKey="product"
              yKey="sales"
              title="Product Sales (Vertical)"
              isDarkMode={isDarkMode}
            />
          </div>

          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <DynamicHorizontalBarChart
              data={horizontalBarData}
              yKey="region"
              xKey="value"
              title="Regional Distribution (Horizontal)"
              isDarkMode={isDarkMode}
            />
          </div>

          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
            isDarkMode
              ? 'bg-zinc-800/60 border-zinc-700/50'
              : 'bg-white border-gray-200'
          }`}>
            <DynamicPieChart
              data={pieData}
              labelKey="category"
              valueKey="amount"
              donut={true}
              innerRadiusRatio={0.6}
              title="Sales by Category (Donut Chart)"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Full-width components */}
        <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
          isDarkMode
            ? 'bg-zinc-800/60 border-zinc-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <DynamicGlobeMap
            data={globeData}
            title="Global User Distribution (3D Interactive Globe)"
            autoRotate={true}
            rotationSpeed={0.5}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
          isDarkMode
            ? 'bg-zinc-800/60 border-zinc-700/50'
            : 'bg-white border-gray-200'
        }`}>
          <DynamicDataTable
            data={tableData}
            title="Customer Overview (Sortable & Searchable)"
            pageSize={5}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
}
