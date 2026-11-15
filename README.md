# 🔥 FireSync — Global Satellite Fire Intelligence & Monitoring Platform

A high-performance geospatial analytics and monitoring platform that ingests, cleans, harmonizes, and interactively visualizes NASA FIRMS satellite active fire detections (MODIS and VIIRS). Designed for nationwide surveillance with seamless scalability to whole-Earth global coverage.

---

## 📌 Project Overview

- **Data Processing Pipeline**:
  - Ingests multi-year archive and near-real-time (NRT) satellite datasets from NASA FIRMS (**MODIS** & **VIIRS**).
  - Cleans missing values, harmonizes detection confidence categories (`l`, `n`, `h`), and standardizes coordinate bounds.
  - Spatial and temporal deduplication via grid cells (~1.1 km² resolution) prioritizing highest Fire Radiative Power (FRP).
  - Merges sensor/satellite metadata (`MODIS (Terra)`, `VIIRS (Suomi-NPP)`, etc.).
- **Interactive Geospatial Web App**:
  - High-performance Leaflet-based interactive map focused on India.
  - Right-hand control panel with date picker, diurnal filter (Day / Night), and live summary statistics.
  - Relative brightness visualization: dynamic marker radii, glow intensities, and orange color scaling based on brightness in Kelvin.
  - High-speed indexed backend server (sub-15ms response times across 3.25M+ rows).

---

## 📁 Repository Structure

```text
├── backend/
│   ├── prepare_db.py       # Converts & indexes harmonized CSV to SQLite DB
│   └── server.py           # Lightweight zero-dependency HTTP API server
├── data/
│   ├── raw/                # Raw satellite CSVs (MODIS & VIIRS)
│   └── processed/          # Harmonized datasets & indexed database
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React UI, Leaflet map, and Control Panel
│   │   ├── LandingPage.jsx # Immersive high-tech Landing Page & Outbreak Archive
│   │   ├── ActivityCalendar.jsx # Spatiotemporal multi-year burning activity calendar
│   │   ├── main.jsx        # React application entry point
│   │   └── index.css       # Dark-theme styling and pulse animations
│   ├── index.html          # HTML shell
│   ├── package.json        # Frontend dependencies (React, Leaflet, Lucide)
│   └── vite.config.js      # Vite build & proxy configuration
├── notebooks/
│   ├── explore_data.py     # Initial dataset exploratory analysis & inspection
│   ├── clean_data.py       # Data cleaning, standardization & feature handling
│   ├── harmonize_data.py   # Spatial/temporal grid deduplication & dataset fusion
│   └── merge_col.py        # Instrument and satellite column formatting
├── .gitignore              # Ignores venv, node_modules, and raw data files
├── requirements.txt        # Python dependencies
├── start_app.bat           # 1-click launch script (Windows)
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

---

### 2. Python Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd "fire ehhheeee"

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

---

### 3. Data Processing Pipeline (Optional if already run)
If running from raw data:
```bash
# 1. Clean raw MODIS and VIIRS files
python notebooks/clean_data.py

# 2. Harmonize & deduplicate datasets
python notebooks/harmonize_data.py

# 3. Format instrument metadata
python notebooks/merge_col.py

# 4. Build indexed database for instant API queries
python backend/prepare_db.py
```

---

### 4. Running the Application

#### Option A: Quick Launch (Windows)
Simply run the included batch file:
```cmd
start_app.bat
```

#### Option B: Manual Launch

**Terminal 1 — Backend API Server:**
```bash
python backend/server.py
```
*API will start on `http://127.0.0.1:8000`.*

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Frontend will be accessible at `http://localhost:3000`.*

---

## 🛰️ Data Attributes & Harmonization

| Column | Description |
| :--- | :--- |
| `latitude`, `longitude` | Geodetic coordinates (WGS-84) |
| `brightness` | Brightness temperature of fire pixel (Kelvin) |
| `frp` | Fire Radiative Power (Megawatts, MW) |
| `acq_date` | Date of satellite observation (`YYYY-MM-DD`) |
| `acq_time` | Acquisition time in UTC |
| `daynight` | Diurnal period (`D` = Daytime, `N` = Nighttime) |
| `confidence_cat` | Harmonized confidence category (`l` = Low, `n` = Nominal, `h` = High) |
| `instrument` | Sensor and satellite platform name |

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Leaflet, Vite, Lucide React
- **Backend**: Python 3 standard library (`http.server`, `sqlite3`, `json`)
- **Data Engineering**: Pandas, NumPy

