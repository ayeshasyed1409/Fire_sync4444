import React, { useState } from 'react';
import {
  Flame,
  Globe,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  Radio,
  Database,
  Cpu,
  Satellite,
  Compass,
  MapPin,
  BarChart2,
  CheckCircle2,
  Clock,
  Calendar,
  Sun,
  Moon,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, dateRange }) {
  const [activeTabOverview, setActiveTabOverview] = useState('pipeline');
  const [selectedBenchmark, setSelectedBenchmark] = useState(0);

  const benchmarks = [
    {
      date: '2021-04-15',
      title: 'Spring Peak Fire Outbreak',
      tag: 'Forest & Agricultural Blaze',
      season: 'Pre-Monsoon Dry Period',
      spots: '24,200+',
      maxBrightness: '412.1 K',
      frp: '84,500 MW',
      description: 'Widespread agrarian field clearing combined with dry deciduous forest fires across central and eastern India. One of the highest single-day active fire totals on record.',
      highlights: ['Intense central forest belt clusters', 'Elevated diurnal daytime radiative power', 'Multi-sensor high confidence detections']
    },
    {
      date: '2022-05-01',
      title: 'Pre-Monsoon Severe Heatwave',
      tag: 'Extreme Temperature Surge',
      season: 'Record High Temperatures',
      spots: '19,850+',
      maxBrightness: '432.5 K',
      frp: '78,200 MW',
      description: 'Triggered by anomalous early summer heatwave conditions. Widespread brush fires and high-intensity forest hotspots in deciduous woodlands with extreme thermal signatures.',
      highlights: ['Extreme thermal brightness peak (>430 K)', 'Widespread northern and central scrub fires', 'Day & Night prolonged smoldering']
    },
    {
      date: '2021-11-10',
      title: 'Post-Monsoon Agricultural Stubble Burn',
      tag: 'Crop Residue Burning',
      season: 'North India Harvest Cycle',
      spots: '18,400+',
      maxBrightness: '378.4 K',
      frp: '62,900 MW',
      description: 'Massive seasonal crop residue management across Punjab and Haryana plains following the Kharif rice harvest. High-density clustered agricultural hotspots with significant nocturnal activity.',
      highlights: ['Dense spatial clustering along river basins', 'Rapid episodic spike in fire radiative power', 'Distinct MODIS & VIIRS simultaneous overpasses']
    },
    {
      date: '2023-03-30',
      title: 'Central Highlands Forest Fire Surge',
      tag: 'Woodland Thermal Cluster',
      season: 'Early Dry Season',
      spots: '14,600+',
      maxBrightness: '396.2 K',
      frp: '54,300 MW',
      description: 'Clustered wildfire hotspots concentrated across mountainous and wildlife corridor zones in Madhya Pradesh, Chhattisgarh, and Odisha, tracked continuously via VIIRS and MODIS sweeps.',
      highlights: ['High Fire Radiative Power (FRP) per cluster', 'Rugged terrain localized thermal signatures', 'VIIRS 375m high spatial resolution detection']
    }
  ];

  const features = [
    {
      icon: <Layers size={22} color="#f97316" />,
      title: 'Multi-Sensor Data Harmonization',
      desc: 'Seamlessly merges NASA MODIS (1km) and VIIRS (375m) feeds. Normalizes divergent confidence metrics (Low, Nominal, High) and performs 1.1 km² grid deduplication.'
    },
    {
      icon: <Zap size={22} color="#f97316" />,
      title: 'Sub-15ms Spatial Query Engine',
      desc: 'Pre-indexed B-tree spatial and temporal SQLite database capable of scanning across 3.25M+ active fire observations with instant sub-15ms response times.'
    },
    {
      icon: <Flame size={22} color="#f97316" />,
      title: 'Relative Brightness & FRP Scaling',
      desc: 'Dynamic marker radiuses and gradient thermal glows mapped to brightness in Kelvin and Fire Radiative Power (MW) for immediate visual triage of severe blazes.'
    },
    {
      icon: <Moon size={22} color="#f97316" />,
      title: 'Diurnal Overpass Dissection',
      desc: 'Filter between daytime and nighttime satellite orbits to isolate solar-influenced agricultural burns from nocturnal smoldering forest fires.'
    },
    {
      icon: <Calendar size={22} color="#f97316" />,
      title: 'Spatiotemporal Activity Calendar',
      desc: 'Interactive 7-year multi-matrix heatmaps and daily distribution calendars illustrating seasonal burning cycles and multi-annual shifts.'
    },
    {
      icon: <Globe size={22} color="#f97316" />,
      title: 'Dual Cartographic Perspectives',
      desc: 'Effortlessly switch between ESRI World Imagery high-resolution satellite imagery and clean OpenStreetMap vector cartography on the fly.'
    }
  ];

  const pipelineSteps = [
    {
      step: '01',
      title: 'Telemetry Ingestion',
      source: 'NASA FIRMS Satellites',
      desc: 'Ingests near-real-time (NRT) and multi-year archival feeds from MODIS (Terra & Aqua) and VIIRS (Suomi-NPP) constellations.'
    },
    {
      step: '02',
      title: 'Data Scrubbing & Cleaning',
      source: 'Coordinate & Attribute Sanitizer',
      desc: 'Filters null values, standardizes geographic coordinate bounds (WGS-84), and normalizes acquisition timestamps into UTC standards.'
    },
    {
      step: '03',
      title: 'Spatial-Temporal Fusion',
      source: '~1.1 km² Grid Harmonization',
      desc: 'Deduplicates overlapping sensor sweeps within matching spatio-temporal cells, retaining records with highest Fire Radiative Power (FRP).'
    },
    {
      step: '04',
      title: 'Indexed Database Engine',
      source: 'Optimized SQLite Storage',
      desc: 'Stores 3.25M+ harmonized rows with composite B-tree indices on acquisition date, diurnal cycle, and thermal radiance.'
    },
    {
      step: '05',
      title: 'Interactive Web Surveillance',
      source: 'React 19 & Leaflet Client',
      desc: 'Renders dynamic hotspots with adaptive Kelvin color ramps, popups, and analytical control panels at 60 FPS.'
    }
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#06090e',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative'
    }}>

      {/* AMBIENT GLOW EFFECTS */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(234, 88, 12, 0.05) 50%, rgba(6, 9, 14, 0) 75%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* TOP NAVIGATION BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(6, 9, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)'
          }}>
            <Flame size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
                FireSync
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(249, 115, 22, 0.35)'
              }}>
                NASA FIRMS
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Satellite Active Fire Surveillance & Analytics
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#overview" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}>
            Overview
          </a>
          <a href="#features" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}>
            Features
          </a>
          <a href="#benchmarks" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}>
            Outbreak Archive
          </a>
          <a href="#pipeline" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}>
            Pipeline
          </a>
          <a href="#sensors" style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}>
            Sensor Specs
          </a>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onLaunchApp('calendar')}
            className="btn-secondary-hover"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}>
            <Calendar size={15} color="#fb923c" />
            Burning Calendar
          </button>
          <button
            onClick={() => onLaunchApp('surveillance')}
            className="btn-primary-hover"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(249, 115, 22, 0.45)'
            }}>
            <Flame size={16} />
            Launch Live Map
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="overview" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '70px 32px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.28)',
          borderRadius: '999px',
          padding: '6px 16px',
          marginBottom: '24px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 10px #22c55e'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fed7aa', letterSpacing: '0.03em' }}>
            NASA FIRMS Multi-Satellite Surveillance • 3.25M+ Records Harmonized
          </span>
        </div>

        {/* Hero Headline */}
        <h1 style={{
          fontSize: '56px',
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.04em',
          maxWidth: '960px',
          marginBottom: '20px',
          background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Global Satellite Fire Intelligence & Real-Time Monitoring
        </h1>

        {/* Hero Subtitle */}
        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: '760px',
          marginBottom: '36px'
        }}>
          A high-performance geospatial analytics platform that ingests, cleans, harmonizes, and visualizes active fire detections from NASA MODIS and VIIRS satellite sensors. Delivering sub-15ms spatial queries across multi-year telemetry.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '56px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onLaunchApp('surveillance')}
            className="btn-primary-hover"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '15px 32px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 30px rgba(249, 115, 22, 0.45)'
            }}>
            <Flame size={19} />
            Explore Interactive Map
            <ArrowRight size={17} />
          </button>

          <button
            onClick={() => onLaunchApp('calendar')}
            className="btn-secondary-hover"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              padding: '15px 28px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              backdropFilter: 'blur(10px)'
            }}>
            <Calendar size={18} color="#fb923c" />
            Burning Activity Heatmap
          </button>
        </div>

        {/* HERO INTERACTIVE RADAR & TELEMETRY PREVIEW CARD */}
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          background: 'linear-gradient(180deg, rgba(17, 26, 40, 0.85) 0%, rgba(12, 18, 29, 0.95) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(249, 115, 22, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          {/* Top telemetry bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginLeft: '6px' }}>
                FIRMS Telemetry Terminal • Live Spatial Surveillance View
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Radio size={13} color="#22c55e" /> Online Feed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Database size={13} color="#f97316" /> SQLite Indexed (3.25M)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="#60a5fa" /> Sub-15ms Latency
              </span>
            </div>
          </div>

          {/* Simulated Satellite Surveillance Radar Display */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1.2fr',
            gap: '20px',
            textAlign: 'left'
          }}>
            {/* Visual Screen Box */}
            <div style={{
              background: '#090e17',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Radar Grid Graphic Background */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(rgba(249, 115, 22, 0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                opacity: 0.6
              }} />

              {/* Glowing Hotspot Nodes */}
              <div className="animate-pulse-glow" style={{
                position: 'absolute',
                top: '42%',
                left: '38%',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ff3b00',
                boxShadow: '0 0 25px 6px #ff3b00, 0 0 50px 15px rgba(249, 115, 22, 0.5)'
              }} />
              <div className="animate-pulse-glow" style={{
                position: 'absolute',
                top: '36%',
                left: '52%',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#f97316',
                boxShadow: '0 0 18px 4px #f97316',
                animationDelay: '0.6s'
              }} />
              <div className="animate-pulse-glow" style={{
                position: 'absolute',
                top: '58%',
                left: '60%',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#fb923c',
                boxShadow: '0 0 20px 4px #fb923c',
                animationDelay: '1.2s'
              }} />
              <div className="animate-pulse-glow" style={{
                position: 'absolute',
                top: '25%',
                left: '28%',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ff3b00',
                boxShadow: '0 0 15px 3px #ff3b00',
                animationDelay: '1.8s'
              }} />

              {/* Top overlay tag */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  color: '#fb923c',
                  border: '1px solid rgba(249, 115, 22, 0.35)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  Surveillance Grid: WGS-84 (India Bounds)
                </span>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  Relative Radiance: Kelvin Scaling [300 K → 500 K]
                </p>
              </div>

              {/* Bottom Quick Trigger */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(12, 18, 29, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Active Hotspot Sample
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    Coords: 21.8492° N, 81.3912° E • 412.1 K • 94.2 MW
                  </div>
                </div>
                <button
                  onClick={() => onLaunchApp('surveillance', '2021-04-15')}
                  style={{
                    background: '#f97316',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                  Inspect Date <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Live Metrics Telemetry Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Fire Hotspots Harmonized
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f97316', marginTop: '2px' }}>
                    3,258,122
                  </div>
                </div>
                <Flame size={26} color="#f97316" />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Query Latency Across 3.25M
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
                    &lt; 15 ms
                  </div>
                </div>
                <Zap size={26} color="#22c55e" />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Spatial Resolution
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#cbd5e1', marginTop: '2px' }}>
                    ~1.1 km² Deduplicated
                  </div>
                </div>
                <Compass size={26} color="#60a5fa" />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Telemetry Constellations
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    MODIS (Terra/Aqua) + VIIRS (SNPP)
                  </div>
                </div>
                <Satellite size={26} color="#a855f7" />
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* METRICS COUNTER STRIP */}
      <section style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#090e17',
        padding: '36px 32px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#f97316', letterSpacing: '-0.03em' }}>
              3.25M+
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
              Active Fire Detections
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Multi-Year NASA FIRMS Feeds
            </div>
          </div>

          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.03em' }}>
              &lt; 15ms
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
              Spatial Query Latency
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Indexed SQLite B-Tree Engine
            </div>
          </div>

          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.03em' }}>
              1.1 km²
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
              Harmonized Grid Precision
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Spatio-Temporal Deduplication
            </div>
          </div>

          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#a855f7', letterSpacing: '-0.03em' }}>
              2,126+
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
              Days of Surveillance
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              2020 through 2026 Archive
            </div>
          </div>

          <div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em' }}>
              2 Sensor
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
              Constellations Unified
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              MODIS + VIIRS Satellite Fusion
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '90px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#f97316',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'rgba(249, 115, 22, 0.1)',
            padding: '4px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(249, 115, 22, 0.25)'
          }}>
            Engine Architecture
          </span>
          <h2 style={{
            fontSize: '38px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginTop: '14px',
            marginBottom: '12px'
          }}>
            Engineered for Massive Satellite Thermal Telemetry
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            Transforming unstructured, disparate raw NASA FIRMS satellite observations into an indexed, ultra-responsive surveillance platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="landing-interactive-card"
              style={{
                background: 'rgba(17, 26, 40, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
                position: 'relative'
              }}>
              <div style={{
                background: 'rgba(249, 115, 22, 0.12)',
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid rgba(249, 115, 22, 0.25)'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORICAL OUTBREAK BENCHMARKS (INTERACTIVE CASE STUDIES) */}
      <section id="benchmarks" style={{
        background: '#090e17',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '90px 32px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#fb923c',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Historical Case Studies
              </span>
              <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '8px', color: '#f8fafc' }}>
                Benchmark Outbreaks in Indian Subcontinent
              </h2>
              <p style={{ fontSize: '15px', color: '#94a3b8', margin: '6px 0 0', maxWidth: '600px' }}>
                Select an outbreak below to inspect the telemetry and launch directly into that date in the interactive surveillance map.
              </p>
            </div>

            <button
              onClick={() => onLaunchApp('calendar')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
              <Calendar size={15} color="#f97316" />
              View Full 2,100+ Day Heatmap
            </button>
          </div>

          {/* Benchmark Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {benchmarks.map((b, idx) => (
              <div
                key={idx}
                className="landing-interactive-card"
                style={{
                  background: selectedBenchmark === idx ? 'rgba(249, 115, 22, 0.08)' : 'rgba(17, 26, 40, 0.6)',
                  border: `1px solid ${selectedBenchmark === idx ? 'rgba(249, 115, 22, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: selectedBenchmark === idx ? '0 10px 30px rgba(249, 115, 22, 0.15)' : 'none'
                }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#fb923c',
                      background: 'rgba(249, 115, 22, 0.15)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(249, 115, 22, 0.3)'
                    }}>
                      {b.tag}
                    </span>
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>
                      {b.date}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                    {b.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '18px' }}>
                    {b.description}
                  </p>

                  {/* Outbreak Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Active Spots</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f97316' }}>{b.spots}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Peak Brightness</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{b.maxBrightness}</div>
                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '22px' }}>
                    {b.highlights.map((h, hIdx) => (
                      <div key={hIdx} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#cbd5e1' }}>
                        <CheckCircle2 size={13} color="#22c55e" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onLaunchApp('surveillance', b.date)}
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.35)',
                    transition: 'all 0.15s'
                  }}>
                  Inspect On Map ({b.date})
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* END-TO-END DATA PIPELINE ARCHITECTURE */}
      <section id="pipeline" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '90px 32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#60a5fa',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'rgba(96, 165, 250, 0.1)',
            padding: '4px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(96, 165, 250, 0.25)'
          }}>
            Technical Pipeline
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '14px', marginBottom: '12px' }}>
            From Raw Orbit Sweeps to 60 FPS Surveillance
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            How FireSync digests multi-gigabyte raw NASA satellite CSV records into an indexed, lightning-fast geospatial database.
          </p>
        </div>

        {/* Pipeline Steps Sequence */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          position: 'relative'
        }}>
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="landing-interactive-card"
              style={{
                background: 'rgba(17, 26, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: 'rgba(249, 115, 22, 0.35)',
                fontFamily: 'monospace',
                marginBottom: '12px'
              }}>
                {step.step}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                {step.title}
              </h4>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f97316', marginBottom: '12px' }}>
                {step.source}
              </span>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SATELLITE SENSOR SPECS COMPARISON */}
      <section id="sensors" style={{
        background: '#090e17',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '90px 32px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#a855f7',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              background: 'rgba(168, 85, 247, 0.1)',
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}>
              Sensor Telemetry Matrix
            </span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '14px', marginBottom: '12px' }}>
              MODIS vs VIIRS vs FireSync Fusion
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
              Why uniting both sensor constellations delivers superior accuracy, completeness, and historical continuity.
            </p>
          </div>

          <div style={{
            background: 'rgba(17, 26, 40, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Attribute</th>
                  <th style={{ padding: '16px 20px', color: '#fb923c', fontWeight: 700 }}>MODIS (Terra & Aqua)</th>
                  <th style={{ padding: '16px 20px', color: '#60a5fa', fontWeight: 700 }}>VIIRS (Suomi-NPP)</th>
                  <th style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 700 }}>FireSync Harmonized Engine</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>Spatial Resolution</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>1,000 m (1 km at nadir)</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>375 m (I-band nadir)</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 600 }}>Unified ~1.1 km² Grid Cell Binning</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>Thermal Radiometry</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>Channels 21, 22, 31 (4µm & 11µm)</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>Channels I4 & M13 (3.74µm & 4.05µm)</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 600 }}>Harmonized Brightness (K) & FRP (MW)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>Confidence Categorization</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>0% to 100% Numeric Score</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>Categorical Flags ('l', 'n', 'h')</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 600 }}>Standardized 3-Tier Classification</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>Overpass Redundancy</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>2x Daily (10:30 & 22:30 UTC)</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>2x Daily (01:30 & 13:30 UTC)</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 600 }}>Deduplicated Max-FRP Selection</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>Historical Span</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>Archive from 2000 onwards</td>
                  <td style={{ padding: '16px 20px', color: '#94a3b8' }}>Archive from 2012 onwards</td>
                  <td style={{ padding: '16px 20px', color: '#22c55e', fontWeight: 600 }}>Continuous Unified Time Series</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '100px 32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(17, 26, 40, 0.8) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '24px',
          padding: '60px 36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 35px rgba(249, 115, 22, 0.15)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 25px rgba(249, 115, 22, 0.5)'
          }}>
            <Flame size={28} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '16px', color: '#ffffff' }}>
            Ready to Launch Satellite Fire Surveillance?
          </h2>

          <p style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 36px', lineHeight: 1.6 }}>
            Explore 3.25M+ active fire observations interactively with dynamic thermal glow, diurnal filtering, and historical anomaly calendars.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onLaunchApp('surveillance')}
              className="btn-primary-hover"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '16px 36px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 30px rgba(249, 115, 22, 0.5)'
              }}>
              <Flame size={20} />
              Launch Interactive Map
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onLaunchApp('calendar')}
              className="btn-secondary-hover"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                padding: '16px 30px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}>
              <Calendar size={18} color="#fb923c" />
              Burning Activity Heatmap
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#04070a',
        padding: '40px 36px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={16} color="#f97316" />
            <strong style={{ color: '#f8fafc', fontSize: '13px' }}>FireSync</strong>
            <span>— Global Satellite Fire Intelligence & Monitoring Platform</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Data Source: <strong>NASA FIRMS (MODIS & VIIRS)</strong></span>
            <span>Engine: <strong>SQLite3 B-Tree Indexed</strong></span>
            <span>Coverage: <strong>2020 – 2026</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
