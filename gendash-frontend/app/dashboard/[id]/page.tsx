"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchApiData, DashboardSpec, DashboardComponent } from "@/lib/api";
import DynamicLineChart from "../../components/charts/DynamicLineChart";
import DynamicBarChart from "../../components/charts/DynamicBarChart";
import DynamicHorizontalBarChart from "../../components/charts/DynamicHorizontalBarChart";
import DynamicPieChart from "../../components/charts/DynamicPieChart";
import DynamicDataTable from "../../components/charts/DynamicDataTable";
import DynamicMetricCard from "../../components/charts/DynamicMetricCard";
import DynamicGlobeMap from "../../components/charts/DynamicGlobeMap";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [apiUrl, setApiUrl] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [dashboardSpec, setDashboardSpec] = useState<DashboardSpec | null>(null);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Retrieve dashboard spec from localStorage
        const storedSpec = localStorage.getItem('dashboardSpec');
        const storedApiUrl = localStorage.getItem('dashboardApiUrl');

        if (!storedSpec || !storedApiUrl) {
          setError('Dashboard not found. Please generate a new dashboard.');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setApiUrl(storedApiUrl);
        setDashboardSpec(JSON.parse(storedSpec));

        // Fetch data from user's API
        const data = await fetchApiData(storedApiUrl);
        setDashboardData(data);
        setLoading(false);

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchApiData(apiUrl);
      setDashboardData(data);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const renderComponent = (component: DashboardComponent, index: number) => {
    const commonProps = {
      isDarkMode,
      data: dashboardData,
      title: component.title,
    };

    switch (component.type) {
      case 'line':
        return (
          <DynamicLineChart
            key={component.id}
            {...commonProps}
            xKey={component.dataMapping.xAxis || component.dataMapping.xKey}
            yKeys={Array.isArray(component.dataMapping.yAxis)
              ? component.dataMapping.yAxis
              : component.dataMapping.yKeys || [component.dataMapping.yAxis || component.dataMapping.yKey]
            }
          />
        );

      case 'bar':
        return (
          <DynamicBarChart
            key={component.id}
            {...commonProps}
            xKey={component.dataMapping.xAxis || component.dataMapping.xKey}
            yKey={component.dataMapping.yAxis || component.dataMapping.yKey}
          />
        );

      case 'horizontalBar':
        return (
          <DynamicHorizontalBarChart
            key={component.id}
            {...commonProps}
            yKey={component.dataMapping.yAxis || component.dataMapping.yKey}
            xKey={component.dataMapping.xAxis || component.dataMapping.xKey}
          />
        );

      case 'pie':
        return (
          <DynamicPieChart
            key={component.id}
            {...commonProps}
            labelKey={component.dataMapping.label || component.dataMapping.labelKey}
            valueKey={component.dataMapping.value || component.dataMapping.valueKey}
          />
        );

      case 'table':
        return (
          <DynamicDataTable
            key={component.id}
            {...commonProps}
            pageSize={10}
          />
        );

      case 'metric':
        // Calculate metric value from data
        const valueField = component.dataMapping.value;
        let metricValue: any = 0;

        if (valueField && dashboardData.length > 0) {
          // Try to sum numeric values
          const sum = dashboardData.reduce((acc, item) => {
            const val = item[valueField];
            return acc + (typeof val === 'number' ? val : 0);
          }, 0);
          metricValue = sum || dashboardData[0][valueField] || 0;
        }

        return (
          <DynamicMetricCard
            key={component.id}
            title={component.title}
            value={metricValue}
            isDarkMode={isDarkMode}
            icon="📊"
            color="from-blue-500 to-purple-500"
          />
        );

      case 'globe':
        return (
          <DynamicGlobeMap
            key={component.id}
            {...commonProps}
            autoRotate={true}
            rotationSpeed={0.5}
          />
        );

      default:
        return (
          <div key={component.id} className="p-4 text-center text-zinc-400">
            Unknown component type: {component.type}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Error</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

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
              Dashboard Analytics
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'} truncate max-w-xl`}>
              Data Source: {apiUrl}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'} mt-1`}>
              {dashboardData.length} records loaded
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-zinc-800 text-blue-400 hover:bg-zinc-700'
                  : 'bg-white text-blue-600 hover:bg-gray-100 border-2 border-gray-200'
              } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh Data"
            >
              <svg className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

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

            {/* New Dashboard Button */}
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

        {/* Render Components */}
        {dashboardSpec && dashboardSpec.components && (
          <div className="space-y-6">
            {/* Metric Cards - 4 columns */}
            {dashboardSpec.components.filter(c => c.type === 'metric').length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardSpec.components
                  .filter(c => c.type === 'metric')
                  .map((component, index) => renderComponent(component, index))}
              </div>
            )}

            {/* Charts in 2x2 grid (excluding metrics, table, and globe) */}
            {dashboardSpec.components.filter(c =>
              c.type !== 'metric' && c.type !== 'table' && c.type !== 'globe'
            ).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dashboardSpec.components
                  .filter(c => c.type !== 'metric' && c.type !== 'table' && c.type !== 'globe')
                  .map((component, index) => (
                    <div
                      key={component.id}
                      className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-zinc-800/60 border-zinc-700/50'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {renderComponent(component, index)}
                    </div>
                  ))}
              </div>
            )}

            {/* Full-width components (Table and Globe) */}
            {dashboardSpec.components
              .filter(c => c.type === 'table' || c.type === 'globe')
              .map((component, index) => (
                <div
                  key={component.id}
                  className={`rounded-2xl p-6 sm:p-8 border shadow-xl transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-zinc-800/60 border-zinc-700/50'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {renderComponent(component, index)}
                </div>
              ))}
          </div>
        )}

        {/* No components message */}
        {dashboardSpec && (!dashboardSpec.components || dashboardSpec.components.length === 0) && (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg">No components to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
