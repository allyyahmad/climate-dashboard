/**
 * charts/heatmap.js
 * D3-based disaster-type frequency heatmap
 */

"use strict";

function buildHeatmap(typeYearRows) {
  const container = document.getElementById("heatmapContainer");
  container.innerHTML = "";

  const TYPES = Object.keys(CHART_COLORS);

  // Group into 5-year bands
  const bands = [];
  for (let yr = 1980; yr <= 2024; yr += 5) bands.push(yr);

  const matrix = {};
  TYPES.forEach((type) => {
    matrix[type] = {};
    bands.forEach((b) => (matrix[type][b] = 0));
  });
  typeYearRows.forEach((d) => {
    const band = Math.floor(d.year / 5) * 5;
    if (matrix[d.type] && matrix[d.type][band] !== undefined)
      matrix[d.type][band] += d.events;
  });

  const allVals = TYPES.flatMap((type) => bands.map((b) => matrix[type][b]));
  const maxVal  = Math.max(...allVals, 1);

  const panelW = Math.max(container.clientWidth || 900, 760);
  const labelW = 170;
  const padTop = 44;
  const padRight = 24;
  const legendH = 46;
  const cellW = Math.max(58, Math.floor((panelW - labelW - padRight) / bands.length));
  const cellH = 36;
  const svgW = labelW + bands.length * cellW + padRight;
  const svgH = padTop + TYPES.length * cellH + legendH;

  const colorScale = d3.scaleSequential([0, maxVal], d3.interpolateYlOrRd);

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${svgW} ${svgH}`)
    .attr("width", "100%")
    .attr("height", svgH)
    .style("display", "block");

  // Column headers
  bands.forEach((b, i) => {
    svg.append("text")
      .attr("x", labelW + i * cellW + cellW / 2)
      .attr("y", padTop - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", "700")
      .attr("fill", themeColor("muted"))
      .text(b + "s");
  });

  // Rows
  TYPES.forEach((type, ri) => {
    // Row label
    svg.append("text")
      .attr("x", labelW - 8)
      .attr("y", padTop + ri * cellH + cellH / 2 + 4)
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("font-weight", "700")
      .attr("fill", themeColor("text"))
      .text(type);

    // Cells
    bands.forEach((b, ci) => {
      const v    = matrix[type][b] || 0;
      const fill = colorScale(v);
      const bright = v > maxVal * 0.55;

      const cell = svg.append("g")
        .style("cursor", "pointer");

      cell.append("rect")
        .attr("x", labelW + ci * cellW + 3)
        .attr("y", padTop + ri * cellH + 3)
        .attr("width",  cellW - 6)
        .attr("height", cellH - 6)
        .attr("rx", 8)
        .attr("fill", fill)
        .attr("opacity", 0.94);

      cell.append("text")
        .attr("x", labelW + ci * cellW + cellW / 2)
        .attr("y", padTop + ri * cellH + cellH / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("font-weight", "750")
        .attr("fill", bright ? "#fff" : "#111827")
        .text(v.toLocaleString());

      // Tooltip
      cell.on("mouseover", (event) => {
        showTooltip(
          `<strong>${type} - ${b}s</strong>Events: ${v.toLocaleString()}`,
          event
        );
      })
      .on("mousemove", moveTooltip)
      .on("mouseout",  hideTooltip);
    });
  });

  // Color-scale legend bar
  const legendX = labelW + 3;
  const legendY = padTop + TYPES.length * cellH + 18;
  const legendW = bands.length * cellW - 6;
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "hm-grad").attr("x1", "0%").attr("x2", "100%");
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    grad.append("stop")
      .attr("offset", t * 100 + "%")
      .attr("stop-color", colorScale(t * maxVal));
  });

  svg.append("rect")
    .attr("x", legendX).attr("y", legendY)
    .attr("width", legendW).attr("height", 9)
    .attr("rx", 3)
    .attr("fill", "url(#hm-grad)")
    .attr("opacity", 0.94);

  svg.append("text").attr("x", legendX).attr("y", legendY + 24)
    .attr("font-size", 10).attr("font-weight", "700").attr("fill", themeColor("muted")).text("0");
  svg.append("text").attr("x", legendX + legendW).attr("y", legendY + 24)
    .attr("text-anchor", "end").attr("font-size", 10).attr("font-weight", "700").attr("fill", themeColor("muted"))
    .text(maxVal.toLocaleString() + " events");
}
