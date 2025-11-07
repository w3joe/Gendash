"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  date: string;
  value: number;
  value2?: number;
}

interface LineChartProps {
  data: DataPoint[];
}

export default function LineChart({ data }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous chart
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

    const maxValue = d3.max(data, (d) => Math.max(d.value, d.value2 || 0)) || 100;
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
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", "#a1a1aa")
      .style("font-size", "12px");

    // Line generator for value
    const line = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date) || 0)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw main line with gradient
    const gradient1 = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient-1")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", innerWidth)
      .attr("y2", 0);

    gradient1.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6");
    gradient1.append("stop").attr("offset", "100%").attr("stop-color", "#a855f7");

    const path1 = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient-1)")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line
    const totalLength1 = path1.node()?.getTotalLength() || 0;
    path1
      .attr("stroke-dasharray", `${totalLength1} ${totalLength1}`)
      .attr("stroke-dashoffset", totalLength1)
      .transition()
      .duration(1500)
      .ease(d3.easeQuadInOut)
      .attr("stroke-dashoffset", 0);

    // Add second line if value2 exists
    if (data.some((d) => d.value2 !== undefined)) {
      const line2 = d3
        .line<DataPoint>()
        .x((d) => xScale(d.date) || 0)
        .y((d) => yScale(d.value2 || 0))
        .curve(d3.curveMonotoneX);

      const gradient2 = svg
        .select("defs")
        .append("linearGradient")
        .attr("id", "line-gradient-2")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", innerWidth)
        .attr("y2", 0);

      gradient2.append("stop").attr("offset", "0%").attr("stop-color", "#10b981");
      gradient2.append("stop").attr("offset", "100%").attr("stop-color", "#06b6d4");

      const path2 = g
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "url(#line-gradient-2)")
        .attr("stroke-width", 3)
        .attr("d", line2);

      const totalLength2 = path2.node()?.getTotalLength() || 0;
      path2
        .attr("stroke-dasharray", `${totalLength2} ${totalLength2}`)
        .attr("stroke-dashoffset", totalLength2)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr("stroke-dashoffset", 0);
    }

    // Add dots for main line
    g.selectAll(".dot1")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot1")
      .attr("cx", (d) => xScale(d.date) || 0)
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 0)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .attr("r", 5);

    // Add dots for second line
    if (data.some((d) => d.value2 !== undefined)) {
      g.selectAll(".dot2")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot2")
        .attr("cx", (d) => xScale(d.date) || 0)
        .attr("cy", (d) => yScale(d.value2 || 0))
        .attr("r", 0)
        .attr("fill", "#10b981")
        .attr("stroke", "#1e293b")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .attr("r", 5);
    }

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

    g.selectAll(".dot1, .dot2")
      .on("mouseover", function (event, d: any) {
        d3.select(this).transition().duration(200).attr("r", 8);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(
          `<strong>${d.date}</strong><br/>Value: ${d.value}${d.value2 !== undefined ? `<br/>Value 2: ${d.value2}` : ""}`
        );
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
  }, [data]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}
