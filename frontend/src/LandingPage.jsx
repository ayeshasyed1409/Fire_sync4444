import React from 'react';
import {
  Flame,
  Globe,
  ArrowRight,
  Database,
  Calendar,
  Sun,
  Camera,
  Crosshair,
  Satellite,
  Archive as ArchiveIcon,
  Download
} from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
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
      desc: 'Dedicated full-page matrix heatmap grouped by year and month (2020–2026), paired with a daily calendar view for identifying seasonal fire patterns.'
    },
    {
      icon: <Camera size={20} color="#ea580c" />,
      title: 'Map Screenshot Export',
      desc: 'Direct PNG export of the current map extent and rendered hotspots using html-to-image for research notes and documentation.'
    },
    {
      icon: <ArchiveIcon size={20} color="#ea580c" />,
      title: 'Data Archive & CSV Export',
      desc: 'Filter observations by custom date spans, satellite sensors, and fire classification types (0, 1, 2, 3, -1) to download complete CSV subsets.'
    }
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
      width: '100%',
      minHeight: '100%',
      backgroundColor: '#080d1a',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

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
          gap: '8px',
          backgroundColor: '#0d1527',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '5px 12px',
          marginBottom: '22px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#cbd5e1'
        }}>
          <Database size={13} color="#ea580c" />
          <span>NASA FIRMS Active Fire Hotspots &bull; India Region (2020&ndash;2026)</span>
        </div>

        <h1 style={{
          fontSize: '44px',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          color: '#f8fafc',
          maxWidth: '860px',
          margin: '0 auto 16px'
        }}>
          Harmonized Satellite Active Fire Intelligence & Geospatial Monitoring
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: '780px',
          margin: '0 auto 32px'
        }}>
          Ingests, standardizes, and visualizes active fire detections from NASA MODIS and VIIRS satellite sensors. Provides high-speed indexed spatial filtering, thermal radiative power metrics, and diurnal cycle analysis across India.
        </p>

        {/* Hero Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '44px' }}>
          <button
            onClick={() => onLaunchApp('map')}
            style={{
              backgroundColor: '#ea580c',
              border: 'none',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)'
            }}>
            <Flame size={16} />
            Launch Live Map
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => onLaunchApp('calendar')}
            style={{
              backgroundColor: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              padding: '12px 22px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
            <Calendar size={15} color="#ea580c" />
            View Activity Calendar
          </button>

          <button
            onClick={() => onLaunchApp('archive')}
            style={{
              backgroundColor: '#0d1527',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              padding: '12px 22px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
            <ArchiveIcon size={15} color="#ea580c" />
            Data Archive & Export
          </button>
        </div>

        {/* APPLICATION WORKSPACE OVERVIEW CARD */}
        <div style={{
          backgroundColor: '#0d1527',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginLeft: '6px' }}>
                Application Workspace Overview
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              SQLite Database: <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px', color: '#ea580c' }}>fires.db</code> (3.28M rows)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#131f38', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bounding Box</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                6.5° N &ndash; 37.5° N, 68.0° E &ndash; 97.5° E
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>India Geographic Bounds</div>
            </div>

            <div style={{ backgroundColor: '#131f38', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Satellite Constellations</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                MODIS (Terra/Aqua) + VIIRS (SNPP)
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>NASA FIRMS Ingested Feeds</div>
            </div>

            <div style={{ backgroundColor: '#131f38', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Database Query Speed</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
                Sub-15ms Response Time
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>B-Tree Index on (acq_date, daynight)</div>
            </div>

            <div style={{ backgroundColor: '#131f38', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Default Inspection Date</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ea580c', marginTop: '4px' }}>
                2021-04-15 (2,286 Spots)
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Date range: 2020-11-01 to 2026-11-02</div>
            </div>
          </div>
        </div>

      </section>

      {/* STATS STRIP */}
      <section style={{
        backgroundColor: '#0b1122',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              3,285,447
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
              Harmonized Fire Records
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Ingested & Deduplicated
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.02em' }}>
              2,782,569
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
              VIIRS Detections
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Suomi-NPP Platform
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.02em' }}>
              502,878
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
              MODIS Detections
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Aqua (340k) & Terra (162k)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              2,191
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
              Observation Days
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Nov 1, 2020 &ndash; Nov 2, 2026
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>
              ~1.1 km²
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
              Grid Cell Resolution
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Spatial Deduplication Binning
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section style={{
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
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '6px', marginBottom: '8px' }}>
            Built-in Web Application Features
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '680px' }}>
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
                backgroundColor: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column'
              }}>
              <div style={{
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA PIPELINE ARCHITECTURE */}
      <section style={{
        backgroundColor: '#0b1122',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '64px 24px'
      }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
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
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '6px', marginBottom: '8px' }}>
              Pipeline & Processing Flow
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '680px' }}>
              The data pipeline transforms raw NASA FIRMS CSV archive and near-real-time files into an indexed SQLite database.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#0d1527',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
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
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {step.step}
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ea580c', marginTop: '2px' }}>
                    {step.file}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: '#080d1a',
        padding: '28px 32px',
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
            <strong style={{ color: '#f8fafc' }}>FireSync</strong>
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
