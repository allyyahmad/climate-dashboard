# Climate Change & Natural Disaster Intelligence Dashboard

**Course:** DSC327 - Data Visualization Techniques  
**Project Type:** Semester Project  
**CLO Mapping:** CLO 5 - Develop web-based system using interactive visualization techniques and libraries  
**Students:** [Student 1 Name] and [Student 2 Name]  
**Instructor:** [Instructor Name]  
**Submission Date:** [Submission Date]  
**Hosted Dashboard URL:** [Add GitHub Pages / hosted URL here]  
**Repository URL:** [Add GitHub repository URL here]

---

## Abstract

This project presents an interactive web-based visualization system for analyzing the relationship between climate indicators and reported natural disaster impacts from 1980 to 2024. The dashboard combines real-world disaster data from EM-DAT/CRED via Our World in Data with global climate indicators from NASA GISTEMP and NOAA Global Monitoring Laboratory. The system uses D3.js and Chart.js to visualize disaster frequency, mortality, affected population, economic damage, country-level impacts, global temperature anomaly, and atmospheric carbon dioxide concentration.

The dashboard supports user interaction through multi-select year filtering, decade presets, disaster-type filtering, country selection, impact metric switching, tooltips, zoomable choropleth mapping, dynamic KPIs, and country drilldown panels. The goal is to provide a clear, interactive, and analytically meaningful system that demonstrates practical application of visualization principles, marks and channels, preprocessing, exploratory data analysis, and web-based implementation.

> **Image Slot 1 - Final Dashboard Overview Screenshot**  
> Add screenshot of the full dashboard overview tab here.  
> `![Dashboard Overview](images/dashboard-overview.png)`

---

## 1. Introduction

Natural disasters affect millions of people every year through loss of life, displacement, infrastructure damage, and economic loss. At the same time, global climate indicators such as temperature anomaly and atmospheric carbon dioxide concentration have changed significantly over recent decades. This project was developed to explore these patterns using interactive visualization techniques.

The main objective of the system is not to prove direct causation between climate change and natural disasters. Instead, the system provides an exploratory visual analytics environment where users can observe trends, compare disaster categories, inspect country-level impacts, and understand how climate signals and disaster metrics have changed over time.

The project aligns with the course learning objective by requiring the design and development of a complete web-based visualization system using interactive visualization libraries. The system emphasizes meaningful visual encoding, user-centered interaction, real dataset usage, preprocessing, and clear presentation of insights.

---

## 2. Project Objectives

The major objectives of this project are:

1. To develop a fully functional web-based data visualization dashboard.
2. To use D3.js for interactive visualizations such as line charts, heatmaps, choropleth maps, and horizontal bar rankings.
3. To integrate multiple real-world datasets into a clean and consistent dashboard-ready format.
4. To apply visualization design principles such as effective use of marks, channels, color, position, and scale.
5. To provide interactive filtering, tooltips, dynamic updates, and country-level drilldown.
6. To communicate disaster and climate insights clearly through well-formatted visual components.
7. To prepare a system suitable for final presentation, viva, and portfolio demonstration.

---

## 3. Dataset Overview

The project uses real-world datasets rather than synthetic data. The final dashboard is built from three major source categories:

| Data Category | Source | Purpose |
|---|---|---|
| Disaster events and impacts | EM-DAT/CRED via Our World in Data | Reported disaster events, deaths, affected population, and economic damage |
| Temperature anomaly | NASA GISTEMP v4 | Annual global land-ocean temperature anomaly |
| Carbon dioxide concentration | NOAA Global Monitoring Laboratory | Annual global mean atmospheric CO2 concentration |

The selected time period is **1980 to 2024**. This range was selected because it provides a multi-decade view while maintaining consistency across disaster and climate datasets.

### 3.1 Processed Dashboard Tables

The raw datasets were cleaned and transformed into three dashboard-ready processed tables:

| Processed File | Rows | Description |
|---|---:|---|
| `data/processed/real_global_annual.csv` | 45 | One row per year containing global disaster totals and climate indicators |
| `data/processed/real_global_disaster_type_year.csv` | 360 | One row per year and disaster type |
| `data/processed/real_country_year_impacts.csv` | 4,755 | One row per country and year containing deaths and affected population |

