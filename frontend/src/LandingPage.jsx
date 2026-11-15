import React from 'react';
import {
  Flame,
  Globe,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Satellite,
  Compass,
  MapPin,
  Calendar,
  Sun,
  Moon,
  ExternalLink,
  Sliders,
  Camera,
  Crosshair,
  Check,
  Table,
  FileText
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, dateRange }) {
  // Real dates directly queried from fires.db daily_summary table
  const benchmarkDates = [
    {
      date: '2021-04-01',
      spots: '18,566',
      maxBrightness: '394.7 K',
      avgBrightness: '329.8 K',
      totalFrp: '130,788 MW',
      note: 'Highest single-day active fire count recorded in the dataset'
    },
    {
      date: '2021-11-10',
      spots: '6,097',
      maxBrightness: '367.0 K',
      avgBrightness: '336.0 K',
      totalFrp: '50,123 MW',
      note: 'Post-monsoon seasonal agricultural residue burning peak'
    },
    {
      date: '2022-05-01',
      spots: '3,856',
      maxBrightness: '385.5 K',
      avgBrightness: '335.3 K',
      totalFrp: '36,871 MW',
      note: 'Early summer pre-monsoon dry season fire observations'
    },
    {
      date: '2021-04-15',
      spots: '2,286',
      maxBrightness: '376.6 K',
      avgBrightness: '325.5 K',
      totalFrp: '19,904 MW',
      note: 'Platform default observation date for map surveillance'
    },
    {
      date: '2023-03-30',
      spots: '1,603',
      maxBrightness: '382.6 K',
      avgBrightness: '334.8 K',
      totalFrp: '18,685 MW',
      note: 'Spring woodland and deciduous forest fire detections'
    }
  ];

  const features = [
    {
      icon: <Globe size={20} color="#ea580c" />,
      title: 'Interactive Leaflet Map',
      desc: 'Pan and zoom across the Indian subcontinent with dual basemaps: ESRI World Imagery satellite basemap and OpenStreetMap cartography.'
    },
    {
      icon: <Flame size={20} color="#ea580c" />,
      title: 'Thermal Brightness & FRP Scaling',
      desc: 'Hotspots are scaled by relative brightness with three-tier color gradation: Yellow (moderate), Orange (high), and Red (severe > 375 K).'
    },
    {
      icon: <Sun size={20} color="#ea580c" />,
      title: 'Diurnal Cycle Filtering',
      desc: 'Filter fire observations by satellite overpass period: Daytime (D), Nighttime (N), or All observations combined.'
    },
    {
      icon: <Crosshair size={20} color="#ea580c" />,
      title: 'Live Coordinates HUD & Inspector',
      desc: 'Real-time mouse crosshair tracking shows geographic coordinates (LAT / LON). Click any marker to inspect sensor, FRP, confidence, and UTC time.'
    },
    {
      icon: <Calendar size={20} color="#ea580c" />,
      title: 'Burning Activity Calendar',
      desc: 'Multi-year matrix heatmap grouped by year and month (2020–2026), paired with a daily calendar view for identifying seasonal fire patterns.'
    },
    {
      icon: <Camera size={20} color="#ea580c" />,
      title: 'Map Screenshot Export',
      desc: 'Direct PNG export of the current map extent and rendered hotspots using html-to-image for research notes and documentation.'
    }
  ];

  const schemaColumns = [
    { name: 'latitude', type: 'REAL', desc: 'WGS-84 geographic latitude coordinate (6.5° N to 37.5° N)' },
    { name: 'longitude', type: 'REAL', desc: 'WGS-84 geographic longitude coordinate (68.0° E to 97.5° E)' },
    { name: 'brightness', type: 'REAL', desc: 'Brightness temperature of active fire pixel measured in Kelvin (K)' },
    { name: 'frp', type: 'REAL', desc: 'Fire Radiative Power measured in Megawatts (MW)' },
    { name: 'acq_date', type: 'TEXT', desc: 'Acquisition date of satellite observation (YYYY-MM-DD)' },
    { name: 'acq_time', type: 'INTEGER', desc: 'Acquisition time in UTC (HHMM format)' },
    { name: 'daynight', type: 'TEXT', desc: 'Diurnal overpass period: "D" for Daytime, "N" for Nighttime' },
    { name: 'confidence_cat', type: 'TEXT', desc: 'Harmonized confidence classification: "l" (low), "n" (nominal), "h" (high)' },
    { name: 'instrument', type: 'TEXT', desc: 'Sensor platform: "SNPP (SNPP)", "MODIS (Aqua)", or "MODIS (Terra)"' }
  ];

  const pipelineSteps = [
    {
      step: '1',
      file: 'clean_data.py',
      title: 'Boundary Filter & Normalization',
      desc: 'Reads raw MODIS and VIIRS CSV files, filters coordinates to India bounding box (6.5–37.5° N, 68.0–97.5° E), handles missing FRP values, and maps MODIS numeric confidence percentages to categories (l, n, h).'
    },
    {
      step: '2',
      file: 'harmonize_data.py',
      title: 'Spatial Grid Deduplication',
      desc: 'Merges cleaned datasets and groups observations into ~1.1 km² spatial grid cells (rounded to 2 decimal places). Deduplicates records sharing the same cell and acquisition date, keeping the detection with the highest FRP.'
    },
    {
      step: '3',
      file: 'merge_col.py',
      title: 'Satellite Metadata Standardization',
      desc: 'Harmonizes sensor labels into standardized instrument tags: MODIS (Aqua), MODIS (Terra), and SNPP (SNPP) for consistent querying.'
    },
    {
      step: '4',
      file: 'prepare_db.py',
      title: 'Indexed SQLite Storage',
      desc: 'Inserts 3,285,447 rows into data/processed/fires.db, builds a composite B-tree index on (acq_date, daynight), and creates the pre-aggregated daily_summary table for instant calendar loading.'
    },
    {
      step: '5',
      file: 'server.py',
      title: 'Zero-Dependency API Server',
      desc: 'Lightweight Python http.server module serving /api/fires, /api/dates, /api/calendar, and /api/monthly directly from SQLite with sub-15ms response latency.'
    }
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

      {/* TOP HEADER NAVIGATION */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#ea580c',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                FireSync
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#ea580c',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '1px 7px',
                borderRadius: '4px'
              }}>
                NASA FIRMS
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Active Fire Surveillance & Analytics Platform
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#stats" style={{ color: '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Dataset Overview
          </a>
          <a href="#features" style={{ color: '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Features
          </a>
          <a href="#sample-dates" style={{ color: '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Observation Dates
          </a>
          <a href="#pipeline" style={{ color: '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Pipeline
          </a>
          <a href="#schema" style={{ color: '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Data Schema
          </a>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onLaunchApp('calendar')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
            <Calendar size={14} color="#ea580c" />
            Activity Calendar
          </button>
          <button
            onClick={() => onLaunchApp('surveillance')}
            style={{
              backgroundColor: '#ea580c',
              border: '1px solid #ea580c',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 1px 2px rgba(234, 88, 12, 0.2)'
            }}>
            <Flame size={15} />
            Open Interactive Map
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '56px 24px 44px',
        textAlign: 'center'
      }}>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '4px 10px',
          marginBottom: '20px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#475569'
        }}>
          <Database size={13} color="#ea580c" />
          <span>NASA FIRMS Active Fire Hotspots &bull; India Region (2020&ndash;2026)</span>
        </div>

        <h1 style={{
          fontSize: '44px',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          color: '#0f172a',
          maxWidth: '860px',
          margin: '0 auto 16px'
        }}>
          Harmonized Satellite Active Fire Intelligence & Geospatial Monitoring
        </h1>

        <p style={{
          fontSize: '17px',
          color: '#475569',
          lineHeight: 1.6,
          maxWidth: '780px',
          margin: '0 auto 32px'
        }}>
          Ingests, standardizes, and visualizes active fire detections from NASA MODIS and VIIRS satellite sensors. Provides high-speed indexed spatial filtering, thermal radiative power metrics, and diurnal cycle analysis across India.
        </p>

        {/* Hero Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <button
            onClick={() => onLaunchApp('surveillance')}
            style={{
              backgroundColor: '#ea580c',
              border: 'none',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)'
            }}>
            <Flame size={17} />
            Launch Map Surveillance
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => onLaunchApp('calendar')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '12px 22px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
            <Calendar size={16} color="#ea580c" />
            View Activity Calendar
          </button>
        </div>

        {/* APPLICATION WORKSPACE PREVIEW CARD (Clean Light Card) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginLeft: '6px' }}>
                Application Workspace Overview
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              SQLite Database: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>fires.db</code> (3.28M rows)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bounding Box</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                6.5° N &ndash; 37.5° N, 68.0° E &ndash; 97.5° E
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>India Geographic Bounds</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Satellite Constellations</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                MODIS (Terra/Aqua) + VIIRS (SNPP)
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>NASA FIRMS Ingested Feeds</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Database Query Speed</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', marginTop: '4px' }}>
                Sub-15ms Response Time
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>B-Tree Index on (acq_date, daynight)</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Default Inspection Date</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#ea580c', marginTop: '4px' }}>
                2021-04-15 (2,286 Spots)
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Date range: 2020-11-01 to 2026-11-02</div>
            </div>
          </div>
        </div>

      </section>

      {/* STATS STRIP (Real counts from fires.db) */}
      <section id="stats" style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '36px 24px'
      }}>
        <div style={{
          maxWidth: '1160px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '24px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              3,285,447
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              Harmonized Fire Records
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Ingested & Deduplicated
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.02em' }}>
              2,782,569
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              VIIRS Detections
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Suomi-NPP Platform
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>
              502,878
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              MODIS Detections
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Aqua (340k) & Terra (162k)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              2,191
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              Observation Days
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Nov 1, 2020 &ndash; Nov 2, 2026
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>
              ~1.1 km²
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
              Grid Cell Resolution
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Spatial Deduplication Binning
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '64px 24px'
      }}>
        <div style={{ marginBottom: '36px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#ea580c',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Capabilities
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
            Built-in Web Application Features
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0, maxWidth: '680px' }}>
            The frontend connects to the local SQLite backend to provide high-framerate map rendering and analytical filters.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {features.map((feat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}>
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                width: '38px',
                height: '38px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* REAL SAMPLE DATES SECTION (VERIFIED FROM DATABASE) */}
      <section id="sample-dates" style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#ea580c',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Database Observations
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px', marginBottom: '6px' }}>
                Sample Observation Dates in Dataset
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, maxWidth: '640px' }}>
                Exact statistics queried directly from the SQLite <code>daily_summary</code> table. Click any row to launch the map on that date.
              </p>
            </div>

            <button
              onClick={() => onLaunchApp('calendar')}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
              <Calendar size={14} color="#ea580c" />
              Explore All 2,191 Dates in Heatmap
            </button>
          </div>

          {/* Table of Real Dates */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Active Spots</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Peak Brightness</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Avg Brightness</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Total FRP</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Context</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkDates.map((b, idx) => (
                  <tr key={idx} style={{
                    borderBottom: idx < benchmarkDates.length - 1 ? '1px solid #f1f5f9' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {b.date}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ea580c' }}>
                      {b.spots}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {b.maxBrightness}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {b.avgBrightness}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {b.totalFrp}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {b.note}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => onLaunchApp('surveillance', b.date)}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #ea580c',
                          color: '#ea580c',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                        Load Map <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* DATA PIPELINE ARCHITECTURE (Directly matching repository scripts) */}
      <section id="pipeline" style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '64px 24px'
      }}>
        <div style={{ marginBottom: '36px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#ea580c',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Data Engineering
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
            Pipeline & Processing Flow
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0, maxWidth: '680px' }}>
            The data pipeline transforms raw NASA FIRMS CSV archive and near-real-time files into an indexed SQLite database.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '18px 20px',
                display: 'grid',
                gridTemplateColumns: '40px 220px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step.step}
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ea580c', marginTop: '2px' }}>
                  {step.file}
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DATABASE SCHEMA & SENSOR SPECIFICATION */}
      <section id="schema" style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '28px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#ea580c',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              Reference
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              SQLite Table Schema: <code style={{ fontSize: '22px', color: '#0f172a' }}>fires</code>
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Schema attributes in <code>data/processed/fires.db</code> populated by <code>prepare_db.py</code>:
            </p>
          </div>

          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Column</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Data Type</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 700, fontSize: '12px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {schemaColumns.map((col, idx) => (
                  <tr key={idx} style={{
                    borderBottom: idx < schemaColumns.length - 1 ? '1px solid #f1f5f9' : 'none',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#ea580c' }}>
                      {col.name}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                      {col.type}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#334155' }}>
                      {col.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* QUICK LAUNCH CALLOUT */}
      <section style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '56px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '40px 32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Ready to explore satellite active fire detections?
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '580px', margin: '0 auto 24px' }}>
            Open the full-screen interactive surveillance map or explore the multi-year burning calendar.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => onLaunchApp('surveillance')}
              style={{
                backgroundColor: '#ea580c',
                border: 'none',
                color: '#ffffff',
                padding: '11px 22px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
              <Flame size={16} />
              Open Interactive Map
            </button>
            <button
              onClick={() => onLaunchApp('calendar')}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '11px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
              <Calendar size={15} color="#ea580c" />
              Open Activity Calendar
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '24px 32px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1160px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={15} color="#ea580c" />
            <strong style={{ color: '#0f172a' }}>FireSync</strong>
            <span>&bull; NASA FIRMS Active Fire Surveillance & Analytics Platform</span>
          </div>
          <div>
            Data: NASA FIRMS (MODIS & VIIRS) &bull; Coordinates: India Bounding Box (WGS-84) &bull; Backend: SQLite3
          </div>
        </div>
      </footer>

    </div>
  );
}
