# 🌍 Climate Change & Natural Disaster Intelligence Dashboard
### DSC327 – Data Visualization Techniques · Semester Project

---

## Project Overview

A fully interactive web dashboard built with **D3.js** and **Chart.js** that visualizes relationships between real-world climate indicators and reported natural disaster impacts worldwide (1980-2024).

> Dataset update: the dashboard now uses real-world processed CSVs generated from EM-DAT/Our World in Data, NASA GISTEMP, and NOAA GML. Raw source files, URLs, limitations, and citations are documented in `data/SOURCES.md`.

---

## Folder Structure

```
climate-dashboard/
│
├── index.html              ← Main dashboard webpage
├── style.css               ← Responsive light/dark theme and dashboard styles
├── script.js               ← Data loading, filtering, KPI logic, tab control
│
├── charts/
│   ├── map.js              ← D3 choropleth world map
│   ├── linechart.js        ← D3 event trend, deaths heatmap + Chart.js donut
│   ├── heatmap.js          ← D3 disaster-type frequency heatmap
│   ├── scatterplot.js      ← Climate/disaster comparison, CO₂ scatter, bubble + temp/CO₂ trend
│   └── barchart.js         ← D3 top-country bar, country drilldown + economic/impact trend charts
│
├── data/
│   ├── raw/                ← Downloaded real source CSVs
│   ├── processed/          ← Cleaned dashboard-ready real datasets
│   │   └── preprocessing_summary.json ← Row counts, missing values, steps, limitations
│   ├── build_real_datasets.py ← Builds processed real-data CSVs
│   └── SOURCES.md          ← Source URLs, citations, and limitations
│
├── notebook/
│   ├── Climate_Disaster_EDA.ipynb  ← Full Jupyter notebook (EDA + preprocessing + plots)
│   └── build_notebook.py           ← Script that builds the .ipynb file
│
└── README.md
```

---

## Real Datasets

### processed/real_global_annual.csv (45 rows)
Annual global metrics from 1980-2024:
Year, reported disaster events, deaths, people affected, economic damage, NASA temperature anomaly, and NOAA CO2.

### processed/real_global_disaster_type_year.csv (360 rows)
Annual metrics by disaster type:
Drought, Earthquake, Extreme temperature, Storms, Flood, Landslide, Volcanic activity, and Wildfire.

### processed/real_country_year_impacts.csv (4,755 rows)
Country-year impact metrics:
country, ISO code, year, total deaths, and total affected.

Full source citations and limitations are in `data/SOURCES.md`.

### processed/preprocessing_summary.json
Machine-readable preprocessing evidence:
row counts, column counts, missing-cell counts, duplicate-row counts, removed aggregate entities, preprocessing steps, and known limitations.

---

## Visualizations

| Tab | Charts |
|-----|--------|
| **Overview** | Event trend by type, multi-select year filtering, type distribution, top impacted countries, deaths heatmap |
| **Climate Trends** | Dual-axis temperature/CO2 line, economic damage ranking by type, affected population vs reported events, selected damage trend |
| **Correlation** | Decade climate/disaster comparison, disaster type heatmap, CO2 vs disasters, temp/damage/deaths bubble |
| **Geographic** | D3 country choropleth, top country impact ranking, country drilldown panel |

---

## Interactions
- **Filter** by map metric, multi-select colored disaster types, multi-select years, minimum deaths threshold, and country dropdown
- **Year presets** for All, decades, and Last 10 years speed up period comparison without cluttering the chart area
- **Year filters** update the full dashboard period
- **All charts update dynamically** on filter change
- **Tooltips** on every chart and map element
- **Zoom & Pan** on the D3 world map
- **Country drilldown** from map or ranking clicks shows country-specific deaths and affected-population trends
- **Light/Dark theme toggle** keeps charts, axes, labels, and tooltips readable in both modes
- **Reset** button clears all filters instantly

---

## How to Run

### Option 1 — Python local server (recommended)
```bash
cd climate-dashboard
python3 -m http.server 8080
# Open: http://localhost:8080
```

### Option 2 — VS Code Live Server
Install the **Live Server** extension → right-click `index.html` → *Open with Live Server*

### Option 3 — Node.js
```bash
npx serve .
```

> Recommended: use a local server. The dashboard also includes `data/processed/real_data.js` so the main charts can load without CSV fetches, but the D3 world map still needs internet access for the TopoJSON world atlas.

---

## Regenerating the Real Processed Dataset
```bash
python3 data/build_real_datasets.py
```

---

## Running the Jupyter Notebook
```bash
pip install pandas numpy matplotlib seaborn jupyter --break-system-packages
python3 notebook/build_notebook.py
jupyter notebook notebook/Climate_Disaster_EDA.ipynb
```

The notebook covers:
1. Real dataset loading and inspection
2. Missing value and duplicate checks
3. Preprocessing summary for the real-data build script
4. EDA plots for event frequency, deaths, economic damage, and country impacts
5. Climate trend analysis using NASA temperature anomaly and NOAA CO2
6. Correlation matrix heatmap
7. Scatter and bubble plots for climate indicators and reported disasters
8. Visualization design notes covering marks, channels, and interactions
9. Key findings and data limitations

---

## Technologies
- **D3.js v7** — World map, heatmaps, main event trend, top-country ranking, economic ranking, zoom/pan, SVG interactions
- **Chart.js v4** — Donut, climate comparison, scatter, bubble, and supporting trend charts
- **PapaParse** — CSV parsing in-browser
- **TopoJSON** — World atlas geometry
- **Python** — Dataset generation (NumPy, Pandas)
- **Jupyter** — EDA notebook (Matplotlib, Seaborn)

---

## Deployment (GitHub Pages)
```bash
git init
git add .
git commit -m "Initial commit — DSC327 Climate Dashboard"
git remote add origin https://github.com/YOUR_USERNAME/climate-disaster-dashboard.git
git push -u origin main
# Enable GitHub Pages → Settings → Pages → Branch: main
```
Live URL: `https://YOUR_USERNAME.github.io/climate-disaster-dashboard/`

Replace the placeholder above with the actual GitHub Pages URL after publishing the repository.

---

## Key Analytical Findings From Real Data
- Reported natural disaster events increased from 123 in 1980 to 443 in 2024.
- NASA global temperature anomaly increased from 0.26°C in 1980 to 1.29°C in 2024.
- NOAA global CO2 increased from 338.91 ppm in 1980 to 422.79 ppm in 2024.
- Floods are the most frequently reported disaster category in the selected period.
- Storms account for the highest reported economic damage in the selected period.
- Correlation charts are exploratory and should not be presented as proof of causation.