The preprocessing script also generates:

| File | Purpose |
|---|---|
| `data/processed/real_data.js` | Browser-ready embedded dataset for reliable loading |
| `data/processed/preprocessing_summary.json` | Machine-readable preprocessing evidence for report and viva |

> **Image Slot 2 - Dataset Structure Diagram**  
> Add a simple diagram showing raw files transformed into the three processed dashboard tables.  
> `![Dataset Pipeline](images/dataset-pipeline.png)`

---

## 4. Data Sources and Citations

### 4.1 EM-DAT / Our World in Data

The disaster data is obtained from EM-DAT/CRED through Our World in Data graphers. It includes reported disaster events, deaths, people affected, and economic damage.

Source files used:

- `owid_natural_disaster_events.csv`
- `owid_natural_disaster_deaths.csv`
- `owid_natural_disaster_affected.csv`
- `owid_natural_disaster_damage.csv`

Citation to include:

EM-DAT, CRED / UCLouvain, with major processing by Our World in Data. Dataset pages for reported natural disaster events, disaster deaths, people affected, and economic damage. Original data from EM-DAT, The International Disasters Database.

### 4.2 NASA GISTEMP

NASA GISTEMP v4 is used for annual global land-ocean temperature anomaly.

Citation to include:

GISTEMP Team. GISS Surface Temperature Analysis, version 4. NASA Goddard Institute for Space Studies.

### 4.3 NOAA Global Monitoring Laboratory

NOAA GML is used for annual global mean atmospheric carbon dioxide concentration.

Citation to include:

NOAA Global Monitoring Laboratory. Globally averaged marine surface annual mean carbon dioxide data.

Full URLs and limitations are documented in:

`data/SOURCES.md`

---

## 5. Data Preprocessing

Data preprocessing was performed using the Python script:

`data/build_real_datasets.py`

The purpose of preprocessing was to transform multiple raw data files into clean, consistent, dashboard-ready tables.

### 5.1 Preprocessing Steps

The following preprocessing steps were applied:

1. Loaded raw OWID/EM-DAT CSV files for disaster events, deaths, people affected, and economic damage.
2. Loaded NASA GISTEMP annual global temperature anomaly data.
3. Loaded NOAA annual global CO2 data.
4. Converted numeric fields from strings into numeric values.
5. Converted blank, missing, and masked values into valid numeric values where appropriate.
6. Filtered the dataset to the period 1980-2024.
7. Joined global annual disaster totals with annual climate indicators by year.
8. Reshaped disaster category columns into a year-by-type format.
9. Removed aggregate entities from the country-level dataset, including `World`, continents, and income groups.
10. Exported clean CSV files for the dashboard.
11. Exported a browser-ready JavaScript data bundle.
12. Generated a preprocessing summary JSON file for documentation and viva evidence.

### 5.2 Removed Aggregate Entities

The following aggregate entities were removed from the country-level table to avoid double counting and misleading country rankings:

- World
- Africa
- Asia
- Europe
- North America
- South America
- Oceania
- European Union (27)
- High-income countries
- Low-income countries
- Lower-middle-income countries
- Upper-middle-income countries

### 5.3 Data Quality Summary

The generated preprocessing summary reports:

| Table | Rows | Missing Cells | Duplicate Rows |
|---|---:|---:|---:|
| `real_global_annual.csv` | 45 | 0 | 0 |
| `real_global_disaster_type_year.csv` | 360 | 0 | 0 |
| `real_country_year_impacts.csv` | 4,755 | 0 | 0 |

This confirms that the final processed dashboard data is complete for the selected fields and period.

> **Image Slot 3 - Preprocessing Summary Screenshot**  
> Add screenshot of `preprocessing_summary.json` or a table created from it.  
> `![Preprocessing Summary](images/preprocessing-summary.png)`

---

## 6. Exploratory Data Analysis

EDA was documented in the Jupyter notebook:

`notebook/Climate_Disaster_EDA.ipynb`

