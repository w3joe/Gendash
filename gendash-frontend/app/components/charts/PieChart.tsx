"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  label: string;
  value: number;
}

interface PieChartProps {
  data: DataPoint[];
}

export default function PieChart({ data }: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 350;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Color scale
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => d.label))
      .range(["#3b82f6", "#a855f7", "#ec4899", "#f59e0b", "#10b981"]);

    // Pie generator
    const pie = d3
      .pie<DataPoint>()
      .value((d) => d.value)
      .sort(null);

    // Arc generator
    const arc = d3
      .arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const arcHover = d3
      .arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.1);

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

    // Create arcs
    const arcs = g
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    // Add paths
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.label))
      .attr("stroke", "#1e293b")
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

    // Add interactivity
    arcs
      .select("path")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover as any);

        tooltip.transition().duration(200).style("opacity", 1);
        const percentage = ((d.data.value / d3.sum(data, (item) => item.value)) * 100).toFixed(1);
        tooltip.html(
          `<strong>${d.data.label}</strong><br/>Value: ${d.data.value}<br/>Percentage: ${percentage}%`
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

    // Add labels
    arcs
      .append("text")
      .attr("transform", (d) => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y})`;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .style("opacity", 0)
      .text((d) => {
        const percentage = ((d.data.value / d3.sum(data, (item) => item.value)) * 100).toFixed(0);
        return `${percentage}%`;
      })
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1);

    // Add legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(20, 20)`);

    const legendItems = legend
      .selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 4)
      .attr("fill", (d) => colorScale(d.label))
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
      .attr("fill", "#a1a1aa")
      .text((d) => d.label)
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 150 + 1000)
      .duration(500)
      .style("opacity", 1);

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
