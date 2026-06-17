"""
Build cleaned real-world dashboard datasets from downloaded raw sources.

Inputs live in data/raw and are sourced from:
- Our World in Data / EM-DAT natural disaster graphers
- NASA GISTEMP global temperature anomaly
- NOAA GML annual global CO2

Outputs live in data/processed.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
OUT_DIR = BASE_DIR / "processed"
OUT_DIR.mkdir(exist_ok=True)

START_YEAR = 1980
END_YEAR = 2024

DISASTER_TYPES = [
    ("Drought", "Drought", "Drought"),
    ("Earthquake", "Earthquake", "Earthquake"),
    ("Extreme temperature", "Extreme temperature", "Extreme temperature"),
    ("Storms", "Extreme weather", "Storms"),
    ("Flood", "Flood", "Flood"),
    ("Landslide", "Landslide", "Landslide"),
    ("Volcanic activity", "Volcanic activity", "Volcanoes"),
    ("Wildfire", "Wildfire", "Wildfire"),
]

AGGREGATE_ENTITIES = {
    "Africa",
    "Asia",
    "Europe",
    "European Union (27)",
    "High-income countries",
    "Low-income countries",
    "Lower-middle-income countries",
    "North America",
    "Oceania",
    "South America",
    "Upper-middle-income countries",
    "World",
}


def as_float(value: str | None) -> float:
    if value is None or value == "" or value == "***":
        return 0.0
    return float(value)


def as_int(value: str | None) -> int:
    return int(round(as_float(value)))


def read_owid_events() -> dict[tuple[str, int], int]:
    rows = {}
    with (RAW_DIR / "owid_natural_disaster_events.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            year = int(row["Year"])
            rows[(row["Entity"], year)] = as_int(row["Disasters"])
    return rows


def read_owid_damage() -> dict[tuple[str, int], int]:
    rows = {}
    with (RAW_DIR / "owid_natural_disaster_damage.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            year = int(row["Year"])
            rows[(row["Entity"], year)] = as_int(row["Total economic damages"])
    return rows


def read_impact_file(filename: str) -> list[dict[str, str]]:
    with (RAW_DIR / filename).open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def read_world_impacts(filename: str) -> dict[int, dict[str, int]]:
    rows = {}
    for row in read_impact_file(filename):
        if row["Entity"] != "World":
            continue
        year = int(row["Year"])
        rows[year] = {key: as_int(value) for key, value in row.items() if key not in {"Entity", "Code", "Year"}}
    return rows


def read_gistemp() -> dict[int, float]:
    rows = {}
    with (RAW_DIR / "nasa_gistemp_global.csv").open(encoding="utf-8") as file:
        reader = csv.DictReader(line for line in file if not line.startswith("Land-Ocean"))
        for row in reader:
            year = int(row["Year"])
            value = row["J-D"]
            if value != "***":
                rows[year] = float(value)
    return rows


def read_co2() -> dict[int, float]:
    rows = {}
    with (RAW_DIR / "noaa_global_co2_annual.csv").open(encoding="utf-8") as file:
        reader = csv.DictReader(line for line in file if not line.startswith("#") and line.strip())
        for row in reader:
            rows[int(row["year"])] = float(row["mean"])
    return rows


def write_global_annual() -> None:
    events = read_owid_events()
    damage = read_owid_damage()
    deaths = read_world_impacts("owid_natural_disaster_deaths.csv")
    affected = read_world_impacts("owid_natural_disaster_affected.csv")
    temp = read_gistemp()
    co2 = read_co2()

    output = OUT_DIR / "real_global_annual.csv"
    with output.open("w", newline="", encoding="utf-8") as file:
        fields = [
            "Year",
            "Total_Disaster_Events",
            "Total_Deaths",
            "Total_Affected",
            "Economic_Damage_USD",
            "Temp_Anomaly_C",
            "CO2_ppm",
        ]
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for year in range(START_YEAR, END_YEAR + 1):
            writer.writerow({
                "Year": year,
                "Total_Disaster_Events": events.get(("All disasters", year), 0),
                "Total_Deaths": deaths.get(year, {}).get("All disasters", 0),
                "Total_Affected": affected.get(year, {}).get("All disasters", 0),
                "Economic_Damage_USD": damage.get(("All disasters", year), 0),
                "Temp_Anomaly_C": temp.get(year, ""),
                "CO2_ppm": co2.get(year, ""),
            })


def write_global_type_year() -> None:
    events = read_owid_events()
    damage = read_owid_damage()
    deaths = read_world_impacts("owid_natural_disaster_deaths.csv")
    affected = read_world_impacts("owid_natural_disaster_affected.csv")

    output = OUT_DIR / "real_global_disaster_type_year.csv"
    with output.open("w", newline="", encoding="utf-8") as file:
        fields = [
            "Year",
            "Disaster_Type",
            "Event_Count",
            "Total_Deaths",
            "Total_Affected",
            "Economic_Damage_USD",
        ]
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for year in range(START_YEAR, END_YEAR + 1):
            for display_type, event_entity, impact_col in DISASTER_TYPES:
                writer.writerow({
                    "Year": year,
                    "Disaster_Type": display_type,
                    "Event_Count": events.get((event_entity, year), 0),
                    "Total_Deaths": deaths.get(year, {}).get(impact_col, 0),
                    "Total_Affected": affected.get(year, {}).get(impact_col, 0),
                    "Economic_Damage_USD": damage.get((event_entity, year), 0),
                })


def write_country_year_impacts() -> None:
    deaths_rows = read_impact_file("owid_natural_disaster_deaths.csv")
    affected_rows = read_impact_file("owid_natural_disaster_affected.csv")

    affected_index = {
        (row["Entity"], row["Code"], int(row["Year"])): row
        for row in affected_rows
        if row["Code"]
    }

    output = OUT_DIR / "real_country_year_impacts.csv"
    with output.open("w", newline="", encoding="utf-8") as file:
        fields = ["Entity", "Code", "Year", "Total_Deaths", "Total_Affected"]
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for row in deaths_rows:
            if not row["Code"] or row["Entity"] in AGGREGATE_ENTITIES:
                continue
            year = int(row["Year"])
            if year < START_YEAR or year > END_YEAR:
                continue
            key = (row["Entity"], row["Code"], year)
            affected_row = affected_index.get(key, {})
            writer.writerow({
                "Entity": row["Entity"],
                "Code": row["Code"],
                "Year": year,
                "Total_Deaths": as_int(row.get("All disasters")),
                "Total_Affected": as_int(affected_row.get("All disasters")),
            })


def csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def table_profile(path: Path) -> dict[str, object]:
    rows = csv_rows(path)
    columns = list(rows[0].keys()) if rows else []
    row_signatures = [tuple(row.get(column, "") for column in columns) for row in rows]
    missing_cells = sum(
        1
        for row in rows
        for value in row.values()
        if value is None or str(value).strip() == ""
    )
    return {
        "file": str(path.relative_to(BASE_DIR.parent)),
        "rows": len(rows),
        "columns": columns,
        "column_count": len(columns),
        "missing_cells": missing_cells,
        "duplicate_rows": len(row_signatures) - len(set(row_signatures)),
    }


def write_browser_data_bundle() -> None:
    bundle = {
        "annual": csv_rows(OUT_DIR / "real_global_annual.csv"),
        "typeYear": csv_rows(OUT_DIR / "real_global_disaster_type_year.csv"),
        "countries": csv_rows(OUT_DIR / "real_country_year_impacts.csv"),
    }
    output = OUT_DIR / "real_data.js"
    output.write_text(
        "window.REAL_DATA = "
        + json.dumps(bundle, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )


def write_preprocessing_summary() -> None:
    processed_files = [
        OUT_DIR / "real_global_annual.csv",
        OUT_DIR / "real_global_disaster_type_year.csv",
        OUT_DIR / "real_country_year_impacts.csv",
    ]
    raw_files = sorted(path.name for path in RAW_DIR.glob("*.csv"))
    summary = {
        "project": "Climate & Disaster Intelligence Dashboard",
        "time_range": {"start_year": START_YEAR, "end_year": END_YEAR},
        "dataset_strategy": "Real aggregated climate and disaster datasets joined by year, disaster type, and country.",
        "raw_source_files": raw_files,
        "processed_tables": [table_profile(path) for path in processed_files],
        "disaster_types": [display_type for display_type, _, _ in DISASTER_TYPES],
        "removed_aggregate_entities": sorted(AGGREGATE_ENTITIES),
        "preprocessing_steps": [
            "Read OWID/EM-DAT disaster events, deaths, affected population, and economic damage raw CSVs.",
            "Read NASA GISTEMP annual global temperature anomaly and NOAA GML annual CO2 raw CSVs.",
            "Coerced numeric values and converted missing, blank, and masked values to zero where appropriate.",
            "Joined global annual disaster totals with annual climate indicators by year.",
            "Reshaped disaster categories into a type-year table for D3 filtering and visual encoding.",
            "Removed aggregate regions and income groups from the country-year impact table.",
            "Exported processed CSV files plus a browser-ready real_data.js bundle for reliable dashboard loading.",
        ],
        "important_limitations": [
            "Disaster data is aggregated by year, disaster category, and/or country.",
            "The dashboard does not claim event-level latitude, longitude, or individual disaster records.",
            "Economic damage values are current USD and are not inflation-adjusted.",
            "Climate indicators are global annual values, not country-level climate measurements.",
            "Correlation views are exploratory and must not be interpreted as proof of direct causation.",
        ],
    }
    output = OUT_DIR / "preprocessing_summary.json"
    output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    write_global_annual()
    write_global_type_year()
    write_country_year_impacts()
    write_browser_data_bundle()
    write_preprocessing_summary()
    print("Built processed real datasets in data/processed")


if __name__ == "__main__":
    main()