The EDA process helped identify major trends, dominant disaster types, country-level impact patterns, and relationships between annual climate indicators and disaster metrics.

### 6.1 Event Frequency Trend

Reported natural disaster events increased over the selected period. The processed annual dataset shows reported events rising from **123 in 1980** to **443 in 2024**.

This trend is useful for understanding long-term changes in reported disaster occurrence, although it should be interpreted carefully because reporting quality and disaster recording practices may have improved over time.

> **Image Slot 4 - EDA Event Trend Plot**  
> Add plot from notebook showing reported disaster events from 1980-2024.  
> `![EDA Event Trend](images/eda-event-trend.png)`

### 6.2 Disaster Type Distribution

Floods are the most frequently reported disaster category in the selected period. Storms also represent a major share of reported events and economic losses.

> **Image Slot 5 - EDA Disaster Type Totals**  
> Add notebook plot showing total reported events by disaster type.  
> `![Disaster Type Totals](images/disaster-type-totals.png)`

### 6.3 Country-Level Impact

Country-level analysis shows that some countries experience very high mortality or affected-population totals due to large historical disaster events. The dashboard allows users to inspect these country-level patterns through choropleth mapping, ranking charts, and drilldown panels.

> **Image Slot 6 - EDA Top Countries Plot**  
> Add notebook plot showing top countries by deaths or affected population.  
> `![Top Country Impacts](images/top-country-impacts.png)`

### 6.4 Climate Indicator Trends

NASA GISTEMP and NOAA GML data show increases in global temperature anomaly and CO2 concentration over the selected period. The dashboard presents these signals together using a dual-axis trend chart.

> **Image Slot 7 - EDA Climate Trend Plot**  
> Add notebook plot showing temperature anomaly and CO2 trend.  
> `![Climate Trends](images/climate-trends.png)`

### 6.5 Correlation Analysis

Correlation analysis was included as an exploratory step. The dashboard includes correlation-style views, but all such views are clearly labeled as exploratory and not causal.

Important interpretation:

Correlation does not prove that temperature anomaly or CO2 directly caused disaster counts, deaths, or damages. Disaster reporting, exposure, population growth, infrastructure, preparedness, and economic development also influence disaster impacts.

> **Image Slot 8 - Correlation Matrix Heatmap**  
> Add notebook correlation matrix heatmap.  
> `![Correlation Matrix](images/correlation-matrix.png)`

---

## 7. Dashboard Design and Visualizations

The dashboard is organized into four major tabs:

1. Global Overview
2. Climate Signals
3. Impact & Correlation
4. Country Explorer

The layout uses a dark/light theme system, consistent spacing, clear card-based chart containers, and color encodings that remain readable in both themes.

### 7.1 Global Overview Tab

The Global Overview tab provides a high-level summary of disaster patterns.

Visualizations included:

- Reported disaster events by type
- Event distribution by disaster type
- Top 10 countries by selected impact metric
- Deaths heatmap by disaster type and 5-year bands

#### Reported Disaster Events by Type

This D3 line chart shows yearly disaster event counts by disaster type.

| Design Element | Explanation |
|---|---|
| Mark | Line and point |
| X-axis | Year |
| Y-axis | Reported event count |
| Color channel | Disaster type |
| Interaction | Hover tooltip |

This chart helps users compare long-term event patterns across disaster categories.

> **Image Slot 9 - Global Overview Tab**  
> Add screenshot of the Global Overview tab.  
> `![Global Overview](images/global-overview.png)`

#### Event Distribution by Type

The donut chart shows the share of selected reported events by disaster type.

| Design Element | Explanation |
|---|---|
| Mark | Arc |
| Angle | Share of reported events |
| Color | Disaster type |
| Interaction | Tooltip and dynamic filtering |

#### Deaths Heatmap

The deaths heatmap aggregates disaster mortality into 5-year bands.

| Design Element | Explanation |
|---|---|
| Mark | Rectangular cell |
| Row | Disaster type |
| Column | 5-year period |
| Color intensity | Deaths |
| Text label | Compact death total |

This chart was selected because annual stacked bars were harder to read. The heatmap provides a clearer view of mortality spikes across disaster types and periods.

