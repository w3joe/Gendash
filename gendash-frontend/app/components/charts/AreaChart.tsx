"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  date: string;
  revenue: number;
  expenses: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

export default function AreaChart({ data }: AreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.date))
      .range([0, innerWidth])
      .padding(0.5);

    const maxValue = d3.max(data, (d) => Math.max(d.revenue, d.expenses)) || 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      );

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("fill", "#a1a1aa")
      .style("font-size", "12px");

    g.selectAll(".domain, .tick line").style("stroke", "#52525b");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d) => `$${d3.format(".0f")(d as number)}`))
      .selectAll("text")
      .style("fill", "#a1a1aa")
      .style("font-size", "12px");

    // Area generators
    const areaRevenue = d3
      .area<DataPoint>()
      .x((d) => xScale(d.date) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    const areaExpenses = d3
      .area<DataPoint>()
      .x((d) => xScale(d.date) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.expenses))
      .curve(d3.curveMonotoneX);

    // Create gradients
    const revenueGradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "revenue-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", innerHeight);

    revenueGradient.append("stop").attr("offset", "0%").attr("stop-color", "#10b981").attr("stop-opacity", 0.8);
    revenueGradient.append("stop").attr("offset", "100%").attr("stop-color", "#10b981").attr("stop-opacity", 0.1);

    const expensesGradient = svg
      .select("defs")
      .append("linearGradient")
      .attr("id", "expenses-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", innerHeight);

    expensesGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ef4444").attr("stop-opacity", 0.8);
    expensesGradient.append("stop").attr("offset", "100%").attr("stop-color", "#ef4444").attr("stop-opacity", 0.1);

    // Draw revenue area
    const revenuePath = g
      .append("path")
      .datum(data)
      .attr("fill", "url(#revenue-gradient)")
      .attr("d", areaRevenue)
      .style("opacity", 0);

    revenuePath
      .transition()
      .duration(1500)
      .ease(d3.easeQuadInOut)
      .style("opacity", 1);

    // Draw expenses area
    const expensesPath = g
      .append("path")
      .datum(data)
      .attr("fill", "url(#expenses-gradient)")
      .attr("d", areaExpenses)
      .style("opacity", 0);

    expensesPath
      .transition()
      .duration(1500)
      .delay(300)
      .ease(d3.easeQuadInOut)
      .style("opacity", 1);

    // Line generators
    const lineRevenue = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date) || 0)
      .y((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    const lineExpenses = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date) || 0)
      .y((d) => yScale(d.expenses))
      .curve(d3.curveMonotoneX);

    // Draw revenue line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 3)
      .attr("d", lineRevenue);

    // Draw expenses line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("d", lineExpenses);

    // Tooltip
    const tooltip = d3
      .select(container)
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

    // Add invisible overlay for better tooltip interaction
    data.forEach((d, i) => {
      g.append("rect")
        .attr("x", (xScale(d.date) || 0) - 20)
        .attr("y", 0)
        .attr("width", 40)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function () {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(
            `<strong>${d.date}</strong><br/>
            <span style="color: #10b981;">● Revenue: $${d.revenue.toLocaleString()}</span><br/>
            <span style="color: #ef4444;">● Expenses: $${d.expenses.toLocaleString()}</span><br/>
            <span style="color: #fbbf24;">Net: $${(d.revenue - d.expenses).toLocaleString()}</span>`
          );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 28}px`);
        })
        .on("mouseout", function () {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    });

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 150}, 20)`);

    const legendData = [
      { label: "Revenue", color: "#10b981" },
      { label: "Expenses", color: "#ef4444" },
    ];

    const legendItems = legend
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("circle")
      .attr("cx", 6)
      .attr("cy", 6)
      .attr("r", 6)
      .attr("fill", (d) => d.color);

    legendItems
      .append("text")
      .attr("x", 18)
      .attr("y", 6)
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("fill", "#a1a1aa")
      .text((d) => d.label);

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}
