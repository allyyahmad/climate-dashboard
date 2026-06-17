/**
 * script.js — Climate & Disaster Intelligence Dashboard
 * DSC327 Semester Project
 *
 * Responsibilities:
 *  - Load CSV datasets with PapaParse
 *  - Global filter state management
 *  - KPI card updates
 *  - Tab switching
 *  - Coordinate all chart modules
 */

"use strict";

// ─── Global State ────────────────────────────────────────────────────────────
const State = {
  annual: [],       // global annual disaster + climate rows
  typeYear: [],     // annual rows by disaster type
  countries: [],    // country-year impact rows
  filteredAnnual: [],
  filteredTypeYear: [],
  filteredCountries: [],
  activeTab: "overview",
  selectedCountry: null,
};

const CHART_COLORS = {
  Flood:                  "#3B82F6",   // Ocean blue — water/flooding ✓
  Earthquake:             "#92400E",   // Earthy brown — ground rupture (was green, incorrect)
  Wildfire:               "#F59E0B",   // Fire amber — combustion ✓
  Storms:                 "#F43F5E",   // Storm red-pink ✓
  Drought:                "#B45309",   // Dry amber-brown — parched earth (was purple, incorrect)
  "Extreme temperature":  "#F97316",   // Heat orange ✓
  Landslide:              "#94A3B8",   // Slate gray — earth/debris ✓
  "Volcanic activity":    "#9D174D",   // Deep crimson — lava/magma (was cyan, incorrect)
};

// expose globally so chart modules can use
window.CHART_COLORS = CHART_COLORS;
window.State = State;
const DISASTER_TYPES = Object.keys(CHART_COLORS);

const THEME_KEY = "climate-dashboard-theme";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function themeColor(name) {
  const colors = {
    text: cssVar("--text"),
    muted: cssVar("--muted"),
    subtle: cssVar("--subtle"),
    accent: cssVar("--accent"),
    border: cssVar("--border"),
    grid: cssVar("--grid"),
    panel: cssVar("--panel"),
    tooltipBg: cssVar("--tooltip-bg"),
    tooltipBorder: cssVar("--tooltip-border"),
    tooltipText: cssVar("--tooltip-text"),
    tooltipBody: cssVar("--tooltip-body"),
    mapEmpty: cssVar("--map-empty"),
    pointStroke: cssVar("--point-stroke"),
  };
  return colors[name] || colors.text;
}

window.themeColor = themeColor;

function applyChartThemeDefaults() {
  if (!window.Chart) return;
  Chart.defaults.color = themeColor("muted");
  Chart.defaults.font.family = "Inter, Segoe UI, system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = themeColor("tooltipBg");
  Chart.defaults.plugins.tooltip.borderColor = themeColor("tooltipBorder");
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.titleColor = themeColor("tooltipText");
  Chart.defaults.plugins.tooltip.bodyColor = themeColor("tooltipBody");
}

function setTheme(mode, shouldRender = false) {
  const theme = mode === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  applyChartThemeDefaults();

  const toggle = document.getElementById("theme-toggle");
  const label = document.getElementById("theme-label");
  const icon = document.getElementById("theme-icon");
  if (toggle && label && icon) {
    const next = theme === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", `Switch to ${next} theme`);
    label.textContent = theme === "dark" ? "Dark" : "Light";
    icon.textContent = theme === "dark" ? "☾" : "☀";
  }

  if (shouldRender && State.annual.length) renderActiveTab();
}

setTheme(localStorage.getItem(THEME_KEY) || document.documentElement.dataset.theme || "dark");

// ─── Tooltip helper ──────────────────────────────────────────────────────────
const tooltip = document.getElementById("tooltip");
window.showTooltip = function (html, event) {
  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  tooltip.removeAttribute("aria-hidden");
  moveTooltip(event);
};
window.moveTooltip = function (event) {
  const x = event.clientX + 14;
  const y = event.clientY - 28;
  tooltip.style.left = Math.min(x, window.innerWidth - 220) + "px";
  tooltip.style.top  = Math.max(y, 8) + "px";
};
window.hideTooltip = function () {
  tooltip.style.display = "none";
  tooltip.setAttribute("aria-hidden", "true");
};