---

### 7.2 Climate Signals Tab

The Climate Signals tab connects climate indicators with disaster impact metrics.

Visualizations included:

- Global temperature anomaly and CO2 concentration
- Economic damage ranking by disaster type
- People affected vs reported events
- Selected economic damage trend

#### Temperature Anomaly and CO2

This dual-axis line chart compares annual global temperature anomaly and atmospheric CO2.

| Design Element | Explanation |
|---|---|
| Mark | Line |
| X-axis | Year |
| Left Y-axis | Temperature anomaly |
| Right Y-axis | CO2 concentration |
| Color | Metric type |

> **Image Slot 10 - Climate Signals Tab**  
> Add screenshot of the Climate Signals tab.  
> `![Climate Signals](images/climate-signals.png)`

#### Economic Damage Ranking by Disaster Type

The economic damage visualization uses a horizontal bar chart rather than a stacked annual chart.

| Design Element | Explanation |
|---|---|
| Mark | Horizontal bar |
| Y-axis | Disaster type |
| X-axis | Total economic damage |
| Color | Disaster type |
| Label | Compact USD total |

This design was selected because it directly answers the question: **Which disaster types caused the highest total reported economic damage in the selected period?**

It is also easier to read than a stacked bar chart, especially when multiple year filters are selected.

---

### 7.3 Impact & Correlation Tab

The Impact & Correlation tab provides exploratory comparisons between climate signals and disaster metrics.

Visualizations included:

- Decade averages: climate signal and reported disasters
- Disaster type frequency heatmap
- CO2 concentration vs total annual disasters
- Multi-variable bubble chart

#### Decade Averages Chart

This chart summarizes average disaster events and temperature anomaly by decade.

| Design Element | Explanation |
|---|---|
| Bar height | Average reported disaster events |
| Line position | Average temperature anomaly |
| X-axis | Decade |
| Tooltip | Year range and exact values |

This design avoids clutter from annual point-to-point scatter plots and provides a cleaner comparison for presentation.

> **Image Slot 11 - Impact & Correlation Tab**  
> Add screenshot of the Impact & Correlation tab.  
> `![Impact and Correlation](images/impact-correlation.png)`

#### CO2 vs Total Annual Disasters

This scatter plot shows each year as a point positioned by CO2 concentration and total reported disaster events.

| Design Element | Explanation |
|---|---|
| Mark | Point |
| X-axis | CO2 concentration |
| Y-axis | Total reported disasters |
| Color | Time progression |
| Tooltip | Year, CO2, disaster count |

#### Multi-variable Bubble Chart

The bubble chart combines temperature anomaly, economic damage, and deaths.

| Design Element | Explanation |
|---|---|
| X-axis | Temperature anomaly |
| Y-axis | Economic damage |
| Bubble size | Deaths |
| Tooltip | Year and exact values |

This view is exploratory and is labeled as non-causal.

---

### 7.4 Country Explorer Tab

The Country Explorer tab provides geographic analysis and country-level drilldown.

Visualizations included:

- D3 choropleth world map
- Top country impact ranking
- Country drilldown panel

#### Choropleth Map

The choropleth map colors countries based on selected impact metric.

| Design Element | Explanation |
|---|---|
| Mark | Country region |
| Color intensity | Deaths or people affected |
| Interaction | Hover tooltip, zoom/pan, country click |

#### Country Drilldown

The country drilldown panel shows country-specific mortality and affected-population trends.

| Component | Purpose |
|---|---|
| Summary cards | Country, period, deaths, affected population |
| Mortality spikes chart | Annual deaths |
| People affected trend | Annual affected population |

> **Image Slot 12 - Country Explorer Tab**  
> Add screenshot of the Country Explorer tab with a selected country.  
> `![Country Explorer](images/country-explorer.png)`

---

## 8. Interaction Techniques

The dashboard includes several interaction techniques required for a strong web-based visualization system.

