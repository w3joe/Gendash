"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DynamicBarChartProps {
  data: any[];
  xKey: string;  // Category key
  yKey: string;  // Value key
  color?: string;
  colors?: string[];  // Gradient colors for bars
  title?: string;
  width?: number;
  height?: number;
  isDarkMode?: boolean;
}

export default function DynamicBarChart({
  data,
  xKey,
  yKey,
  color,
  colors = ["#3b82f6", "#a855f7"],
  title,
  width,
  height = 350,
  isDarkMode = true
}: DynamicBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.length === 0) {
      console.warn('[BarChart] Missing required data or refs:', {
        hasData: !!data,
        dataLength: data?.length,
        hasSvgRef: !!svgRef.current,
        hasContainerRef: !!containerRef.current
      });
      return;
    }

    console.log('[BarChart] Rendering with:', {
      xKey,
      yKey,
      dataLength: data.length,
      sampleDataPoint: data[0],
      sampleXValue: data[0]?.[xKey],
      sampleYValue: data[0]?.[yKey]
    });

    // Check if we need to aggregate by counting unique xKey values
    const uniqueCategories = new Set(data.map(d => d[xKey]));
    const needsAggregation = uniqueCategories.size < data.length;

    console.log('[BarChart] Aggregation check:', {
      totalRecords: data.length,
      uniqueCategories: uniqueCategories.size,
      needsAggregation
    });

    let processedData;

    if (needsAggregation) {
      // Aggregate data by xKey when there are duplicates
      const aggregatedData = Array.from(
        d3.rollup(
          data,
          v => d3.sum(v, d => +d[yKey] || 0),
          d => d[xKey]
        ),
        ([category, value]) => ({ [xKey]: category, [yKey]: value })
      );

      console.log('[BarChart] Aggregated data:', {
        original: data.length,
        aggregated: aggregatedData.length,
        sampleAggregated: aggregatedData[0]
      });

      // Sort by value and limit to top 15 categories
      processedData = aggregatedData
        .sort((a, b) => +b[yKey] - +a[yKey])
        .slice(0, 15);
    } else {
      // Use data as-is, just sort and limit
      processedData = [...data]
        .sort((a, b) => +b[yKey] - +a[yKey])
        .slice(0, 15);

      console.log('[BarChart] Using data as-is (no aggregation needed):', {
        count: processedData.length,
        sample: processedData[0]
      });
    }

    console.log('[BarChart] Final processed data:', {
      count: processedData.length,
      sample: processedData[0]
    });

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
      ? { top: 15, right: 15, bottom: 50, left: 40 }
      : { top: 20, right: 30, bottom: 60, left: 60 };
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
    const xScale = d3
      .scaleBand()
      .domain(processedData.map(d => d[xKey]))
      .range([0, innerWidth])
      .padding(0.3);

    const yMax = d3.max(processedData, d => +d[yKey]) || 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
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
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", isMobile ? "10px" : "12px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.selectAll(".domain, .tick line").style("stroke", axisColor);

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "12px");

    // Color scale for gradient effect
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
      .attr("x", d => xScale(d[xKey]) || 0)
      .attr("y", innerHeight)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", (d, i) => color || colorScale(i))
      .attr("rx", 6)
      .style("cursor", "pointer");

    // Animate bars
    bars
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .ease(d3.easeBackOut)
      .attr("y", d => yScale(+d[yKey]))
      .attr("height", d => innerHeight - yScale(+d[yKey]));

    // Value labels on top of bars
    g.selectAll(".bar-label")
      .data(processedData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", d => (xScale(d[xKey]) || 0) + xScale.bandwidth() / 2)
      .attr("y", innerHeight)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", textColor)
      .text(d => {
        const value = +d[yKey];
        return value % 1 === 0 ? value : value.toFixed(2);
      })
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .attr("y", d => yScale(+d[yKey]) - 8)
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
          .attr("opacity", 0.8)
          .attr("transform", "scale(1.05)");

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<strong>${d[xKey]}</strong><br/>${yKey}: ${d[yKey]}`);
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
          .attr("opacity", 1)
          .attr("transform", "scale(1)");

        tooltip.transition().duration(200).style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data, xKey, yKey, color, colors, width, height, isDarkMode]);

  return (
    <div ref={containerRef} className="relative w-full">
      {title && <h3 className={`text-base sm:text-lg font-semibold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{title}</h3>}
      <svg ref={svgRef} className="w-full h-auto"></svg>
    </div>
  );
}
