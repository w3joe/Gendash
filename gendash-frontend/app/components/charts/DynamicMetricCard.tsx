"use client";

import { useEffect, useState } from "react";

interface DynamicMetricCardProps {
  title: string;
  value: string | number;
  change?: number;  // Percentage change (optional)
  icon?: string;  // Emoji or text icon
  color?: string;  // Tailwind gradient class (e.g., "from-blue-500 to-cyan-500")
  prefix?: string;  // E.g., "$", "€"
  suffix?: string;  // E.g., "%", "k", "M"
  isDarkMode?: boolean;
}

export default function DynamicMetricCard({
  title,
  value,
  change,
  icon,
  color = "from-blue-500 to-cyan-500",
  prefix = "",
  suffix = "",
  isDarkMode = true
}: DynamicMetricCardProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const [isVisible, setIsVisible] = useState(false);
  const isPositive = change !== undefined ? change >= 0 : null;

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 100);

    // Animate value counting up and format numbers
    const timeout = setTimeout(() => {
      let formattedValue: string;
      if (typeof value === 'number') {
        // Show whole number if it's a whole number, otherwise 2 decimal places
        formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(2);
      } else {
        // Try to parse string as number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          formattedValue = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2);
        } else {
          formattedValue = value.toString();
        }
      }
      setDisplayValue(formattedValue);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-xl
        transform transition-all duration-500 hover:scale-105 hover:shadow-2xl
        group cursor-pointer ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } ${
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
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1">
            <p className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              {title}
            </p>
            <h3
              className={`text-2xl sm:text-3xl md:text-4xl font-bold transition-all duration-500 ${
                isDarkMode ? 'text-zinc-100' : 'text-gray-900'
              }`}
              style={{
                opacity: displayValue === "0" ? 0 : 1,
                transform: displayValue === "0" ? "translateY(10px)" : "translateY(0)",
              }}
            >
              {prefix}{displayValue}{suffix}
            </h3>
          </div>

          {/* Icon */}
          {icon && (
            <div
              className={`text-3xl sm:text-4xl md:text-5xl transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
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
              <span>{Math.abs(change).toFixed(2)}%</span>
            </div>
            <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
