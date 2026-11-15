# 🔥 FireSync — Harmonization of MODIS and VIIRS Hot Spots

A geospatial analytics and monitoring web application developed for the **NASA International Space Apps Challenge**. FireSync ingests, cleans, harmonizes, and interactively visualizes NASA FIRMS active fire hotspot detections from both **MODIS** and **VIIRS** satellites into a single, unified dataset and visual intelligence platform.

---

### 👥 Team Information
- **Team Name**: 4444
- **Challenge Track**: Harmonization of MODIS and VIIRS Hot Spots
- **Team Members**:
  - Sathya Vuppala
  - Shiva Varun
  - Syed Ayesha
  - Hema Saahithi

---

## 📌 Project Overview

NASA's Fire Information for Resource Management System (FIRMS) provides active fire data through two primary sensor families:
- **MODIS** (Terra and Aqua satellites): 1 km spatial resolution, long historical record since the early 2000s, confidence reported as a numerical percentage (0–100%).
- **VIIRS** (Suomi-NPP and NOAA satellites): 375 m spatial resolution, higher detail since 2012, confidence reported categorically as Low (`l`), Nominal (`n`), or High (`h`).

**FireSync** fulfills the challenge in two integrated parts:

1. **Harmonization Pipeline**: Reconciles confidence scales, preserves Near-Real-Time observations, standardizes metadata, and deduplicates overlapping detections using a ~1.1 km² spatial-temporal grid prioritizing peak Fire Radiative Power (FRP).
2. **Interactive Web Application**: Features an interactive map with freehand bounding-box drawing and coordinate jump inputs, an accessible burning activity calendar with multi-year matrices and daily heatmaps, and a historical data archive with filtered CSV export.

---

## 🛠️ System Architecture & Workflow

### 1. Data Harmonization Pipeline (`notebooks/`)
- **`clean_data.py`**:
  - Loads raw MODIS (`data/raw/modis.csv`) and VIIRS (`data/raw/viirs.csv`).
  - Preserves Near-Real-Time (NRT) rows by setting unclassified `type` to `-1`.
  - Harmonizes MODIS continuous confidence percentages into categorical values: $\ge 80\% \rightarrow \text{'h'}$, $30-79\% \rightarrow \text{'n'}$, $< 30\% \rightarrow \text{'l'}$, matching the VIIRS format in the `confidence_cat` column.
  - Removes non-shared columns (`version`, `bright_t31`).
- **`harmonize_data.py`**:
  - Combines cleaned MODIS and VIIRS data.
  - Rounds latitude and longitude to 2 decimal places to create ~1.1 km $\times$ 1.1 km spatial grid cells.
  - Sorts by Fire Radiative Power (`frp`) in descending order.
  - Drops duplicate detections sharing the same `['acq_date', 'daynight', 'grid_lat', 'grid_lon']`, retaining the strongest radiative signal.
- **`merge_col.py`**:
  - Merges sensor and satellite into `Instrument (Satellite)` (e.g., `MODIS (Terra)`, `VIIRS (NPP)`).
- **`prepare_db.py`**:
  - Populates SQLite database `data/processed/fires.db` with 3,285,447 harmonized records (November 2020 to November 2026).
  - Creates B-Tree indices on `acq_date` and `daynight` for fast queries.

### 2. Backend Server (`backend/`)
- Built with Python's standard library (`http.server`, `sqlite3`).
- Endpoints:
  - `/api/dates`: Returns dataset observation date range.
  - `/api/fires?date=&daynight=`: Returns filtered hotspot detections for a single day.
  - `/api/monthly`: Returns aggregated monthly fire counts across all years for calendar matrix.
  - `/api/calendar?year=`: Returns 365-day daily counts for a selected year.
  - `/api/archive/summary?start=&end=`: Returns date-range metrics and top burning states.
  - `/api/export?start=&end=`: Streams full CSV dataset for the selected date range.

