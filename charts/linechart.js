/**
 * charts/linechart.js
 * Line chart  — disaster frequency by type over years
 * Donut chart — disaster type distribution
 * Deaths heatmap — disaster mortality by type and 5-year band
 *
 * Fixes applied:
 *  - Focus+context hover: hovered line = full opacity, others dim to 0.08
 *  - Vertical crosshair at hovered x-position
 *  - Legend click-to-focus: clicking a legend item highlights that type
 *  - Dash patterns added as secondary encoding channel (colorblind-friendly)
 *  - Y-axis label repositioned to avoid viewBox clipping
 *  - Deaths heatmap text contrast uses luminance-based logic
 */

"use strict";

const chartRegistry = {};

function destroyChart(id) {
  if (chartRegistry[id]) {
    chartRegistry[id].destroy();
    delete chartRegistry[id];
  }
}

// ─── Line Chart ──────────────────────────────────────────────────────────────
function buildLineChart(typeYearRows) {
  destroyChart("lineChart");

  const container = document.getElementById("lineChart");
  container.innerHTML = "";

  const YEARS = [...new Set(typeYearRows.map((d) => d.year))].sort();
  const TYPES = Object.keys(CHART_COLORS);

  if (!YEARS.length) {
    container.innerHTML = `<div class="d3-empty">No event trend data for the selected filters.</div>`;
    document.getElementById("line-legend").innerHTML = "";
    return;
  }

  // Secondary encoding: dash patterns per type (colorblind-friendly)
  const DASH_PATTERNS = {
    Flood:                  null,          // solid
    Earthquake:             [6, 3],
    Wildfire:               [2, 2],
    Storms:                 [10, 3],
    Drought:                [4, 2, 1, 2],
    "Extreme temperature":  [8, 2],
    Landslide:              [3, 3, 1, 3],
    "Volcanic activity":    [1, 3],
  };

  const byYearType = {};
  YEARS.forEach((yr) => {
    byYearType[yr] = {};
    TYPES.forEach((tp) => (byYearType[yr][tp] = 0));
  });
  typeYearRows.forEach((d) => {
    if (byYearType[d.year]) byYearType[d.year][d.type] += d.events;
  });

  const series = TYPES.map((type) => ({
    type,
    values: YEARS.map((year) => ({ year, value: byYearType[year][type] || 0 })),
  }));

  const W = container.clientWidth || 900;
  const H = container.clientHeight || 300;
  const margin = { top: 18, right: 28, bottom: 42, left: 72 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const maxY = d3.max(series, (s) => d3.max(s.values, (d) => d.value)) || 1;

  const x = d3.scaleLinear()
    .domain(d3.extent(YEARS))
    .range([0, innerW]);
  const y = d3.scaleLinear()
    .domain([0, maxY]).nice()
    .range([innerH, 0]);

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Grid
  g.append("g")
    .attr("class", "d3-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

  // X-axis
  g.append("g")
    .attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(Math.min(YEARS.length, 12)).tickFormat(d3.format("d")));

  // Y-axis
  g.append("g")
    .attr("class", "d3-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat((d) => formatCompact(d)));

  // Axis labels
  g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + 36)
    .attr("text-anchor", "middle")
    .attr("fill", themeColor("muted"))
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text("Year");

  // Y-axis label — positioned clear of SVG edge
  g.append("text")
    .attr("x", -innerH / 2)
    .attr("y", -56)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", themeColor("muted"))
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text("Reported events");

  const lineGen = d3.line()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  // Track focused type ("all" = no focus, else a type name)
  let focusedType = "all";

  // Draw lines
  const linePaths = g.selectAll(".event-line")
    .data(series)
    .join("path")
    .attr("class", "event-line")
    .attr("fill", "none")
    .attr("stroke", (d) => CHART_COLORS[d.type])
    .attr("stroke-width", 2.4)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("stroke-dasharray", (d) => {
      const pat = DASH_PATTERNS[d.type];
      return pat ? pat.join(",") : null;
    })
    .attr("opacity", 0.88)
    .attr("d", (d) => lineGen(d.values))
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      applyLineFocus(d.type);
    })
    .on("mouseout", function() {
      if (focusedType === "all") applyLineFocus("all");
      else applyLineFocus(focusedType);
    });

  function applyLineFocus(type) {
    linePaths.attr("opacity", (s) => {
      if (type === "all") return 0.88;
      return s.type === type ? 1 : 0.08;
    }).attr("stroke-width", (s) => {
      if (type === "all") return 2.4;
      return s.type === type ? 3.2 : 1.6;
    });
  }

  // Vertical crosshair
  const crosshair = g.append("line")
    .attr("class", "crosshair-line")
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("stroke", themeColor("muted"))
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0)
    .style("pointer-events", "none");

  // Hover dot
  const hoverDot = g.append("circle")
    .attr("r", 5)
    .attr("fill", themeColor("accent"))
    .attr("stroke", themeColor("pointStroke"))
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .style("pointer-events", "none");

  // Invisible wide overlay for smooth hover detection
  const overlay = g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "none")
    .style("pointer-events", "all")
    .style("cursor", "crosshair");

  overlay
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event);
      const year = Math.round(x.invert(mx));
      const clampedYear = Math.max(YEARS[0], Math.min(YEARS[YEARS.length - 1], year));
      const nearestYear = YEARS.reduce((a, b) => Math.abs(b - clampedYear) < Math.abs(a - clampedYear) ? b : a);
      const cx = x(nearestYear);

      crosshair.attr("x1", cx).attr("x2", cx).attr("opacity", 0.6);

      // Find the relevant series
      const activeSeries = focusedType === "all"
        ? series.reduce((best, s) => {
            const val = byYearType[nearestYear]?.[s.type] || 0;
            return val > (byYearType[nearestYear]?.[best.type] || 0) ? s : best;
          }, series[0])
        : series.find((s) => s.type === focusedType) || series[0];

      const val = byYearType[nearestYear]?.[activeSeries.type] || 0;
      hoverDot
        .attr("cx", cx)
        .attr("cy", y(val))
        .attr("fill", CHART_COLORS[activeSeries.type])
        .attr("opacity", 1);

      // Build tooltip with all type values for that year
      const rows = series
        .map((s) => ({ type: s.type, val: byYearType[nearestYear]?.[s.type] || 0 }))
        .sort((a, b) => b.val - a.val)
        .filter((r) => r.val > 0)
        .map((r) => `<span style="color:${CHART_COLORS[r.type]}">■</span> ${r.type}: ${r.val.toLocaleString()}`)
        .join("<br>");

      showTooltip(
        `<strong>Year: ${nearestYear}</strong>${rows}`,
        event
      );
    })
    .on("mouseout", function() {
      crosshair.attr("opacity", 0);
      hoverDot.attr("opacity", 0);
      hideTooltip();
      if (focusedType === "all") applyLineFocus("all");
      else applyLineFocus(focusedType);
    });

  // Legend with click-to-focus
  const legendEl = document.getElementById("line-legend");
  legendEl.innerHTML = `
    <span class="legend-item" id="linechart-legend-all" style="cursor:pointer;margin-right:8px">
      <span class="legend-swatch" style="background:${themeColor("muted")}"></span>All types
    </span>
    ${TYPES.map((tp) => `
      <span class="legend-item linechart-legend-item" data-type="${tp}" style="cursor:pointer">
        <span class="legend-swatch" style="background:${CHART_COLORS[tp]}"></span>${tp}
      </span>
    `).join("")}
  `;

  // Legend click handlers
  legendEl.querySelectorAll(".linechart-legend-item").forEach((item) => {
    item.addEventListener("click", () => {
      const type = item.dataset.type;
      if (focusedType === type) {
        focusedType = "all";
        applyLineFocus("all");
        legendEl.querySelectorAll(".linechart-legend-item, #linechart-legend-all").forEach((el) => {
          el.style.opacity = "1";
        });
      } else {
        focusedType = type;
        applyLineFocus(type);
        legendEl.querySelectorAll(".linechart-legend-item").forEach((el) => {
          el.style.opacity = el.dataset.type === type ? "1" : "0.3";
        });
        document.getElementById("linechart-legend-all").style.opacity = "0.3";
      }
    });
  });

  document.getElementById("linechart-legend-all")?.addEventListener("click", () => {
    focusedType = "all";
    applyLineFocus("all");
    legendEl.querySelectorAll(".linechart-legend-item, #linechart-legend-all").forEach((el) => {
      el.style.opacity = "1";
    });
  });
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function buildDonutChart(typeYearRows) {
  destroyChart("donutChart");

  const TYPES = Object.keys(CHART_COLORS);
  const counts = TYPES.map((tp) =>
    typeYearRows.filter((d) => d.type === tp).reduce((sum, d) => sum + d.events, 0)
  );
  const total  = counts.reduce((a, b) => a + b, 0) || 1;

  const ctx = document.getElementById("donutChart").getContext("2d");
  chartRegistry.donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: TYPES,
      datasets: [{
        data: counts,
        backgroundColor: TYPES.map((tp) => CHART_COLORS[tp]),
        borderColor: themeColor("panel"),
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label || "",
            label: (ctx) =>
              ` ${ctx.raw.toLocaleString()} events (${Math.round(ctx.raw / total * 100)}%)`,
          },
        },
      },
    },
  });

  document.getElementById("donut-legend").innerHTML = TYPES.map(
    (tp, i) =>
      `<span class="legend-item">
        <span class="legend-swatch" style="background:${CHART_COLORS[tp]}"></span>
        ${tp} <span style="color:${themeColor("subtle")}">${Math.round(counts[i] / total * 100)}%</span>
      </span>`
  ).join("");
}