// ─── Load Data ───────────────────────────────────────────────────────────────
async function loadData() {
  setBadge("Loading real datasets...", "#38bdf8");

  const embedded = window.REAL_DATA;
  const [annualResult, typeResult, countryResult] = embedded
    ? [embedded.annual, embedded.typeYear, embedded.countries]
    : await Promise.all([
      parseCsv("data/processed/real_global_annual.csv"),
      parseCsv("data/processed/real_global_disaster_type_year.csv"),
      parseCsv("data/processed/real_country_year_impacts.csv"),
    ]);

  State.annual = annualResult.map(coerceAnnual);
  State.typeYear = typeResult.map(coerceTypeYear);
  State.countries = countryResult.map(coerceCountryImpact);

  if (!State.annual.length || !State.typeYear.length || !State.countries.length) {
    throw new Error("One or more real-data tables loaded empty.");
  }

  populateYearSelect();
  populateCountrySelect();
  populateTypeFilter();
  applyFilters();
  setBadge(
    `${State.annual.length} years of real data loaded`,
    "#4ade80"
  );
}

function parseCsv(path) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out loading ${path}. Use a local server or ensure data files exist.`));
    }, 8000);

    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        clearTimeout(timer);
        if (r.errors?.length) {
          reject(new Error(`Failed to parse ${path}: ${r.errors[0].message}`));
          return;
        }
        resolve(r.data);
      },
      error: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });
  });
}

function coerceAnnual(d) {
  return {
    year: +d.Year,
    events: +d.Total_Disaster_Events || 0,
    deaths: +d.Total_Deaths || 0,
    affected: +d.Total_Affected || 0,
    damageUsd: +d.Economic_Damage_USD || 0,
    tempAnom: +d.Temp_Anomaly_C || null,
    co2: +d.CO2_ppm || null,
  };
}

function coerceTypeYear(d) {
  return {
    year: +d.Year,
    type: d.Disaster_Type,
    events: +d.Event_Count || 0,
    deaths: +d.Total_Deaths || 0,
    affected: +d.Total_Affected || 0,
    damageUsd: +d.Economic_Damage_USD || 0,
  };
}

function coerceCountryImpact(d) {
  return {
    country: d.Entity,
    code: d.Code,
    year: +d.Year,
    deaths: +d.Total_Deaths || 0,
    affected: +d.Total_Affected || 0,
  };
}

// ─── Year Range Select Population ────────────────────────────────────────────
function populateYearSelect() {
  const wrap = document.getElementById("year-checklist");
  const years = [...new Set(State.annual.map((d) => d.year))].sort();
  wrap.innerHTML = years.map((yr) => `
    <label class="multi-option">
      <input type="checkbox" value="${yr}" checked />
      <span>${yr}</span>
    </label>
  `).join("");
}

function populateCountrySelect() {
  const sel = document.getElementById("sel-country");
  const countries = [...new Set(State.countries.map((d) => d.country).filter(Boolean))].sort();
  countries.forEach((country) => {
    const opt = document.createElement("option");
    opt.value = country;
    opt.textContent = country;
    sel.appendChild(opt);
  });
}

function populateTypeFilter() {
  const wrap = document.getElementById("type-checklist");
  wrap.innerHTML = DISASTER_TYPES.map((type) => `
    <label class="multi-option" style="--chip-color:${CHART_COLORS[type]}">
      <input type="checkbox" value="${type}" checked />
      <span class="type-dot" style="background:${CHART_COLORS[type]}"></span>
      <span>${type}</span>
    </label>
  `).join("");
}

function selectedTypes() {
  const checked = [...document.querySelectorAll("#type-checklist input:checked")]
    .map((input) => input.value);
  if (checked.length === 0) return ["__NO_TYPES__"];
  return checked.length === DISASTER_TYPES.length ? [] : checked;
}

function selectedYears() {
  const allYears = [...new Set(State.annual.map((d) => d.year))].sort((a, b) => a - b);
  const checked = [...document.querySelectorAll("#year-checklist input:checked")]
    .map((input) => +input.value)
    .sort((a, b) => a - b);
  if (checked.length === 0) return ["__NO_YEARS__"];
  return checked.length === allYears.length ? [] : checked;
}

function formatSelectionLabel(values, allLabel, emptyLabel, suffix) {
  if (!values.length) return allLabel;
  if (values[0] === "__NO_TYPES__" || values[0] === "__NO_YEARS__") return emptyLabel;
  if (values.length === 1) return String(values[0]);
  if (values.length <= 3) return values.join(", ");
  const numeric = values.every((v) => Number.isFinite(+v));
  if (numeric) {
    const nums = values.map(Number).sort((a, b) => a - b);
    const contiguous = nums.every((v, i) => i === 0 || v === nums[i - 1] + 1);
    if (contiguous) return `${nums[0]}-${nums[nums.length - 1]}`;
  }
  return `${values.length} ${suffix}`;
}

function updateMultiSelectLabels() {
  const typeValues = selectedTypes();
  const yearValues = selectedYears();
  document.getElementById("type-menu-label").textContent =
    formatSelectionLabel(typeValues, "All Types", "No Types", "types");
  document.getElementById("year-menu-label").textContent =
    formatSelectionLabel(yearValues, "All Years", "No Years", "years");
}

function applyYearPreset(preset) {
  const inputs = [...document.querySelectorAll("#year-checklist input")];
  const years = inputs.map((input) => +input.value);
  const maxYear = Math.max(...years);

  inputs.forEach((input) => {
    const year = +input.value;
    if (preset === "all") input.checked = true;
    else if (preset === "last10") input.checked = year >= maxYear - 9 && year <= maxYear;
    else {
      const start = +preset;
      input.checked = year >= start && year <= start + 9;
    }
  });

  applyFilters();
}

// ─── Filters ─────────────────────────────────────────────────────────────────
function getFilterValues() {
  return {
    metric:   document.getElementById("sel-metric").value,
    types:    selectedTypes(),
    years:    selectedYears(),
    severity: +document.getElementById("sel-severity").value,
    country:  document.getElementById("sel-country").value,
  };
}

function applyFilters() {
  const f = getFilterValues();
  const inYearScope = (year) => {
    if (f.years.includes("__NO_YEARS__")) return false;
    if (f.years.length && !f.years.includes(year)) return false;
    return true;
  };

  State.filteredAnnual = State.annual.filter((d) => {
    if (!inYearScope(d.year)) return false;
    return true;
  });

  State.filteredTypeYear = State.typeYear.filter((d) => {
    if (f.types.length && !f.types.includes(d.type)) return false;
    if (!inYearScope(d.year)) return false;
    if (f.severity > 0 && d.deaths < f.severity) return false;
    return true;
  });

  State.filteredCountries = State.countries.filter((d) => {
    if (!inYearScope(d.year)) return false;
    if (f.severity > 0 && d.deaths < f.severity) return false;
    if (f.country !== "all" && d.country !== f.country) return false;
    return true;
  });

  State.selectedCountry = f.country !== "all" ? f.country : State.selectedCountry;

  syncSelectedCountry();

  updateMultiSelectLabels();
  updateKPIs();
  updateInsights();
  updateFilterChips();
  renderActiveTab();
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────
function updateKPIs() {
  const f = getFilterValues();
  const typeRows = State.filteredTypeYear;
  const annualRows = State.filteredAnnual;

  const totalDisasters = typeRows.reduce((s, d) => s + d.events, 0);
  const totalDeaths = typeRows.reduce((s, d) => s + d.deaths, 0);
  const totalAffected = typeRows.reduce((s, d) => s + d.affected, 0);
  const totalDamage = typeRows.reduce((s, d) => s + d.damageUsd, 0);

  const countryMetric = f.metric === "affected" ? "affected" : "deaths";
  const countryMap = {};
  State.filteredCountries.forEach((d) => {
    countryMap[d.country] = (countryMap[d.country] || 0) + d[countryMetric];
  });
  const topCountry = topKey(countryMap);

  const typeMap = {};
  typeRows.forEach((d) => { typeMap[d.type] = (typeMap[d.type] || 0) + d.events; });
  const topType = topKey(typeMap);

  setKPI("kpi-disasters", totalDisasters.toLocaleString(), annualRows.length === 1 ? "events in selected year" : "events");
  setKPI("kpi-deaths", formatCompact(totalDeaths), "confirmed deaths + missing");
  setKPI("kpi-affected", formatCompact(totalAffected), "people affected");
  setKPI("kpi-damage", formatMoney(totalDamage), "not inflation-adjusted");
  setKPI("kpi-country", topCountry || "-", topCountry ? `${formatCompact(countryMap[topCountry])} ${countryMetric}` : "");
  setKPI("kpi-type", topType || "-", topType ? `${typeMap[topType].toLocaleString()} events` : "");
}

function setKPI(id, value, sub) {
  const card = document.getElementById(id);
  card.querySelector(".kpi-value").textContent = value;
  card.querySelector(".kpi-sub").textContent   = sub;
}

function topKey(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function formatCompact(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatMoney(value) {
  const billions = (value || 0) / 1e9;
  if (billions >= 1000) return "$" + (billions / 1000).toFixed(1) + "T";
  return "$" + billions.toFixed(billions >= 10 ? 0 : 1) + "B";
}

function currentMetric() {
  return getFilterValues().metric === "affected" ? "affected" : "deaths";
}

function updateFilterChips() {
  const wrap = document.getElementById("active-filters");
  if (!wrap) return;
  const f = getFilterValues();

  // Helper to render a chip with a specific category class
  function chip(text, category) {
    return `<span class="filter-chip filter-chip-${category}">${text}</span>`;
  }

  const parts = [];
  parts.push(chip(`📊 ${f.metric === "affected" ? "People affected" : "Deaths"}`, "metric"));

  if (f.types.includes("__NO_TYPES__")) {
    parts.push(chip("⚠ No types selected", "severity"));
  } else if (f.types.length) {
    parts.push(chip(`⚡ Types: ${formatSelectionLabel(f.types, "All Types", "No Types", "types")}`, "type"));
  }

  if (f.years.includes("__NO_YEARS__")) {
    parts.push(chip("⚠ No years selected", "severity"));
  } else if (f.years.length) {
    parts.push(chip(`📅 Years: ${formatSelectionLabel(f.years, "All Years", "No Years", "years")}`, "year"));
  }

  if (f.severity > 0) {
    parts.push(chip(`💀 Deaths ≥ ${f.severity.toLocaleString()}`, "severity"));
  }
  if (f.country !== "all") {
    parts.push(chip(`📍 ${f.country}`, "country"));
  }

  wrap.innerHTML = parts.join("");
}

function updateInsights() {
  const grid = document.getElementById("insight-grid");
  if (!grid) return;

  const annualRows = State.filteredAnnual;
  const typeRows = State.filteredTypeYear;
  const countryRows = State.filteredCountries;
  const metric = currentMetric();

  const typeEvents = {};
  const typeDamage = {};
  typeRows.forEach((d) => {
    typeEvents[d.type] = (typeEvents[d.type] || 0) + d.events;
    typeDamage[d.type] = (typeDamage[d.type] || 0) + d.damageUsd;
  });

  const topEventType = topKey(typeEvents) || "-";
  const topDamageType = topKey(typeDamage) || "-";
  const firstYear = annualRows[0]?.year;
  const lastYear = annualRows[annualRows.length - 1]?.year;
  const firstEvents = annualRows[0]?.events || 0;
  const lastEvents = annualRows[annualRows.length - 1]?.events || 0;
  const eventShift = firstYear === lastYear
    ? `${lastEvents.toLocaleString()} reported events`
    : `${firstEvents.toLocaleString()} to ${lastEvents.toLocaleString()} events`;

  const countryTotals = {};
  countryRows.forEach((d) => {
    countryTotals[d.country] = (countryTotals[d.country] || 0) + d[metric];
  });
  const topCountry = topKey(countryTotals) || "-";

  const correlation = annualRows.length > 2
    ? pearson(
      annualRows.map((d) => d.co2).filter((v) => v !== null),
      annualRows.filter((d) => d.co2 !== null).map((d) => d.events)
    )
    : null;

  const cards = [
    {
      label: "Event Pattern",
      title: topEventType,
      body: `Highest reported event total in the current selection. Period movement: ${eventShift}.`,
    },
    {
      label: "Economic Impact",
      title: topDamageType,
      body: `${formatMoney(typeDamage[topDamageType] || 0)} reported damage in current USD.`,
    },
    {
      label: "Country Focus",
      title: topCountry,
      body: `${formatCompact(countryTotals[topCountry] || 0)} ${metric === "affected" ? "people affected" : "deaths"} in the selected view.`,
    },
    {
      label: "Climate Signal",
      title: correlation === null ? "Exploratory" : `CO2 r=${correlation.toFixed(2)}`,
      body: "Correlation is descriptive and should not be interpreted as direct causation.",
    },
  ];

  grid.innerHTML = cards.map((card) => `
    <div class="insight-card">
      <span class="insight-label">${card.label}</span>
      <strong>${card.title}</strong>
      <p>${card.body}</p>
    </div>
  `).join("");
}

function pearson(xs, ys) {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const avgX = xs.reduce((sum, v) => sum + v, 0) / xs.length;
  const avgY = ys.reduce((sum, v) => sum + v, 0) / ys.length;
  const numerator = xs.reduce((sum, x, i) => sum + ((x - avgX) * (ys[i] - avgY)), 0);
  const denomX = Math.sqrt(xs.reduce((sum, x) => sum + ((x - avgX) ** 2), 0));
  const denomY = Math.sqrt(ys.reduce((sum, y) => sum + ((y - avgY) ** 2), 0));
  return denomX && denomY ? numerator / (denomX * denomY) : 0;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function renderActiveTab() {
  const tab = State.activeTab;
  if      (tab === "overview")     renderOverview();
  else if (tab === "trends")       renderTrends();
  else if (tab === "correlation")  renderCorrelation();
  else if (tab === "geographic")   renderGeographic();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const tabName = btn.dataset.tab;
    document.getElementById("tab-" + tabName).classList.add("active");
    State.activeTab = tabName;
    renderActiveTab();
  });
});

// ─── Tab render dispatchers ───────────────────────────────────────────────────
function renderOverview() {
  buildLineChart(State.filteredTypeYear);
  buildDonutChart(State.filteredTypeYear);
  buildBarChart(State.filteredCountries, currentMetric());
  buildDeathsChart(State.filteredTypeYear);
}

function renderTrends() {
  buildTempChart(State.filteredAnnual);
  buildEconChart(State.filteredTypeYear);
  buildAffectedEventChart(State.filteredAnnual, State.filteredTypeYear);
  buildDamageTrendChart(State.filteredTypeYear);
}

function renderCorrelation() {
  buildScatterChart(State.filteredAnnual);
  buildHeatmap(State.filteredTypeYear);
  buildCo2Scatter(State.filteredAnnual);
  buildBubbleChart(State.filteredAnnual);
}

function renderGeographic() {
  buildWorldMap(State.filteredCountries, currentMetric());
  buildCountryImpactChart(State.filteredCountries, currentMetric());
  buildCountryDrilldown(State.countries, State.selectedCountry);
}

function syncSelectedCountry() {
  if (State.selectedCountry) return;
  const metric = currentMetric();
  const totals = {};
  State.filteredCountries.forEach((d) => {
    totals[d.country] = (totals[d.country] || 0) + d[metric];
  });
  State.selectedCountry = topKey(totals) || "Bangladesh";
}

window.selectCountry = function (country) {
  State.selectedCountry = country;
  if (State.activeTab === "geographic") {
    buildCountryImpactChart(State.filteredCountries, currentMetric());
    buildCountryDrilldown(State.countries, State.selectedCountry);
  }
};

// ─── Filter event listeners ───────────────────────────────────────────────────
["sel-metric", "sel-severity", "sel-country"].forEach((id) => {
  document.getElementById(id).addEventListener("change", applyFilters);
});

["type-checklist", "year-checklist"].forEach((id) => {
  document.getElementById(id).addEventListener("change", applyFilters);
});

document.querySelectorAll(".multi-select-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const menu = document.getElementById(btn.id.replace("-btn", ""));
    const willOpen = menu.hidden;
    document.querySelectorAll(".multi-select-menu").forEach((el) => { el.hidden = true; });
    document.querySelectorAll(".multi-select-btn").forEach((el) => el.setAttribute("aria-expanded", "false"));
    menu.hidden = !willOpen;
    btn.setAttribute("aria-expanded", String(willOpen));
  });
});

document.querySelectorAll(".multi-menu-actions button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const checked = btn.dataset.action === "all";
    document.querySelectorAll(`#${btn.dataset.target} input`).forEach((input) => { input.checked = checked; });
    applyFilters();
  });
});