| Interaction | Implementation | Purpose |
|---|---|---|
| Multi-select disaster type filter | Checkbox dropdown | Compare selected disaster categories |
| Multi-select year filter | Checkbox dropdown | Analyze custom time periods |
| Year presets | Quick buttons | Fast decade and recent-year analysis |
| Map metric selector | Dropdown | Switch between deaths and affected population |
| Minimum deaths selector | Dropdown | Focus on higher-impact cases |
| Country selector | Dropdown | Inspect a specific country |
| Tooltips | D3 and Chart.js | Show exact values on hover |
| Choropleth zoom/pan | D3 zoom | Explore country map in detail |
| Country click drilldown | D3 event handling | Connect map/ranking selection to country charts |
| Theme toggle | CSS variables and rerendering | Improve readability in light and dark environments |
| Reset button | JavaScript state reset | Quickly return to the default dashboard state |

> **Image Slot 13 - Filter Interaction Screenshot**  
> Add screenshot showing disaster type and year filter dropdowns.  
> `![Filter Interaction](images/filter-interaction.png)`

> **Image Slot 14 - Light Theme Screenshot**  
> Add screenshot of dashboard in light theme.  
> `![Light Theme](images/light-theme.png)`

> **Image Slot 15 - Dark Theme Screenshot**  
> Add screenshot of dashboard in dark theme.  
> `![Dark Theme](images/dark-theme.png)`

---

## 9. Color Scheme and Formatting

The dashboard uses a consistent color palette for disaster types:

| Disaster Type | Color Purpose |
|---|---|
| Flood | Blue |
| Earthquake | Green |
| Wildfire | Amber |
| Storms | Red/Pink |
| Drought | Purple |
| Extreme temperature | Orange |
| Landslide | Gray |
| Volcanic activity | Cyan |

The same color mapping is reused across line charts, legends, donut charts, economic rankings, and filters. This consistency helps users recognize categories across different visualizations.

The interface supports both dark and light themes. CSS variables are used for background, text, border, grid, tooltip, and chart colors. This ensures that chart labels, axes, and tooltips remain readable in both modes.

### 9.1 Graphical Integrity

The dashboard follows graphical integrity principles by:

- Starting quantitative axes at zero where appropriate.
- Labeling chart axes clearly.
- Avoiding unsupported causal claims.
- Using tooltips for exact values.
- Using consistent color encodings.
- Separating deaths and affected population in country drilldown to avoid scale distortion.
- Replacing cluttered stacked views with more readable heatmaps and ranking charts where appropriate.

---

## 10. Technical Implementation

The dashboard is implemented using:

| Technology | Use |
|---|---|
| HTML | Page structure |
| CSS | Responsive layout, light/dark theme, formatting |
| JavaScript | State management, filtering, dynamic updates |
| D3.js v7 | Choropleth map, heatmaps, line chart, bar rankings, SVG interactions |
| Chart.js v4 | Donut, line, scatter, and bubble charts |
| PapaParse | CSV parsing fallback |
| TopoJSON | World map geometry |
| Python | Data preprocessing |
| Jupyter Notebook | EDA and preprocessing documentation |

The project uses modular chart files:

| File | Purpose |
|---|---|
| `script.js` | Data loading, filter state, KPIs, tab rendering |
| `charts/linechart.js` | Event trend, donut chart, deaths heatmap |
| `charts/barchart.js` | Country ranking, economic ranking, country drilldown |
| `charts/heatmap.js` | Disaster frequency heatmap |
| `charts/map.js` | D3 choropleth world map |
| `charts/scatterplot.js` | Climate comparison, scatter, bubble, temperature/CO2 chart |

---

## 11. Key Findings

The dashboard reveals the following major findings:

1. Reported natural disaster events increased from **123 in 1980** to **443 in 2024**.
2. Floods are the most frequently reported disaster category in the selected period.
3. Storms account for the highest reported economic damage in current USD.
4. Some disaster types produce frequent events, while others produce fewer but more severe mortality spikes.
5. Country-level impacts are highly uneven, with certain countries showing very high death or affected-population totals.
6. NASA temperature anomaly and NOAA CO2 both increased over the selected period.
7. Correlation views show descriptive relationships but should not be interpreted as proof of causation.

---

## 12. Challenges and Solutions