### 3. Frontend Web Application (`frontend/`)
- Built with React 19, Leaflet, Vite, and Lucide React.
- **Live Surveillance Map**:
  - Visualizes active fire locations sized and colored by radiant brightness in Kelvin (Amber $\rightarrow$ Orange $\rightarrow$ Red).
  - **Draw Area Tool**: Users click and drag a rectangular bounding box on the map to filter hotspots and export that specific region's data as a CSV.
  - **Coordinate Navigation HUD**: Direct editable `LAT` and `LON` input fields in the top navbar. Entering coordinates flies the camera to the point and drops an animated target crosshair pin.
  - **Click-Away Deselection**: Clicking on the map clears inspected points and target coordinate pins without removing the drawn region.
  - **Hotspot Inspector**: Displays district, state, country, confidence category (`l`/`n`/`h`), and fire classification type (0: Vegetation, 1: Volcano, 2: Static land source, 3: Offshore, -1: Undetermined).
  - **Map Snapshot**: Captures and downloads high-resolution map views as PNG images.
- **Burning Activity Calendar**:
  - **Multi-Year Matrix**: Compares monthly fire totals across 2020–2026 to identify seasonal fire patterns (e.g., pre-monsoon forest fires and post-monsoon crop residue burning).
  - **Daily Heatmap**: 365-day granular grid for any selected year.
  - **Accessible Color Ramp**: 5-tier thermal palette (Light Yellow $\rightarrow$ Amber $\rightarrow$ Vibrant Orange $\rightarrow$ Deep Red $\rightarrow$ Dark Maroon).
  - **Map Link**: Clicking any day in the calendar opens that date directly in the Live Map.
- **Data Archive**:
  - Select custom start and end dates or choose notable benchmark presets.
  - View summary statistics, top burning states, and preview records table.
  - Download full filtered CSV files.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── prepare_db.py       # Converts & indexes harmonized CSV to SQLite DB
│   └── server.py           # Zero-dependency Python HTTP API server
├── data/
│   ├── raw/                # Raw satellite CSVs (MODIS & VIIRS)
│   └── processed/          # Harmonized datasets & indexed SQLite database
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Live Map, Draw Area tool, and Coordinate HUD
│   │   ├── LandingPage.jsx # Platform overview
│   │   ├── ActivityCalendar.jsx # Multi-year burning activity calendar
│   │   ├── ArchivePage.jsx # Date-range search and CSV export
│   │   ├── fireTypes.js    # Fire type classifications & reverse geocoder
│   │   └── main.jsx        # React application entry point
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build & proxy configuration
├── notebooks/
│   ├── clean_data.py       # Confidence harmonization & NRT preservation
│   ├── harmonize_data.py   # 1.1 km² spatial grid deduplication by peak FRP
│   └── merge_col.py        # Metadata column formatting
├── start_app.bat           # 1-click launch script (Windows)
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Running the Application

#### Option A: 1-Click Launch (Windows)
Double-click or run:
```cmd
start_app.bat
```

#### Option B: Manual Launch

**Terminal 1 — Backend Server:**
```bash
python backend/server.py
```
*Server runs on `http://127.0.0.1:8000`.*

**Terminal 2 — Frontend Client:**
```bash
cd frontend
npm install
npm run dev
```
*Application opens at `http://localhost:3000`.*

---

## 🛰️ Harmonized Data Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `latitude` | Float | Geodetic latitude (WGS-84) |
| `longitude` | Float | Geodetic longitude (WGS-84) |
| `brightness` | Float | Thermal radiant temperature of the fire pixel (Kelvin) |
| `scan`, `track` | Float | Spatial footprint dimensions of the scan |
| `acq_date` | String | Observation date (`YYYY-MM-DD`) |
| `acq_time` | Integer | Observation acquisition time in UTC |
| `instrument` | String | Harmonized format: `Sensor (Satellite)` |
| `confidence` | String/Int | Original raw sensor confidence value |
| `confidence_cat` | String | Harmonized confidence category (`l` = Low, `n` = Nominal, `h` = High) |
| `frp` | Float | Fire Radiative Power (Megawatts) |
| `daynight` | String | Diurnal observation cycle (`D` = Day, `N` = Night) |
| `type` | Integer | Classification type (`0` = Vegetation, `1` = Volcano, `2` = Static source, `3` = Offshore, `-1` = Undetermined) |
