/**
 * charts/barchart.js
 * Horizontal bar chart — top 10 affected countries
 * Economic damage ranking — by selected disaster types
 * People affected vs reported events dual-axis line
 * Selected economic damage trend line
 * Country impact chart — with sequential color scale + rank labels
 * Country drilldown — sqrt scale for spike-dominant data
 *
 * Fixes applied:
 *  - buildAffectedEventChart: added interaction mode, pointHoverRadius, legend, tooltip callbacks
 *  - buildDamageTrendChart: same tooltip fixes + year annotation
 *  - buildCountryImpactChart: sequential color scale, rank labels, % of total
 *  - buildCountryDrilldown: sqrt y-scale on deaths bars + peak annotation + mean ref line
 */

"use strict";

// ─── Top-10 Countries Bar (Global Overview) ───────────────────────────────────
function buildBarChart(countryRows, metric = "deaths") {
  destroyChart("barChart");

  const container = document.getElementById("barChart");
  container.innerHTML = "";

  const countryMap = {};
  countryRows.forEach((d) => { countryMap[d.country] = (countryMap[d.country] || 0) + d[metric]; });
  const top10 = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!top10.length) {
    container.innerHTML = `<div class="d3-empty">No country impact data for the selected filters.</div>`;
    return;
  }

  const W = container.clientWidth || 700;
  const H = container.clientHeight || 300;
  const margin = { top: 8, right: 58, bottom: 36, left: 150 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const maxValue = d3.max(top10, (d) => d[1]) || 1;
  const total = top10.reduce((s, d) => s + d[1], 0) || 1;

  // Sequential color scale for visual distinction by rank
  const colorScale = metric === "affected"
    ? d3.scaleSequential(d3.interpolateBlues).domain([maxValue * 0.1, maxValue])
    : d3.scaleSequential(d3.interpolateReds).domain([maxValue * 0.1, maxValue]);

  const x = d3.scaleLinear()
    .domain([0, maxValue]).nice()
    .range([0, innerW]);
  const y = d3.scaleBand()
    .domain(top10.map((d) => d[0]))
    .range([0, innerH])
    .padding(0.24);

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "d3-grid")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(""));

  g.append("g")
    .attr("class", "d3-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select(".domain").remove());

  g.append("g")
    .attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((d) => formatCompact(d)));

  g.selectAll(".country-bar")
    .data(top10)
    .join("rect")
    .attr("class", "country-bar")
    .attr("x", 0)
    .attr("y", (d) => y(d[0]))
    .attr("width", (d) => x(d[1]))
    .attr("height", y.bandwidth())
    .attr("rx", 7)
    .attr("fill", (d) => colorScale(d[1]))
    .on("mouseover", (event, d) => {
      const pct = Math.round(d[1] / total * 100);
      showTooltip(
        `<strong>${d[0]}</strong>${metric === "affected" ? "People affected" : "Deaths"}: ${d[1].toLocaleString()}<br>${pct}% of displayed total`,
        event
      );
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event) => {
      hideTooltip();
      d3.select(event.currentTarget).attr("opacity", 0.92);
    });

  // Value labels
  g.selectAll(".country-value")
    .data(top10)
    .join("text")
    .attr("x", (d) => x(d[1]) + 6)
    .attr("y", (d) => y(d[0]) + y.bandwidth() / 2 + 4)
    .attr("fill", themeColor("text"))
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text((d) => formatCompact(d[1]));
}