### Challenge 1: Selecting a suitable real dataset

The original project required a distinct and meaningful dataset. Instead of using synthetic data, real disaster and climate datasets were selected from trusted public sources.

**Solution:** EM-DAT/OWID, NASA GISTEMP, and NOAA GML datasets were combined to create a richer dashboard.

### Challenge 2: Combining multiple datasets

The datasets came from different sources and had different structures.

**Solution:** A Python preprocessing script was written to clean, join, reshape, and export consistent dashboard-ready tables.

### Challenge 3: Avoiding misleading event-level claims

The selected disaster data is aggregated by year, country, and disaster type, not by individual disaster event.

**Solution:** The dashboard avoids event-level maps and instead uses country-level choropleth and rankings.

### Challenge 4: Chart clutter

Some early visualizations, such as stacked annual bars and dense scatter plots, were difficult to read.

**Solution:** These were replaced with clearer alternatives such as heatmaps, horizontal rankings, decade averages, and split country drilldown charts.

### Challenge 5: Theme compatibility

Charts needed to remain readable in both dark and light modes.

**Solution:** CSS variables and dynamic chart theme updates were used for text, grid, tooltip, and background colors.

---

## 13. Limitations

The dashboard has the following limitations:

1. EM-DAT disaster reporting may be affected by historical underreporting, especially before 2000.
2. Economic damage values are current USD and are not inflation-adjusted.
3. NASA GISTEMP temperature anomaly is global, not country-specific.
4. NOAA CO2 concentration is global, not country-specific.
5. The dashboard does not include individual event locations because the selected data is aggregated.
6. Correlation visualizations are exploratory and should not be treated as causal evidence.

---

## 14. Conclusion

This project successfully developed a functional interactive web-based visualization system using D3.js, Chart.js, JavaScript, HTML, CSS, Python, and Jupyter Notebook. The system integrates real-world climate and disaster datasets, performs preprocessing, and presents insights through interactive visualizations.

The dashboard demonstrates practical understanding of visualization techniques including marks, channels, color encoding, interaction, filtering, tooltips, choropleth mapping, heatmaps, line charts, ranking charts, and bubble charts. It also supports final presentation and viva through clear preprocessing evidence, source documentation, and careful limitation disclosure.

Overall, the project satisfies the course requirement of developing a web-based system using interactive visualization techniques and libraries.

---

## 15. References

1. EM-DAT, CRED / UCLouvain. The International Disasters Database. Processed by Our World in Data.
2. Our World in Data. Natural disaster datasets for reported events, deaths, people affected, and economic damage.
3. GISTEMP Team. GISS Surface Temperature Analysis, version 4. NASA Goddard Institute for Space Studies.
4. NOAA Global Monitoring Laboratory. Globally averaged marine surface annual mean carbon dioxide data.
5. D3.js Documentation. https://d3js.org/
6. Chart.js Documentation. https://www.chartjs.org/
7. TopoJSON Documentation. https://github.com/topojson/topojson

Full source URLs are available in:

`data/SOURCES.md`

---

## Appendix A: Suggested Screenshots Checklist

Use this checklist before finalizing the report:

- [ ] Dashboard overview tab
- [ ] Climate signals tab
- [ ] Impact and correlation tab
- [ ] Country explorer tab
- [ ] Light theme screenshot
- [ ] Dark theme screenshot
- [ ] Year preset dropdown
- [ ] Disaster type filter dropdown
- [ ] Tooltip example
- [ ] Country drilldown example
- [ ] Preprocessing summary JSON/table
- [ ] EDA event trend plot
- [ ] EDA correlation matrix

---

## Appendix B: Viva Preparation Notes

Prepare answers for the following questions:

1. Why did you choose this dataset?
2. What preprocessing steps did you perform?
3. Why did you remove aggregate entities?
4. Which visualizations are created using D3.js?
5. What marks and channels are used in the main charts?
6. How do filters update the dashboard?
7. Why are correlation charts labeled as exploratory?
8. What are the limitations of the data?
9. How does the color scheme help users understand the dashboard?
10. What improvement would you add if more time was available?