// ─── Deaths heatmap ──────────────────────────────────────────────────────────
function buildDeathsChart(typeYearRows) {
  destroyChart("deathsChart");

  const container = document.getElementById("deathsChart");
  container.innerHTML = "";

  const YEARS = [...new Set(typeYearRows.map((d) => d.year))].sort();
  const TYPES = Object.keys(CHART_COLORS);

  if (!YEARS.length) {
    container.innerHTML = `<div class="d3-empty">No deaths data for the selected filters.</div>`;
    return;
  }

  const firstYear = d3.min(YEARS);
  const lastYear  = d3.max(YEARS);
  const bands = [];
  for (let start = Math.floor(firstYear / 5) * 5; start <= lastYear; start += 5) {
    const end = Math.min(start + 4, lastYear);
    bands.push({ start, end, label: `${start}-${String(end).slice(-2)}` });
  }

  const cells = TYPES.flatMap((type) =>
    bands.map((band) => ({
      type,
      band,
      deaths: typeYearRows
        .filter((d) => d.type === type && d.year >= band.start && d.year <= band.end)
        .reduce((sum, d) => sum + d.deaths, 0),
    }))
  );
  const maxDeaths = d3.max(cells, (d) => d.deaths) || 1;

  const W = Math.max(container.clientWidth || 900, 860);
  const H = container.clientHeight || 360;
  const margin = { top: 48, right: 34, bottom: 68, left: 164 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(bands.map((d) => d.label))
    .range([0, innerW])
    .paddingInner(0.1);
  const y = d3.scaleBand()
    .domain(TYPES)
    .range([0, innerH])
    .paddingInner(0.13);

  // Use sqrt scale for color so mid-range values are more distinguishable
  const colorScale = d3.scaleSequential()
    .domain([0, Math.sqrt(maxDeaths)])
    .interpolator(d3.interpolateRgb(themeColor("panel"), "#ef4444"));
  const deathColor = (value) => colorScale(Math.sqrt(value || 0));

  // Luminance-based text color — WCAG-aware
  function pickTextColor(fillHex) {
    const c = d3.color(fillHex);
    if (!c) return themeColor("text");
    // Relative luminance per WCAG 2.1
    const toLinear = (ch) => {
      const s = ch / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
    return lum > 0.18 ? "#111827" : "#ffffff";
  }

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "d3-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select(".domain").remove());

  g.selectAll(".death-band-label")
    .data(bands)
    .join("text")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .attr("fill", themeColor("muted"))
    .attr("font-size", 11)
    .attr("font-weight", 800)
    .text((d) => d.label);

  g.selectAll(".death-cell")
    .data(cells)
    .join("rect")
    .attr("class", "death-cell")
    .attr("x", (d) => x(d.band.label))
    .attr("y", (d) => y(d.type))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 9)
    .attr("fill", (d) => d.deaths ? deathColor(d.deaths) : themeColor("panel"))
    .attr("stroke", themeColor("border"))
    .attr("stroke-width", 0.7)
    .attr("opacity", (d) => d.deaths ? 0.96 : 0.62)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      showTooltip(
        `<strong>${d.type}</strong>${d.band.start}–${d.band.end}<br>Deaths: ${d.deaths.toLocaleString()}`,
        event
      );
      d3.select(event.currentTarget)
        .attr("stroke", themeColor("accent"))
        .attr("stroke-width", 1.8)
        .attr("opacity", 1);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event, d) => {
      hideTooltip();
      d3.select(event.currentTarget)
        .attr("stroke", themeColor("border"))
        .attr("stroke-width", 0.45)
        .attr("opacity", d.deaths ? 0.96 : 0.62);
    });

  g.selectAll(".death-label")
    .data(cells.filter((d) => d.deaths > 0))
    .join("text")
    .attr("class", "death-label")
    .attr("x", (d) => x(d.band.label) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.type) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("fill", (d) => pickTextColor(deathColor(d.deaths)))
    .attr("font-size", 10)
    .attr("font-weight", 800)
    .text((d) => formatCompact(d.deaths));

  svg.append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", H - 16)
    .attr("text-anchor", "middle")
    .attr("fill", themeColor("muted"))
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text("5-year period");

  // Gradient legend
  const legendX = margin.left;
  const legendY = H - 42;
  const legendW = Math.min(360, innerW);
  const legendH = 8;
  const defs = svg.append("defs");
  const gradId = "deaths-heatmap-grad";
  const grad = defs.append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0%")
    .attr("x2", "100%");
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    grad.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", deathColor(t * maxDeaths));
  });

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendW)
    .attr("height", legendH)
    .attr("rx", 4)
    .attr("fill", `url(#${gradId})`);

  svg.append("text")
    .attr("x", legendX)
    .attr("y", legendY + 25)
    .attr("fill", themeColor("muted"))
    .attr("font-size", 10)
    .attr("font-weight", 800)
    .text("0 deaths");

  svg.append("text")
    .attr("x", legendX + legendW)
    .attr("y", legendY + 25)
    .attr("text-anchor", "end")
    .attr("fill", themeColor("muted"))
    .attr("font-size", 10)
    .attr("font-weight", 800)
    .text(`${formatCompact(maxDeaths)} deaths (max)`);
}
