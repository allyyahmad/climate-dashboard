/**
 * charts/map.js
 * D3 choropleth world map — country-level disaster impacts
 *
 * Fixes applied:
 *  - "No data in selected filters" tooltip for countries with 0 values
 *  - Reset zoom button overlaid on map (bottom-right corner)
 *  - Cursor changes to pointer on data countries, default on empty ones
 */

"use strict";

const WORLD_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name → our dataset country name mapping
const NAME_MAP = {
  "United States of America": "United States",
  "Russian Federation": "Russia",
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
  "Democratic Republic of the Congo": "Democratic Republic of Congo",
  "Venezuela (Bolivarian Republic of)": "Venezuela",
  "Bolivia (Plurinational State of)": "Bolivia",
  "Iran (Islamic Republic of)": "Iran",
  "Republic of Korea": "South Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Viet Nam": "Vietnam",
  "Syrian Arab Republic": "Syria",
  "Lao People's Democratic Republic": "Laos",
  "Tanzania, United Republic of": "Tanzania",
  "Congo": "Republic of Congo",
  "Côte d'Ivoire": "Cote d'Ivoire",
};

function mapName(raw) {
  return NAME_MAP[raw] || raw;
}

// ─── Choropleth World Map ─────────────────────────────────────────────────────
let worldData = null; // cache fetch

function buildWorldMap(countryRows, metric = "deaths") {
  const container = document.getElementById("worldMap");
  container.innerHTML = `<p style="color:${themeColor("subtle")};font-size:12px;padding:1rem">Loading world map...</p>`;

  // Aggregate
  const countryDeaths = {};
  const countryAffected = {};
  const countryMetric = {};
  countryRows.forEach((d) => {
    countryDeaths[d.country]   = (countryDeaths[d.country]   || 0) + d.deaths;
    countryAffected[d.country] = (countryAffected[d.country] || 0) + d.affected;
    countryMetric[d.country]   = (countryMetric[d.country]   || 0) + d[metric];
  });

  const maxValue = Math.max(...Object.values(countryMetric), 1);
  const colorScale = d3.scaleSequential(
    [0, maxValue],
    metric === "affected" ? d3.interpolateBlues : d3.interpolateReds
  );

  const fetchWorld = worldData
    ? Promise.resolve(worldData)
    : d3.json(WORLD_ATLAS_URL).then((w) => { worldData = w; return w; });

  fetchWorld.then((world) => {
    container.innerHTML = "";

    // ── Reset zoom button ──────────────────────────────────────────────────
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "⟳ Reset zoom";
    resetBtn.style.cssText = `
      position: absolute; bottom: 12px; right: 12px; z-index: 10;
      background: var(--panel-3); border: 1px solid var(--border);
      border-radius: 8px; color: var(--muted); cursor: pointer;
      font-size: 11px; font-weight: 700; padding: 5px 10px;
      transition: border-color 0.15s, color 0.15s;
    `;
    resetBtn.onmouseenter = () => { resetBtn.style.borderColor = "var(--accent)"; resetBtn.style.color = "var(--text)"; };
    resetBtn.onmouseleave = () => { resetBtn.style.borderColor = "var(--border)"; resetBtn.style.color = "var(--muted)"; };
    container.appendChild(resetBtn);

    const W = container.clientWidth || 700;
    const H = Math.round(W * 0.52);

    const svg = d3.select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("width", "100%")
      .style("display", "block");

    // Zoom behaviour
    const zoomBehavior = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoomBehavior);

    // Wire up reset button
    resetBtn.addEventListener("click", () => {
      svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    const g = svg.append("g");

    const projection = d3.geoNaturalEarth1()
      .scale(W / 6.3)
      .translate([W / 2, H / 2]);
    const path = d3.geoPath(projection);

    const countries = topojson.feature(world, world.objects.countries);

    // Graticule
    g.append("path")
      .datum(d3.geoGraticule()())
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", themeColor("grid"))
      .attr("stroke-width", 0.35);

    // Countries
    g.selectAll("path.country")
      .data(countries.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", (d) => {
        const raw    = d.properties?.name || "";
        const mapped = mapName(raw);
        const value  = countryMetric[mapped] || 0;
        return value ? colorScale(value) : themeColor("mapEmpty");
      })
      .attr("stroke", themeColor("pointStroke"))
      .attr("stroke-width", 0.45)
      .style("cursor", (d) => {
        const mapped = mapName(d.properties?.name || "");
        return (countryDeaths[mapped] || countryAffected[mapped]) ? "pointer" : "default";
      })
      .on("mouseover", (event, d) => {
        const raw     = d.properties?.name || "Unknown";
        const mapped  = mapName(raw);
        const deaths  = countryDeaths[mapped] || 0;
        const affected = countryAffected[mapped] || 0;

        const hasData = deaths > 0 || affected > 0;
        const tipContent = hasData
          ? `<strong>${raw}</strong>
             Deaths: ${deaths.toLocaleString()}<br>
             People affected: ${affected.toLocaleString()}`
          : `<strong>${raw}</strong>
             <span style="color:var(--subtle)">No data in selected filters</span>`;

        showTooltip(tipContent, event);
        d3.select(event.currentTarget)
          .attr("stroke", themeColor("accent"))
          .attr("stroke-width", 1.6);
      })
      .on("mousemove", moveTooltip)
      .on("click", (event, d) => {
        const mapped = mapName(d.properties?.name || "");
        if ((countryDeaths[mapped] || countryAffected[mapped]) && window.selectCountry) {
          window.selectCountry(mapped);
        }
      })
      .on("mouseout", (event) => {
        hideTooltip();
        d3.select(event.currentTarget)
          .attr("stroke", themeColor("pointStroke"))
          .attr("stroke-width", 0.45);
      });

    // Country borders mesh
    g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", themeColor("pointStroke"))
      .attr("stroke-width", 0.25);

    // Legend
    const legendEl = document.getElementById("map-legend");
    const thresholds = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxValue));
    legendEl.innerHTML =
      `<span class="legend-item"><span style="font-size:10px;color:${themeColor("subtle")}">${metric === "affected" ? "People affected" : "Deaths"} per country: </span></span>` +
      thresholds.map((t, i) => {
        const next = thresholds[i + 1];
        const label = i === thresholds.length - 1
          ? formatCompact(t) + "+"
          : `${formatCompact(t)}–${formatCompact(next)}`;
        return `<span class="legend-item">
          <span class="legend-swatch" style="background:${colorScale(t)};border:1px solid ${themeColor("border")}"></span>
          ${label}
        </span>`;
      }).join("") +
      `<span class="legend-item" style="margin-left:8px">
        <span class="legend-swatch" style="background:${themeColor("mapEmpty")};border:1px solid ${themeColor("border")}"></span>
        No data
      </span>`;

  }).catch(() => {
    container.innerHTML =
      `<p style="color:#e24b4a;font-size:12px;padding:1rem">
        Map failed to load. Check your internet connection or serve files via a local web server.
      </p>`;
  });
}
