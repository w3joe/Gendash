"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DynamicLineChartProps {
  data: any[];  // Array of objects
  xKey: string;  // Key for x-axis (e.g., "date", "month", "category")
  yKeys: string[];  // Keys for y-axis (e.g., ["sales", "revenue"])
  colors?: string[];  // Optional custom colors for each line
  title?: string;
  width?: number;
  height?: number;
  isDarkMode?: boolean;
  maxDataPoints?: number;  // Maximum data points to display (default: 100 for dates, 50 for categories)
}

export default function DynamicLineChart({
  data,
  xKey,
  yKeys,
  colors = ["#3b82f6", "#a855f7", "#ec4899", "#10b981"],
  title,
  width,
  height = 350,
  isDarkMode = true,
  maxDataPoints
}: DynamicLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return;

    // Color scheme based on dark mode
    const textColor = isDarkMode ? "#a1a1aa" : "#6b7280";
    const axisColor = isDarkMode ? "#52525b" : "#d1d5db";
    const gridColor = isDarkMode ? "#3f3f46" : "#e5e7eb";
    const tooltipBg = isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const tooltipText = isDarkMode ? "#fff" : "#000";
    const strokeColor = isDarkMode ? "#1e293b" : "#f3f4f6";

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const chartWidth = width || container.clientWidth;
    // Responsive margins and height
    const isMobile = window.innerWidth < 640;
    const margin = isMobile
      ? { top: 15, right: 50, bottom: 40, left: 40 }
      : { top: 20, right: 80, bottom: 50, left: 60 };
    const responsiveHeight = isMobile ? Math.min(height, 280) : height;
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = responsiveHeight - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", responsiveHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse data and determine scale type
    const parseDate = d3.timeParse("%Y-%m-%d");
    const isDateAxis = data.some(d => {
      const val = d[xKey];
      return typeof val === 'string' && (val.includes('-') || val.includes('/'));
    });

    // Create a working copy of the data to avoid mutating props
    let workingData = [...data];

    // Parse dates if date axis
    if (isDateAxis) {
      workingData = workingData.map(d => ({
        ...d,
        [xKey]: parseDate(d[xKey]) || new Date(d[xKey])
      }));

      // Sort date data chronologically
      workingData = workingData.sort((a, b) =>
        a[xKey].getTime() - b[xKey].getTime()
      );
    }

    // Determine max data points based on axis type
    const defaultMaxPoints = isDateAxis ? 100 : 50;
    const maxPoints = maxDataPoints || defaultMaxPoints;

    // Aggregate and limit data to avoid congestion
    let processedData = workingData;

    if (workingData.length > maxPoints) {
      if (isDateAxis) {
        // For time-series data, aggregate by time buckets
        // Data is already sorted above
        const sortedData = workingData;

        // Calculate time span and bucket size
        const dateExtent = d3.extent(sortedData, d => new Date(d[xKey])) as [Date, Date];
        const timeSpan = dateExtent[1].getTime() - dateExtent[0].getTime();
        const bucketCount = maxPoints;
        const bucketSize = timeSpan / bucketCount;

        // Group data into time buckets and aggregate
        const buckets = new Map();
        sortedData.forEach(d => {
          const timestamp = new Date(d[xKey]).getTime();
          const bucketIndex = Math.floor((timestamp - dateExtent[0].getTime()) / bucketSize);
          const bucketKey = Math.min(bucketIndex, bucketCount - 1);

          if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, []);
          }
          buckets.get(bucketKey).push(d);
        });

        // Aggregate values in each bucket
        processedData = Array.from(buckets.values()).map(bucket => {
          const aggregated: any = { [xKey]: bucket[0][xKey] };
          yKeys.forEach(yKey => {
            // Average the values in the bucket
            aggregated[yKey] = d3.mean(bucket, d => +d[yKey] || 0) || 0;
          });
          return aggregated;
        });
      } else {
        // For categorical data, aggregate duplicates and take top N by first yKey
        const aggregatedData = Array.from(
          d3.rollup(
            workingData,
            v => {
              const result: any = { [xKey]: v[0][xKey] };
              yKeys.forEach(yKey => {
                result[yKey] = d3.mean(v, d => +d[yKey] || 0) || 0;
              });
              return result;
            },
            d => d[xKey]
          ),
          ([category, value]) => value
        );

        // Sort by first yKey value and limit
        processedData = aggregatedData
          .sort((a, b) => (+b[yKeys[0]] || 0) - (+a[yKeys[0]] || 0))
          .slice(0, maxPoints);
      }
    }

    // X Scale
    let xScale: any;
    if (isDateAxis) {
      xScale = d3.scaleTime()
        .domain(d3.extent(processedData, d => d[xKey]) as [Date, Date])
        .range([0, innerWidth]);
    } else {
      xScale = d3.scalePoint()
        .domain(processedData.map(d => d[xKey]))
        .range([0, innerWidth])
        .padding(0.5);
    }

    // Y Scale
    const allValues = processedData.flatMap(d => yKeys.map(key => +d[key] || 0));
    const yMax = d3.max(allValues) || 100;
    const yMin = d3.min(allValues) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(0, yMin), yMax * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", isDarkMode ? 0.1 : 0.3)
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .style("stroke", gridColor);

    // X Axis
    const xAxis = isDateAxis ? d3.axisBottom(xScale).ticks(6) : d3.axisBottom(xScale);
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "12px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.selectAll(".domain, .tick line").style("stroke", axisColor);

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "12px");

    // Create lines for each yKey
    yKeys.forEach((yKey, index) => {
      const color = colors[index % colors.length];

      // Line generator
      const line = d3.line<any>()
        .x(d => isDateAxis ? xScale(d[xKey]) : (xScale(d[xKey]) || 0))
        .y(d => yScale(+d[yKey] || 0))
        .curve(d3.curveMonotoneX);

      // Gradient
      const gradientId = `line-gradient-${index}`;
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", innerWidth)
        .attr("y2", 0);

      gradient.append("stop").attr("offset", "0%").attr("stop-color", color);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.6);

      // Draw line
      const path = g.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", `url(#${gradientId})`)
        .attr("stroke-width", 3)
        .attr("d", line);

      // Animate
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr("stroke-dashoffset", 0);

      // Add dots
      g.selectAll(`.dot-${index}`)
        .data(processedData)
        .enter()
        .append("circle")
        .attr("class", `dot-${index}`)
        .attr("cx", d => isDateAxis ? xScale(d[xKey]) : (xScale(d[xKey]) || 0))
        .attr("cy", d => yScale(+d[yKey] || 0))
        .attr("r", 0)
        .attr("fill", color)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .attr("r", 5);
    });

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${chartWidth - margin.right + 10}, ${margin.top})`);

    yKeys.forEach((yKey, index) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${index * 25})`);

      legendItem.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 20)
        .attr("y2", 0)
        .attr("stroke", colors[index % colors.length])
        .attr("stroke-width", 3);

      legendItem.append("text")
        .attr("x", 25)
        .attr("y", 4)
        .attr("font-size", "12px")
        .attr("fill", textColor)
        .text(yKey);
    });

    // Tooltip
    const tooltip = d3.select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", tooltipBg)
      .style("color", tooltipText)
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10)
      .style("box-shadow", isDarkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)");

    g.selectAll("circle")
      .on("mouseover", function (event, d: any) {
        d3.select(this).transition().duration(200).attr("r", 8);
        tooltip.transition().duration(200).style("opacity", 1);

        const content = yKeys.map(key =>
          `<strong>${key}:</strong> ${d[key]}`
        ).join("<br/>");

        tooltip.html(`<strong>${d[xKey]}</strong><br/>${content}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("r", 5);
        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data, xKey, yKeys, colors, width, height, isDarkMode]);

  return (
    <div ref={containerRef} className="relative w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}
      <svg ref={svgRef} className="w-full h-auto"></svg>
    </div>
  );
}
