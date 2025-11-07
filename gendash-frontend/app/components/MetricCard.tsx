"use client";

import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  color: string;
  isDarkMode?: boolean;
}

export default function MetricCard({ title, value, change, icon, color, isDarkMode = true }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const isPositive = change >= 0;

  useEffect(() => {
    // Animate value counting up
    const timeout = setTimeout(() => {
      setDisplayValue(value);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl
        transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
        group cursor-pointer ${
          isDarkMode
            ? 'bg-zinc-800/60 border-zinc-700/50'
            : 'bg-white border-gray-200'
        }`}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-base font-medium mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              {title}
            </p>
            <h3
              className={`text-4xl font-bold transition-all duration-500 ${
                isDarkMode ? 'text-zinc-100' : 'text-gray-900'
              }`}
              style={{
                opacity: displayValue === "0" ? 0 : 1,
                transform: displayValue === "0" ? "translateY(10px)" : "translateY(0)",
              }}
            >
              {displayValue}
            </h3>
          </div>

          {/* Icon */}
          <div
            className={`text-5xl transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`}
          >
            {icon}
          </div>
        </div>

        {/* Change indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold
              ${
                isPositive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
          >
            {isPositive ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(change)}%</span>
          </div>
          <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
            vs last period
          </span>
        </div>

        {/* Progress bar */}
        <div className={`mt-4 h-1.5 rounded-full overflow-hidden ${
          isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'
        }`}>
          <div
            className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
            style={{
              width: displayValue === "0" ? "0%" : "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
