"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DynamicHorizontalBarChartProps {
  data: any[];
  yKey: string;  // Category key (will be on Y axis)
  xKey: string;  // Value key (will be on X axis)
  color?: string;
  colors?: string[];
  title?: string;
  width?: number;
  height?: number;
  isDarkMode?: boolean;
}

export default function DynamicHorizontalBarChart({
  data,
  yKey,
  xKey,
  color,
  colors = ["#3b82f6", "#a855f7"],
  title,
  width,
  height = 350,
  isDarkMode = true
}: DynamicHorizontalBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return;

    // Aggregate data by yKey to avoid duplicate categories
    const aggregatedData = Array.from(
      d3.rollup(
        data,
        v => d3.sum(v, d => +d[xKey] || 0),
        d => d[yKey]
      ),
      ([category, value]) => ({ [yKey]: category, [xKey]: value })
    );

    // Sort by value and limit to top 15 categories
    const sortedData = aggregatedData
      .sort((a, b) => +b[xKey] - +a[xKey])
      .slice(0, 15);

    // Use aggregated and limited data
    const processedData = sortedData.length > 0 ? sortedData : data.slice(0, 15);

    // Color scheme based on dark mode
    const textColor = isDarkMode ? "#a1a1aa" : "#6b7280";
    const axisColor = isDarkMode ? "#52525b" : "#d1d5db";
    const gridColor = isDarkMode ? "#3f3f46" : "#e5e7eb";
    const tooltipBg = isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)";
    const tooltipText = isDarkMode ? "#fff" : "#000";

    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const chartWidth = width || container.clientWidth;
    // Responsive margins and height
    const isMobile = window.innerWidth < 640;
    const margin = isMobile
      ? { top: 15, right: 40, bottom: 30, left: 80 }
      : { top: 20, right: 60, bottom: 40, left: 120 };
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

    // Scales
    const yScale = d3
      .scaleBand()
      .domain(processedData.map(d => d[yKey]))
      .range([0, innerHeight])
      .padding(0.3);

    const xMax = d3.max(processedData, d => +d[xKey]) || 100;
    const xScale = d3
      .scaleLinear()
      .domain([0, xMax * 1.1])
      .range([0, innerWidth])
      .nice();

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", isDarkMode ? 0.1 : 0.3)
      .call(
        d3.axisBottom(xScale)
          .tickSize(innerHeight)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .style("stroke", gridColor);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "12px");

    g.selectAll(".domain, .tick line").style("stroke", axisColor);

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "12px");

    // Color scale
    const colorScale = color
      ? () => color
      : d3.scaleLinear<string>()
          .domain([0, processedData.length - 1])
          .range(colors);

    // Bars
    const bars = g
      .selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => yScale(d[yKey]) || 0)
      .attr("width", 0)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d, i) => color || colorScale(i))
      .attr("ry", 6)
      .style("cursor", "pointer");

    // Animate bars
    bars
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .ease(d3.easeBackOut)
      .attr("width", d => xScale(+d[xKey]));

    // Value labels at end of bars
    g.selectAll(".bar-label")
      .data(processedData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", 0)
      .attr("y", d => (yScale(d[yKey]) || 0) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", textColor)
      .text(d => {
        const value = +d[xKey];
        return value % 1 === 0 ? value : value.toFixed(2);
      })
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .attr("x", d => xScale(+d[xKey]) + 8)
      .style("opacity", 1);

    // Tooltip
    const tooltip = d3.select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", tooltipBg)
      .style("color", tooltipText)
      .style("box-shadow", isDarkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)")
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    bars
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8);

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>${d[yKey]}</strong><br/>${xKey}: ${d[xKey]}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data, yKey, xKey, color, colors, width, height, isDarkMode]);

  return (
    <div ref={containerRef} className="relative w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}
      <svg ref={svgRef} className="w-full h-auto"></svg>
    </div>
  );
}
