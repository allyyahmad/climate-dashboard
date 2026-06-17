# Real Dataset Sources

This project uses real-world data sources for final submission. The dashboard, EDA notebook, and processed datasets are based on the sources listed below.

Access date for the sources below: May 24, 2026.

## Selected Dataset Strategy

Use a combined real-data dataset built from:

- Disaster occurrence and impacts: EM-DAT via Our World in Data.
- Global temperature anomaly: NASA GISTEMP v4.
- Atmospheric CO2 concentration: NOAA Global Monitoring Laboratory.

This combination fits the project theme because it supports interactive analysis of disaster frequency, deaths, affected population, economic damage, temperature anomaly, and CO2 over time.

## Downloaded Raw Files

The source CSV files have been downloaded into `data/raw/`.

| Local file | Source | Use in dashboard |
|---|---|---|
| `data/raw/owid_natural_disaster_events.csv` | Our World in Data / EM-DAT | Annual disaster event counts by disaster category |
| `data/raw/owid_natural_disaster_deaths.csv` | Our World in Data / EM-DAT | Annual deaths by country and disaster category |
| `data/raw/owid_natural_disaster_affected.csv` | Our World in Data / EM-DAT | Annual affected population by country and disaster category |
| `data/raw/owid_natural_disaster_damage.csv` | Our World in Data / EM-DAT | Annual economic damage by disaster category |
| `data/raw/nasa_gistemp_global.csv` | NASA GISS GISTEMP v4 | Annual global land-ocean temperature anomaly |
| `data/raw/noaa_global_co2_annual.csv` | NOAA GML | Annual global mean atmospheric CO2 |

## Source URLs

Our World in Data / EM-DAT:

- Number of reported natural disaster events: https://ourworldindata.org/grapher/number-of-natural-disaster-events.csv?v=1&csvType=full&useColumnShortNames=false
- Deaths from natural disasters: https://ourworldindata.org/grapher/natural-disasters-deaths.csv?v=1&csvType=full&useColumnShortNames=false
- People affected by natural disasters: https://ourworldindata.org/grapher/natural-disasters-people-affected.csv?v=1&csvType=full&useColumnShortNames=false
- Economic damage by natural disaster type: https://ourworldindata.org/grapher/economic-damage-from-natural-disasters.csv?v=1&csvType=full&useColumnShortNames=false

NASA GISTEMP:

- GISTEMP v4 global land-ocean temperature anomaly table: https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv

NOAA GML:

- Annual globally averaged marine surface CO2: https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.csv

## Citations To Include In Report

EM-DAT / OWID disaster data:

EM-DAT, CRED / UCLouvain (2026) - with major processing by Our World in Data. Dataset pages for reported natural disaster events, disaster deaths, people affected, and economic damage. Original data from EM-DAT, "The International Disasters Database".

NASA temperature data:

GISTEMP Team (2026). GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed May 24, 2026 at https://data.giss.nasa.gov/gistemp/.

NOAA CO2 data:

NOAA Global Monitoring Laboratory. Globally averaged marine surface annual mean carbon dioxide data. Dataset accessed May 24, 2026 at https://gml.noaa.gov/ccgg/trends/gl_data.html.

## Important Disclosure

The dashboard must not claim event-level latitude, longitude, severity, or individual disaster records because the selected OWID/EM-DAT sources are aggregated by year, country, and/or disaster category. Therefore:

- Choropleth maps can show country-level deaths or affected population.
- Time-series charts can show annual event counts, deaths, affected people, and damages.
- Correlation charts can compare annual disaster metrics with annual temperature anomaly and CO2.
- Event dot maps based on simulated coordinates have been replaced with country-level impact rankings.

## Known Data Limitations

- EM-DAT coverage before 2000 can be affected by reporting improvements and historical undercounting.
- Economic damage values are not adjusted for inflation in the selected OWID damage dataset.
- NASA GISTEMP is global annual temperature anomaly, not country-level temperature.
- NOAA CO2 is global annual mean CO2, not country-level CO2.
- Correlation visualizations should be presented as exploratory relationships, not proof that CO2 or temperature directly caused disaster counts.
