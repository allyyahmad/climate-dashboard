/**
 * charts/scatterplot.js
 * Decade summary: climate signal and reported disaster events
 * CO2 scatter: CO2 ppm vs total disasters
 * Multi-variable bubble: Temp × Damage × Deaths
 *
 * Fixes applied:
 *  - buildScatterChart: clear combined tooltip title + annotation text + y2 baseline
 *  - buildCo2Scatter: color ramp legend + year labels on key points + regression trend line
 *  - buildBubbleChart: bubble size legend HTML injected below canvas
 *  - buildTempChart: tooltip title + pointHoverRadius
 */

"use strict";

// ─── Decade averages: climate signal and reported disasters ─────────────────
function buildScatterChart(annualRows) {
  destroyChart("scatterChart");

  const rows = annualRows
    .filter((d) => d.tempAnom !== null)
    .sort((a, b) => a.year - b.year);

  const decadeMap = {};
  rows.forEach((d) => {
    const decadeStart = Math.floor(d.year / 10) * 10;
    const label = d.year >= 2020 ? "2020s" : `${decadeStart}s`;
    if (!decadeMap[label]) decadeMap[label] = [];
    decadeMap[label].push(d);
  });

  const labels = Object.keys(decadeMap).sort();
  const avgEvents = labels.map((label) => {
    const values = decadeMap[label];
    return Math.round(values.reduce((sum, d) => sum + d.events, 0) / values.length);
  });
  const avgTemp = labels.map((label) => {
    const values = decadeMap[label];
    return +(values.reduce((sum, d) => sum + d.tempAnom, 0) / values.length).toFixed(2);
  });
  const periods = labels.map((label) => {
    const values = decadeMap[label];
    return values.length === 1
      ? `${values[0].year}`
      : `${values[0].year}–${values[values.length - 1].year}`;
  });

  // Compute y2 range to avoid floating baseline
  const tempMin = Math.min(...avgTemp);
  const tempMax = Math.max(...avgTemp);
  const tempPad = (tempMax - tempMin) * 0.4 || 0.2;

  const ctx = document.getElementById("scatterChart").getContext("2d");

  chartRegistry.scatterChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Avg reported events / year",
          data: avgEvents,
          backgroundColor: "rgba(59,130,246,0.74)",
          borderColor: "#60A5FA",
          borderWidth: 1,
          borderRadius: 7,
          borderSkipped: false,
          yAxisID: "y1",
          order: 2,
        },
        {
          label: "Avg temp anomaly (°C)",
          type: "line",
          data: avgTemp,
          borderColor: "#EF4444",
          backgroundColor: "#EF4444",
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9,
          tension: 0.28,
          yAxisID: "y2",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
            title: (items) => {
              const idx = items[0]?.dataIndex ?? 0;
              return `${labels[idx]} (${periods[idx]})`;
            },
            label: (ctx) => {
              if (ctx.dataset.yAxisID === "y2")
                return ` Avg temp anomaly: ${ctx.raw}°C`;
              return ` Avg reported events: ${ctx.raw.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: themeColor("muted"), font: { size: 11 } },
          grid:  { color: themeColor("grid") },
        },
        y1: {
          position: "left",
          beginAtZero: true,
          title: {
            display: true,
            text: "Avg events / year",
            color: "#60A5FA",
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: "#60A5FA", font: { size: 11 }, callback: (v) => formatCompact(v) },
          grid:  { color: themeColor("grid") },
        },
        y2: {
          position: "right",
          min: tempMin - tempPad,
          max: tempMax + tempPad,
          title: {
            display: true,
            text: "Avg temp anomaly (°C)",
            color: "#EF4444",
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: "#EF4444", font: { size: 11 }, callback: (v) => v + "°C" },
          grid:  { drawOnChartArea: false },
        },
      },
    },
  });
}

// ─── CO2 vs Total Disasters scatter ──────────────────────────────────────────
function buildCo2Scatter(annualRows) {
  destroyChart("co2scatter");

  const data = annualRows
    .filter((d) => d.co2 !== null)
    .map((d) => ({ x: d.co2, y: d.events, yr: d.year }));

  // Compute linear regression trend line
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  data.forEach((p) => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n || 0;
  const xExtent = d3.extent(data, (d) => d.x);
  const trendData = [
    { x: xExtent[0], y: slope * xExtent[0] + intercept },
    { x: xExtent[1], y: slope * xExtent[1] + intercept },
  ];

  const ctx = document.getElementById("co2scatter").getContext("2d");
  chartRegistry.co2scatter = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Year",
          data,
          backgroundColor: data.map((p) => {
            const t = (p.yr - 1980) / 43;
            return `rgba(${Math.round(55 + t * 200)}, ${Math.round(138 - t * 80)}, ${Math.round(221 - t * 150)}, 0.78)`;
          }),
          borderColor: themeColor("pointStroke"),
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 9,
        },
        {
          label: "Linear trend (exploratory)",
          type: "line",
          data: trendData,
          borderColor: "rgba(248,113,133,0.6)",
          borderWidth: 1.8,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: themeColor("muted"),
            usePointStyle: true,
            boxWidth: 8,
            filter: (item) => item.datasetIndex === 1, // only show trend line in legend
          },
        },
        tooltip: {
          filter: (item) => item.datasetIndex === 0, // only show tooltip for data points
          callbacks: {
            title: () => "",
            label: (ctx) => {
              const p = ctx.raw;
              return [`Year: ${p.yr}`, `CO₂: ${p.x} ppm`, `Disasters: ${p.y}`];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "CO₂ concentration (ppm)",
            color: themeColor("muted"),
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: themeColor("muted"), font: { size: 11 } },
          grid:  { color: themeColor("grid") },
        },
        y: {
          title: {
            display: true,
            text: "Total reported disasters",
            color: themeColor("muted"),
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: themeColor("muted"), font: { size: 11 }, callback: (v) => formatCompact(v) },
          grid:  { color: themeColor("grid") },
        },
      },
    },
  });

  // Inject color ramp legend below the canvas
  const canvas = document.getElementById("co2scatter");
  const existing = canvas.parentElement.querySelector(".co2-ramp-legend");
  if (existing) existing.remove();
  const rampDiv = document.createElement("div");
  rampDiv.className = "co2-ramp-legend";
  rampDiv.style.cssText = `
    display:flex; align-items:center; gap:8px; margin-top:8px;
    font-size:10px; font-weight:700; color:${themeColor("subtle")};
  `;
  rampDiv.innerHTML = `
    <span>1980</span>
    <span style="
      flex:1; height:8px; border-radius:4px;
      background: linear-gradient(to right,
        rgba(55,138,221,0.9),
        rgba(155,98,146,0.9),
        rgba(255,58,71,0.9));
    "></span>
    <span>2024</span>
    <span style="margin-left:12px; font-size:9px; color:${themeColor("faint")}">Color = time progression</span>
  `;
  canvas.parentElement.appendChild(rampDiv);
}

// ─── Multi-variable Bubble: Temp × Damage × Deaths ───────────────────────────
function buildBubbleChart(annualRows) {
  destroyChart("bubbleChart");

  const data = annualRows
    .filter((d) => d.tempAnom !== null)
    .map((d) => ({
      x: d.tempAnom,
      y: +(d.damageUsd / 1e9).toFixed(2),
      r: Math.max(4, Math.min(18, d.deaths / 20000)),
      yr: d.year,
      deaths: d.deaths,
    }));

  const ctx = document.getElementById("bubbleChart").getContext("2d");
  chartRegistry.bubbleChart = new Chart(ctx, {
    type: "bubble",
    data: {
      datasets: [{
        label: "Year",
        data,
        backgroundColor: "rgba(168,85,247,0.48)",
        borderColor: "#D8B4FE",
        borderWidth: 1.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 24, right: 110, bottom: 24, left: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `Year: ${items[0]?.raw?.yr}`,
            label: (ctx) => {
              const p = ctx.raw;
              return [
                ` Temp anomaly: ${p.x}°C`,
                ` Economic damage: $${p.y}B`,
                ` Deaths: ${formatCompact(p.deaths)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Temp anomaly (°C)",
            color: themeColor("muted"),
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: themeColor("muted"), font: { size: 11 } },
          grid:  { color: themeColor("grid") },
        },
        y: {
          title: {
            display: true,
            text: "Economic damage ($B)",
            color: themeColor("muted"),
            font: { size: 11, weight: "bold" },
          },
          ticks: { color: themeColor("muted"), font: { size: 11 }, callback: (v) => "$" + v + "B" },
          grid:  { color: themeColor("grid") },
          min: 0,
          suggestedMin: -10,  // give breathing room so bubbles near y=0 aren't clipped
        },
      },
    },
  });

  // clip:false via dataset override — prevents bubbles from being hard-clipped at axis edges
  chartRegistry.bubbleChart.data.datasets[0].clip = false;

  // Inject bubble size legend in the top-right corner of the chart-wrap as an overlay
  const canvas = document.getElementById("bubbleChart");
  const existing = canvas.parentElement.querySelector(".bubble-size-legend");
  if (existing) existing.remove();
  const legendDiv = document.createElement("div");
  legendDiv.className = "bubble-size-legend";
  legendDiv.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    padding: 8px 10px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
    z-index: 10;
    box-shadow: var(--shadow);
  `;

  // Examples aligned to the scaled-down bubble sizing formula
  const examples = [
    { r: 4,  label: "~80K" },
    { r: 10, label: "~200K" },
    { r: 18, label: "~360K+" },
  ];
  legendDiv.innerHTML = `
    <div style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${themeColor("muted")}; margin-bottom: 2px; text-align: center;">
      Deaths
    </div>
  ` + examples.map(({ r, label }) => `
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <span style="
          display: inline-block;
          width: ${r * 2}px; height: ${r * 2}px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.44);
          border: 1.2px solid #D8B4FE;
        "></span>
      </span>
      <span style="font-size: 9px; font-weight: 700; color: ${themeColor("subtle")}">${label}</span>
    </div>
  `).join("");
  canvas.parentElement.appendChild(legendDiv);
}

// ─── Climate Trend Charts (in trends tab) ────────────────────────────────────
function buildTempChart(annualRows) {
  destroyChart("tempChart");

  const YEARS = [...new Set(annualRows.map((c) => c.year))].sort();
  const byYear = {};
  annualRows.forEach((d) => { byYear[d.year] = d; });

  const ctx = document.getElementById("tempChart").getContext("2d");
  chartRegistry.tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: YEARS,
      datasets: [
        {
          label: "Temp anomaly (°C)",
          data: YEARS.map((yr) => byYear[yr]?.tempAnom),
          borderColor: "#E24B4A",
          backgroundColor: "rgba(226,75,74,0.12)",
          fill: true,
          tension: 0.28,
          borderWidth: 2.8,
          pointRadius: 0,
          pointHoverRadius: 5,
          yAxisID: "y1",
        },
        {
          label: "CO₂ (ppm)",
          data: YEARS.map((yr) => byYear[yr]?.co2),
          borderColor: "#378ADD",
          borderDash: [5, 3],
          tension: 0.28,
          borderWidth: 2.4,
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
      plugins: {
        legend: {
          display: false, // custom legend in HTML
        },
        tooltip: {
          callbacks: {
            title: (items) => `Year: ${items[0]?.label}`,
            label: (ctx) => {
              if (ctx.dataset.yAxisID === "y1")
                return ` Temp anomaly: ${ctx.raw?.toFixed(2)}°C`;
              return ` CO₂: ${ctx.raw} ppm`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: themeColor("muted"), font: { size: 11 }, maxTicksLimit: 14 },
          grid:  { color: themeColor("grid") },
        },
        y1: {
          position: "left",
          ticks: { color: "#FB7185", font: { size: 11 }, callback: (v) => v + "°C" },
          grid:  { color: themeColor("grid") },
          title: {
            display: true,
            text: "Temp anomaly (°C)",
            color: "#FB7185",
            font: { size: 11, weight: "bold" },
          },
        },
        y2: {
          position: "right",
          ticks: { color: "#60A5FA", font: { size: 11 }, callback: (v) => v + " ppm" },
          grid:  { drawOnChartArea: false },
          title: {
            display: true,
            text: "CO₂ (ppm)",
            color: "#60A5FA",
            font: { size: 11, weight: "bold" },
          },
        },
      },
    },
  });
}