document.querySelectorAll("[data-year-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyYearPreset(btn.dataset.yearPreset);
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".multi-filter")) return;
  document.querySelectorAll(".multi-select-menu").forEach((el) => { el.hidden = true; });
  document.querySelectorAll(".multi-select-btn").forEach((el) => el.setAttribute("aria-expanded", "false"));
});

document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("sel-metric").value   = "deaths";
  document.getElementById("sel-severity").value = "0";
  document.getElementById("sel-country").value = "all";
  document.querySelectorAll("#type-checklist input").forEach((input) => { input.checked = true; });
  document.querySelectorAll("#year-checklist input").forEach((input) => { input.checked = true; });
  State.selectedCountry = null;
  applyFilters();
});

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  setTheme(current === "dark" ? "light" : "dark", true);
});

// ─── Badge helper ─────────────────────────────────────────────────────────────
function setBadge(text, color) {
  const b = document.getElementById("data-badge");
  b.textContent  = text;
  b.style.color  = color;
  b.style.borderColor = color + "44";
}

// ─── Boot ────────────────────────────────────────────────────────────────────
loadData().catch((err) => {
  console.error("Data load failed:", err);
  setBadge("Data load error - see console", "#e24b4a");
  document.querySelector(".main-content")?.insertAdjacentHTML(
    "afterbegin",
    `<div class="error-banner">
      <strong>Data could not be loaded.</strong>
      Refresh the page. If you opened this file directly, use <code>python3 -m http.server 8080</code> from the project folder and open <code>http://localhost:8080</code>.
    </div>`
  );
});
