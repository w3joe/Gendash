"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DynamicPieChartProps {
  data: any[];
  labelKey: string;  // Key for labels (e.g., "category", "name")
  valueKey: string;  // Key for values (e.g., "count", "amount")
  colors?: string[];
  title?: string;
  width?: number;
  height?: number;
  donut?: boolean;  // If true, renders as donut chart
  innerRadiusRatio?: number;  // For donut chart (0-1)
  isDarkMode?: boolean;
}

export default function DynamicPieChart({
  data,
  labelKey,
  valueKey,
  colors = ["#3b82f6", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"],
  title,
  width,
  height = 350,
  donut = false,
  innerRadiusRatio = 0.6,
  isDarkMode = true
}: DynamicPieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) return;

    // Aggregate data by labelKey to avoid duplicate categories
    const aggregatedData = Array.from(
      d3.rollup(
        data,
        v => d3.sum(v, d => +d[valueKey] || 0),
        d => d[labelKey]
      ),
      ([label, value]) => ({ [labelKey]: label, [valueKey]: value })
    );

    // Sort by value and limit to top 10 to avoid overcrowding
    const sortedData = aggregatedData
      .sort((a, b) => +b[valueKey] - +a[valueKey])
      .slice(0, 10);

    // Use aggregated and limited data
    const processedData = sortedData.length > 0 ? sortedData : data.slice(0, 10);

    // Color scheme based on dark mode
    const textColor = isDarkMode ? "#fff" : "#000";
    const strokeColor = isDarkMode ? "#1e293b" : "#f3f4f6";
    const labelColor = isDarkMode ? "#a1a1aa" : "#6b7280";

    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const chartWidth = width || container.clientWidth;
    // Responsive height - smaller on mobile
    const responsiveHeight = window.innerWidth < 640 ? Math.min(height, 300) : height;
    const radius = Math.min(chartWidth, responsiveHeight) / 2 - (window.innerWidth < 640 ? 40 : 60);

    const svg = d3
      .select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", responsiveHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${chartWidth / 2},${responsiveHeight / 2})`);

    // Color scale
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(processedData.map(d => d[labelKey]))
      .range(colors);

    // Pie generator
    const pie = d3
      .pie<any>()
      .value(d => +d[valueKey])
      .sort(null);

    // Arc generators
    const innerRadius = donut ? radius * innerRadiusRatio : 0;
    const arc = d3
      .arc<d3.PieArcDatum<any>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcHover = d3
      .arc<d3.PieArcDatum<any>>()
      .innerRadius(innerRadius)
      .outerRadius(radius * 1.1);

    // Calculate total
    const total = d3.sum(processedData, d => +d[valueKey]);

    // Create slices
    const arcs = g
      .selectAll(".arc")
      .data(pie(processedData))
      .enter()
      .append("g")
      .attr("class", "arc");

    // Add paths
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", d => colorScale(d.data[labelKey]))
      .attr("stroke", strokeColor)
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 150)
      .style("opacity", 1)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) || "";
        };
      });

    // Add labels with lines
    arcs
      .append("text")
      .attr("transform", d => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y})`;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", textColor)
      .style("opacity", 0)
      .text(d => {
        const percentage = ((+d.data[valueKey] / total) * 100).toFixed(0);
        return `${percentage}%`;
      })
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1);

    // Center label for donut charts
    if (donut) {
      const centerGroup = g.append("g");

      centerGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .attr("fill", labelColor)
        .attr("dy", "-0.5em")
        .text(total.toLocaleString());

      centerGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", labelColor)
        .attr("dy", "1em")
        .text("Total");
    }

    // Tooltip
    const tooltip = d3.select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    // Interactivity
    arcs
      .select("path")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover as any);

        tooltip.transition().duration(200).style("opacity", 1);
        const percentage = ((+d.data[valueKey] / total) * 100).toFixed(1);
        tooltip.html(
          `<strong>${d.data[labelKey]}</strong><br/>Value: ${d.data[valueKey]}<br/>Percentage: ${percentage}%`
        );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 28}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc as any);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Legend - responsive positioning
    const legendX = window.innerWidth < 640 ? 10 : chartWidth - 150;
    const legendY = window.innerWidth < 640 ? responsiveHeight - (processedData.length * 25 + 20) : 20;
    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const legendItems = legend
      .selectAll(".legend-item")
      .data(processedData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 4)
      .attr("fill", d => colorScale(d[labelKey]))
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 150 + 1000)
      .duration(500)
      .style("opacity", 1);

    legendItems
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("fill", labelColor)
      .text(d => d[labelKey])
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 150 + 1000)
      .duration(500)
      .style("opacity", 1);

    return () => {
      tooltip.remove();
    };
  }, [data, labelKey, valueKey, colors, width, height, donut, innerRadiusRatio, isDarkMode]);

  return (
    <div ref={containerRef} className="relative w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}
      <svg ref={svgRef} className="w-full h-auto"></svg>
    </div>
  );
}