// ─── Economic Damage Ranking ─────────────────────────────────────────────────
function buildEconChart(typeYearRows) {
  destroyChart("econChart");

  const container = document.getElementById("econChart");
  container.innerHTML = "";

  const TYPES = Object.keys(CHART_COLORS);
  const hint = document.getElementById("econ-mode-hint");
  if (hint) hint.textContent = "Aggregated over selected years · current USD";

  const totals = TYPES.map((type) => ({
    type,
    damage: typeYearRows
      .filter((d) => d.type === type)
      .reduce((sum, d) => sum + d.damageUsd, 0),
  }))
    .filter((d) => d.damage > 0)
    .sort((a, b) => b.damage - a.damage);

  if (!totals.length) {
    container.innerHTML = `<div class="d3-empty">No economic damage data for the selected filters.</div>`;
    document.getElementById("econ-legend").innerHTML = "";
    return;
  }

  const W = container.clientWidth || 900;
  const H = container.clientHeight || 300;
  const margin = { top: 10, right: 116, bottom: 42, left: 168 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const maxDamageB = (d3.max(totals, (d) => d.damage) || 1) / 1e9;

  const x = d3.scaleLinear()
    .domain([0, maxDamageB]).nice()
    .range([0, innerW]);
  const y = d3.scaleBand()
    .domain(totals.map((d) => d.type))
    .range([0, innerH])
    .padding(0.24);

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "d3-grid")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(""));

  g.append("g")
    .attr("class", "d3-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select(".domain").remove());

  g.append("g")
    .attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((d) => "$" + formatCompact(d * 1e9)))
    .call((axis) => axis.select(".domain").remove());

  g.selectAll(".econ-damage-bar")
    .data(totals)
    .join("rect")
    .attr("class", "econ-damage-bar")
    .attr("x", 0)
    .attr("y", (d) => y(d.type))
    .attr("width", (d) => x(d.damage / 1e9))
    .attr("height", y.bandwidth())
    .attr("rx", 8)
    .attr("fill", (d) => CHART_COLORS[d.type])
    .attr("opacity", 0.92)
    .on("mouseover", (event, d) => {
      showTooltip(`<strong>${d.type}</strong>Economic damage: ${formatMoney(d.damage)}`, event);
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event) => {
      hideTooltip();
      d3.select(event.currentTarget).attr("opacity", 0.92);
    });

  g.selectAll(".econ-value-label")
    .data(totals)
    .join("text")
    .attr("class", "d3-value-label")
    .attr("x", (d) => Math.min(x(d.damage / 1e9) + 8, innerW + 12))
    .attr("y", (d) => y(d.type) + y.bandwidth() / 2 + 4)
    .text((d) => formatMoney(d.damage));

  // Source note moved to chart-source badge in HTML header — no SVG bottom text needed

  document.getElementById("econ-legend").innerHTML = TYPES.map(
    (tp) =>
      `<span class="legend-item">
         <span class="legend-swatch" style="background:${CHART_COLORS[tp]}"></span>${tp}
       </span>`
  ).join("");
}

