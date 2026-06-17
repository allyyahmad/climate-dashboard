import json
from pathlib import Path


def markdown(source):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source.splitlines(keepends=True),
    }


def code(source):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.splitlines(keepends=True),
    }


cells = [
    markdown("""# Climate Change & Natural Disaster Intelligence
## Real-Data EDA and Preprocessing - DSC327

This notebook documents the real datasets used by the dashboard:

- `data/processed/real_global_annual.csv`
- `data/processed/real_global_disaster_type_year.csv`
- `data/processed/real_country_year_impacts.csv`

Raw data sources are documented in `data/SOURCES.md`:

- EM-DAT/CRED via Our World in Data for reported natural disasters, deaths, affected population, and economic damage.
- NASA GISTEMP v4 for annual global temperature anomaly.
- NOAA Global Monitoring Laboratory for annual global CO2.

Important limitation: the selected disaster sources are aggregated by year, disaster category, and/or country. The dashboard therefore avoids event-level claims such as exact locations, severity classes, or individual event records.
"""),
    code("""import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid", palette="tab10")
plt.rcParams.update({
    "figure.dpi": 130,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.titleweight": "bold",
})

DATA_DIR = os.path.join("..", "data", "processed")
annual = pd.read_csv(os.path.join(DATA_DIR, "real_global_annual.csv"))
type_year = pd.read_csv(os.path.join(DATA_DIR, "real_global_disaster_type_year.csv"))
country_year = pd.read_csv(os.path.join(DATA_DIR, "real_country_year_impacts.csv"))

print("Loaded tables:")
print("annual:", annual.shape)
print("type_year:", type_year.shape)
print("country_year:", country_year.shape)
"""),
    markdown("""## 1. Dataset Overview

The cleaned dashboard dataset is intentionally split into three tables:

1. `annual`: one row per year with total reported disaster events, deaths, affected population, economic damage, temperature anomaly, and CO2.
2. `type_year`: one row per year and disaster type for event count, deaths, affected population, and damage.
3. `country_year`: one row per country and year for deaths and affected population.
"""),
    code("""display(annual.head())
display(type_year.head())
display(country_year.head())
"""),
    markdown("## 2. Data Quality Checks"),
    code("""for name, df in {
    "annual": annual,
    "type_year": type_year,
    "country_year": country_year,
}.items():
    print(f"\\n{name}")
    print("missing values:")
    print(df.isna().sum())
    print("duplicate rows:", df.duplicated().sum())
"""),
    markdown("""## 3. Preprocessing Summary

The preprocessing script `data/build_real_datasets.py` performs the following steps:

- Reads raw OWID/EM-DAT graphers for disaster events, deaths, affected people, and economic damage.
- Reads NASA GISTEMP annual global temperature anomaly.
- Reads NOAA annual global CO2.
- Joins annual climate indicators with global disaster totals by year.
- Reshapes disaster categories into a dashboard-friendly type-year table.
- Removes aggregate entities such as `World`, `Asia`, `Africa`, and income groups from the country-level table.
- Exports CSV files and a browser-ready `real_data.js` bundle.
"""),
    markdown("## 4. Exploratory Data Analysis"),
    code("""fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(annual["Year"], annual["Total_Disaster_Events"], color="#2563eb", linewidth=2.5)
ax.set_title("Reported Natural Disaster Events, 1980-2024")
ax.set_xlabel("Year")
ax.set_ylabel("Reported events")
plt.show()
"""),
    code("""type_totals = type_year.groupby("Disaster_Type", as_index=False)["Event_Count"].sum()
type_totals = type_totals.sort_values("Event_Count", ascending=True)

fig, ax = plt.subplots(figsize=(9, 4.5))
ax.barh(type_totals["Disaster_Type"], type_totals["Event_Count"], color="#2563eb")
ax.set_title("Total Reported Events by Disaster Type")
ax.set_xlabel("Reported events")
plt.show()
"""),
    code("""impact_by_type = type_year.groupby("Disaster_Type", as_index=False).agg({
    "Total_Deaths": "sum",
    "Total_Affected": "sum",
    "Economic_Damage_USD": "sum",
})
impact_by_type["Economic_Damage_USD_B"] = impact_by_type["Economic_Damage_USD"] / 1e9
display(impact_by_type.sort_values("Economic_Damage_USD", ascending=False))
"""),
    code("""fig, ax1 = plt.subplots(figsize=(10, 4))
ax2 = ax1.twinx()

ax1.plot(annual["Year"], annual["Temp_Anomaly_C"], color="#dc2626", linewidth=2.4, label="Temperature anomaly")
ax2.plot(annual["Year"], annual["CO2_ppm"], color="#2563eb", linewidth=2.4, label="CO2")

ax1.set_title("Global Temperature Anomaly and CO2")
ax1.set_xlabel("Year")
ax1.set_ylabel("Temperature anomaly (C)", color="#dc2626")
ax2.set_ylabel("CO2 (ppm)", color="#2563eb")
plt.show()
"""),
    code("""top_deaths = country_year.groupby("Entity", as_index=False)["Total_Deaths"].sum()
top_deaths = top_deaths.sort_values("Total_Deaths", ascending=False).head(12)

fig, ax = plt.subplots(figsize=(9, 5))
ax.barh(top_deaths["Entity"][::-1], top_deaths["Total_Deaths"][::-1], color="#e11d48")
ax.set_title("Top Countries by Disaster Deaths, 1980-2024")
ax.set_xlabel("Deaths")
plt.show()
"""),
    markdown("## 5. Correlation Analysis"),
    code("""corr_cols = [
    "Total_Disaster_Events",
    "Total_Deaths",
    "Total_Affected",
    "Economic_Damage_USD",
    "Temp_Anomaly_C",
    "CO2_ppm",
]
corr = annual[corr_cols].corr()
display(corr.round(3))

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, ax=ax)
ax.set_title("Correlation Matrix: Annual Global Metrics")
plt.show()
"""),
    code("""fig, ax = plt.subplots(figsize=(6.5, 4.5))
ax.scatter(annual["CO2_ppm"], annual["Total_Disaster_Events"], s=55, color="#2563eb", alpha=0.75)
for _, row in annual.iloc[::8].iterrows():
    ax.text(row["CO2_ppm"], row["Total_Disaster_Events"], int(row["Year"]), fontsize=8)
ax.set_title("CO2 vs Reported Disaster Events")
ax.set_xlabel("CO2 (ppm)")
ax.set_ylabel("Reported disaster events")
plt.show()
"""),
    markdown("""## 6. Visualization Design Notes

- Line charts use position to encode time and event values.
- Color encodes disaster type consistently across dashboard views.
- Bubble charts use position for climate/impact variables and size for deaths.
- Choropleth color intensity encodes country-level impact.
- Filters allow year presets/multi-select, disaster type multi-select, minimum-death threshold, impact metric, and country dropdown selection.

Correlation views are exploratory and must not be presented as proof of direct causation.
"""),
    markdown("""## 7. Key Findings

- Reported natural disaster events increased from 123 in 1980 to 443 in 2024.
- Global temperature anomaly increased from 0.26 C in 1980 to 1.29 C in 2024.
- Global CO2 increased from 338.91 ppm in 1980 to 422.79 ppm in 2024.
- Floods are the most frequent reported disaster category in the selected period.
- Storms account for the highest reported economic damage in current USD.
- Earthquakes, droughts, storms, and extreme temperature events dominate mortality in different ways.
"""),
]

notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "pygments_lexer": "ipython3",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

OUTPUT_PATH = Path(__file__).with_name("Climate_Disaster_EDA.ipynb")

with OUTPUT_PATH.open("w", encoding="utf-8") as file:
    json.dump(notebook, file, indent=1)

print(f"Built {OUTPUT_PATH} for real-data workflow")