// ─── People affected vs selected reported events ─────────────────────────────
function buildAffectedEventChart(annualRows, typeYearRows) {
  destroyChart("affectedFloodChart");

  const YEARS = [...new Set(annualRows.map((d) => d.year))].sort();
  const eventByYear = {};
  YEARS.forEach((yr) => (eventByYear[yr] = 0));
  typeYearRows.forEach((d) => { eventByYear[d.year] += d.events; });

  const affectedByYear = {};
  YEARS.forEach((yr) => (affectedByYear[yr] = 0));
  typeYearRows.forEach((d) => { affectedByYear[d.year] += d.affected; });

  const ctx = document.getElementById("affectedFloodChart").getContext("2d");
  chartRegistry.affectedFloodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: YEARS,
      datasets: [
        {
          label: "People affected",
          data: YEARS.map((yr) => affectedByYear[yr] || 0),
          borderColor: "#378ADD",
          backgroundColor: "rgba(55,138,221,0.10)",
          fill: true,
          tension: 0.28,
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          yAxisID: "y1",
        },
        {
          label: "Reported events",
          data: YEARS.map((yr) => eventByYear[yr] || 0),
          borderColor: "#06B6D4",
          borderDash: [5, 3],
          tension: 0.28,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index" },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: themeColor("muted"),
            usePointStyle: true,
            boxWidth: 8,
            padding: 14,
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => `Year: ${items[0]?.label}`,
            label: (ctx) => {
              if (ctx.dataset.yAxisID === "y1")
                return ` People affected: ${formatCompact(ctx.raw)}`;
              return ` Reported events: ${ctx.raw.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: themeColor("muted"), font: { size: 11 }, maxTicksLimit: 12 },
          grid:  { color: themeColor("grid") },
        },
        y1: {
          beginAtZero: true,
          position: "left",
          title: { display: true, text: "People affected", color: "#2563EB", font: { size: 11, weight: "bold" } },
          ticks: { color: "#2563EB", font: { size: 11 }, callback: (v) => formatCompact(v) },
          grid:  { color: themeColor("grid") },
        },
        y2: {
          beginAtZero: true,
          position: "right",
          title: { display: true, text: "Reported events", color: "#22D3EE", font: { size: 11, weight: "bold" } },
          ticks: { color: "#22D3EE", font: { size: 11 }, callback: (v) => formatCompact(v) },
          grid:  { drawOnChartArea: false },
        },
      },
    },
  });
}

// ─── Selected Economic Damage Trend ──────────────────────────────────────────
function buildDamageTrendChart(typeYearRows) {
  destroyChart("damageTrendChart");

  const YEARS = [...new Set(typeYearRows.map((c) => c.year))].sort();
  const damageByYear = {};
  typeYearRows.forEach((d) => {
    damageByYear[d.year] = (damageByYear[d.year] || 0) + d.damageUsd / 1e9;
  });

  const ctx = document.getElementById("damageTrendChart").getContext("2d");
  chartRegistry.damageTrendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: YEARS,
      datasets: [{
        label: "Economic damage (USD billions)",
        data: YEARS.map((yr) => +(damageByYear[yr] || 0).toFixed(2)),
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6,182,212,0.12)",
        fill: true,
        tension: 0.28,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index" },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: themeColor("muted"),
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => `Year: ${items[0]?.label}`,
            label: (ctx) => ` Damage: $${ctx.raw.toFixed(2)}B`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: themeColor("muted"), font: { size: 11 }, maxTicksLimit: 12 },
          grid:  { color: themeColor("grid") },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "USD Billions (current)", color: themeColor("muted"), font: { size: 11, weight: "bold" } },
          ticks: { color: themeColor("muted"), font: { size: 11 }, callback: (v) => "$" + v + "B" },
          grid:  { color: themeColor("grid") },
        },
      },
    },
  });
}

// ─── Country Impact Chart (Country Explorer) ──────────────────────────────────
function buildCountryImpactChart(countryRows, metric = "deaths") {
  destroyChart("countryImpactChart");

  const container = document.getElementById("countryImpactChart");
  container.innerHTML = "";

  const countryMap = {};
  countryRows.forEach((d) => { countryMap[d.country] = (countryMap[d.country] || 0) + d[metric]; });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  if (!topCountries.length) {
    container.innerHTML = `<div class="d3-empty">No country impact data for the selected filters.</div>`;
    return;
  }

  const W = container.clientWidth || 680;
  const H = container.clientHeight || 420;
  const margin = { top: 12, right: 88, bottom: 42, left: 126 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  const maxValue = d3.max(topCountries, (d) => d[1]) || 1;
  const total = topCountries.reduce((s, d) => s + d[1], 0) || 1;
  const label = metric === "affected" ? "People affected" : "Deaths";

  // Sequential color scale: darker = higher impact (redundant encoding with bar length)
  const colorScale = metric === "affected"
    ? d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue])
    : d3.scaleSequential(d3.interpolateReds).domain([0, maxValue]);

  const x = d3.scaleLinear()
    .domain([0, maxValue]).nice()
    .range([0, innerW]);
  const y = d3.scaleBand()
    .domain(topCountries.map((d) => d[0]))
    .range([0, innerH])
    .padding(0.24);

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "d3-grid")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-innerH).tickFormat(""));

  g.append("g")
    .attr("class", "d3-axis")
    .call(d3.axisLeft(y).tickSize(0))
    .call((axis) => axis.select(".domain").remove());

  g.append("g")
    .attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat((d) => formatCompact(d)));


  const bars = g.selectAll(".country-impact-bar")
    .data(topCountries)
    .join("rect")
    .attr("class", "country-impact-bar")
    .attr("x", 0)
    .attr("y", (d) => y(d[0]))
    .attr("width", (d) => x(d[1]))
    .attr("height", y.bandwidth())
    .attr("rx", 7)
    .attr("fill", (d) => colorScale(d[1]))
    .attr("opacity", 0.92)
    .attr("stroke", (d) => d[0] === State.selectedCountry ? themeColor("accent") : "transparent")
    .attr("stroke-width", (d) => d[0] === State.selectedCountry ? 2.2 : 0);

  bars
    .on("mouseover", (event, d) => {
      const pct = Math.round(d[1] / total * 100);
      showTooltip(
        `<strong>${d[0]}</strong>${label}: ${d[1].toLocaleString()}<br>${pct}% of top-${topCountries.length} total`,
        event
      );
      d3.select(event.currentTarget).attr("opacity", 1);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", (event) => {
      hideTooltip();
      d3.select(event.currentTarget).attr("opacity", 0.92);
    })
    .on("click", (event, d) => {
      if (window.selectCountry) window.selectCountry(d[0]);
    });

  // Value + % labels
  g.selectAll(".country-impact-value")
    .data(topCountries)
    .join("text")
    .attr("class", "d3-value-label")
    .attr("x", (d) => Math.min(x(d[1]) + 6, innerW + 8))
    .attr("y", (d) => y(d[0]) + y.bandwidth() / 2 + 4)
    .attr("font-size", 10)
    .text((d) => {
      const pct = Math.round(d[1] / total * 100);
      return `${formatCompact(d[1])} (${pct}%)`;
    });

  // Hint moved to chart-hint in HTML header — no SVG bottom text needed
}

// ─── Country Drilldown ────────────────────────────────────────────────────────
function buildCountryDrilldown(countryRows, selectedCountry) {
  destroyChart("countryDrilldownChart");

  const container = document.getElementById("countryDrilldownChart");
  const summary = document.getElementById("countryDrilldownSummary");
  if (!container || !summary) return;
  container.innerHTML = "";

  const selectedYearValues = [...document.querySelectorAll("#year-checklist input:checked")]
    .map((input) => +input.value);
  const allYearCount = document.querySelectorAll("#year-checklist input").length;
  const limitedYears = selectedYearValues.length && selectedYearValues.length < allYearCount
    ? selectedYearValues
    : [];
  const rows = countryRows
    .filter((d) => d.country === selectedCountry)
    .filter((d) => {
      if (limitedYears.length && !limitedYears.includes(d.year)) return false;
      if (selectedYearValues.length === 0) return false;
      return true;
    })
    .sort((a, b) => a.year - b.year);

  if (!selectedCountry || !rows.length) {
    summary.innerHTML = "";
    container.innerHTML = `<div class="d3-empty">Select a country from the map or ranking chart to inspect its annual impact.</div>`;
    return;
  }

  const totalDeaths = rows.reduce((sum, d) => sum + d.deaths, 0);
  const totalAffected = rows.reduce((sum, d) => sum + d.affected, 0);
  const peakDeaths = rows.reduce((best, d) => d.deaths > best.deaths ? d : best, rows[0]);
  const peakAffected = rows.reduce((best, d) => d.affected > best.affected ? d : best, rows[0]);
  const period = rows.length === 1 ? `${rows[0].year}` : `${rows[0].year}–${rows[rows.length - 1].year}`;

  summary.innerHTML = [
    ["Country", selectedCountry],
    ["Period", period],
    ["Deaths", formatCompact(totalDeaths)],
    ["Affected", formatCompact(totalAffected)],
  ].map(([label, value]) => `
    <div class="drilldown-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="drilldown-panel">
      <h3>Mortality spikes</h3>
      <p>√-scale · Peak: ${formatCompact(peakDeaths.deaths)} in ${peakDeaths.year} · hover bars for exact values.</p>
      <div class="drilldown-mini-chart" id="countryDeathsMini"></div>
    </div>
    <div class="drilldown-panel">
      <h3>People affected trend</h3>
      <p>Peak: ${formatCompact(peakAffected.affected)} in ${peakAffected.year} · dashed amber line = period mean.</p>
      <div class="drilldown-mini-chart" id="countryAffectedMini"></div>
    </div>
  `;

  drawCountryMiniBars("countryDeathsMini", rows, {
    valueKey: "deaths",
    color: "#EF4444",
    label: "Deaths",
    peak: `Peak: ${formatCompact(peakDeaths.deaths)} in ${peakDeaths.year}`,
    selectedCountry,
  });
  drawCountryMiniLine("countryAffectedMini", rows, {
    valueKey: "affected",
    color: "#3B82F6",
    label: "People affected",
    peak: `Peak: ${formatCompact(peakAffected.affected)} in ${peakAffected.year}`,
    selectedCountry,
  });
}

// ─── Country mini bar chart — sqrt scale to handle spike dominance ────────────
function drawCountryMiniBars(containerId, rows, config) {
  const container = document.getElementById(containerId);
  const W = container.clientWidth || 520;
  const H = container.clientHeight || 230;
  // Increased top margin so the ⚠ peak callout has room without overlapping subtitle
  const margin = { top: 20, right: 16, bottom: 38, left: 66 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const maxVal = d3.max(rows, (d) => d[config.valueKey]) || 1;

  // Use sqrt scale to handle spike-dominant distributions
  const x = d3.scaleBand().domain(rows.map((d) => d.year)).range([0, innerW]).padding(0.28);
  const y = d3.scaleSqrt().domain([0, maxVal]).nice().range([innerH, 0]);

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g").attr("class", "d3-grid").call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3.axisBottom(x)
        .tickValues(rows.map((d) => d.year).filter((year, i) => rows.length <= 12 || i % 5 === 0))
        .tickSize(0)
        .tickFormat(d3.format("d"))
    )
    .call((axis) => axis.select(".domain").remove());
  g.append("g").attr("class", "d3-axis")
    .call(d3.axisLeft(y).ticks(4).tickFormat((d) => formatCompact(d)));

  // "√ scale" note — inside chart area above the x-axis (not overlapping it)
  g.append("text")
    .attr("x", innerW)
    .attr("y", innerH - 4)
    .attr("text-anchor", "end")
    .attr("fill", themeColor("faint"))
    .attr("font-size", 9)
    .attr("font-weight", 700)
    .text("√ scale");

  g.selectAll("rect")
    .data(rows)
    .join("rect")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d[config.valueKey]))
    .attr("width", x.bandwidth())
    .attr("height", (d) => Math.max(0, innerH - y(d[config.valueKey])))
    .attr("rx", 4)
    .attr("fill", (d) => {
      const maxRow = rows.reduce((best, r) => r[config.valueKey] > best[config.valueKey] ? r : best, rows[0]);
      return d.year === maxRow.year ? "#FF6B6B" : config.color;
    })
    .attr("opacity", 0.82)
    .on("mouseover", (event, d) => {
      showTooltip(
        `<strong>${config.selectedCountry} — ${d.year}</strong>${config.label}: ${d[config.valueKey].toLocaleString()}`,
        event
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  // Peak annotation — small callout label beside (not above) the tallest bar to avoid overlap
  const peakRow = rows.reduce((best, r) => r[config.valueKey] > best[config.valueKey] ? r : best, rows[0]);
  if (peakRow[config.valueKey] > 0) {
    const px = x(peakRow.year) + x.bandwidth() / 2;
    const py = y(peakRow[config.valueKey]);
    const labelX = px + x.bandwidth() / 2 + 6; // offset right of the bar
    const clampedX = Math.min(labelX, innerW - 2);
    const anchor = clampedX < labelX ? "end" : "start";
    // Vertical tick
    g.append("line")
      .attr("x1", px).attr("y1", py)
      .attr("x2", px).attr("y2", py - 8)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "2,2");
    // Year badge — placed at the top of the bar, horizontally beside it
    g.append("text")
      .attr("x", Math.min(px + x.bandwidth() + 3, innerW))
      .attr("y", Math.max(py + 4, 10))
      .attr("text-anchor", "start")
      .attr("fill", "#FF6B6B")
      .attr("font-size", 9)
      .attr("font-weight", 800)
      .text(`⚠ ${peakRow.year}: ${formatCompact(peakRow[config.valueKey])}`);
  }
  // Peak text is shown in the HTML <p> subtitle of the drilldown panel — no SVG duplicate needed
}

// ─── Country mini line chart — with mean reference line ───────────────────────
function drawCountryMiniLine(containerId, rows, config) {
  const container = document.getElementById(containerId);
  const W = container.clientWidth || 520;
  const H = container.clientHeight || 230;
  const margin = { top: 28, right: 20, bottom: 34, left: 68 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const maxVal = d3.max(rows, (d) => d[config.valueKey]) || 1;
  const meanVal = rows.reduce((s, d) => s + d[config.valueKey], 0) / (rows.length || 1);

  const x = d3.scaleLinear().domain(d3.extent(rows, (d) => d.year)).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, maxVal]).nice().range([innerH, 0]);
  const line = d3.line()
    .x((d) => x(d.year))
    .y((d) => y(d[config.valueKey]))
    .curve(d3.curveMonotoneX);

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("display", "block");
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g").attr("class", "d3-grid").call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "d3-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format("d")))
    .call((axis) => axis.select(".domain").remove());
  g.append("g").attr("class", "d3-axis").call(d3.axisLeft(y).ticks(4).tickFormat((d) => formatCompact(d)));

  // Mean reference line — amber/visible, clearly labeled
  const meanY = y(meanVal);
  g.append("line")
    .attr("x1", 0).attr("y1", meanY)
    .attr("x2", innerW).attr("y2", meanY)
    .attr("stroke", "#F59E0B")
    .attr("stroke-width", 1.6)
    .attr("stroke-dasharray", "7,4")
    .attr("opacity", 0.9);
  // Small label background pill for contrast
  const meanLabel = `⌀ ${formatCompact(meanVal)}`;
  g.append("text")
    .attr("x", innerW - 4)
    .attr("y", meanY - 5)
    .attr("text-anchor", "end")
    .attr("fill", "#F59E0B")
    .attr("font-size", 9)
    .attr("font-weight", 800)
    .text(meanLabel);

  // Area fill
  const area = d3.area()
    .x((d) => x(d.year))
    .y0(innerH)
    .y1((d) => y(d[config.valueKey]))
    .curve(d3.curveMonotoneX);
  g.append("path")
    .datum(rows)
    .attr("fill", config.color)
    .attr("opacity", 0.12)
    .attr("d", area);

  g.append("path")
    .datum(rows)
    .attr("fill", "none")
    .attr("stroke", config.color)
    .attr("stroke-width", 2.8)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("d", line);

  g.selectAll("circle")
    .data(rows.filter((d) => d[config.valueKey] > 0))
    .join("circle")
    .attr("cx", (d) => x(d.year))
    .attr("cy", (d) => y(d[config.valueKey]))
    .attr("r", 3.2)
    .attr("fill", config.color)
    .attr("stroke", themeColor("pointStroke"))
    .attr("stroke-width", 1)
    .on("mouseover", (event, d) => {
      showTooltip(
        `<strong>${config.selectedCountry} — ${d.year}</strong>${config.label}: ${d[config.valueKey].toLocaleString()}`,
        event
      );
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  // Peak text is shown in the HTML <p> subtitle of the drilldown panel — no SVG duplicate
}
