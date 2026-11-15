import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Sun, 
  Moon, 
  Calendar as CalendarIcon, 
  Layers, 
  Activity, 
  RefreshCw,
  Maximize2,
  Sliders,
  Globe,
  Eye,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ActivityCalendar from './ActivityCalendar.jsx';

// Fix default Leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const INITIAL_CENTER = [22.5937, 78.9629];
const INITIAL_BOUNDS = [
  [6.5, 68.0],
  [37.5, 97.5]
];

export default function App() {
  const [activeTab, setActiveTab] = useState('surveillance'); // 'surveillance' | 'calendar'
  const [date, setDate] = useState('2021-04-15');
  const [daynight, setDaynight] = useState('ALL');
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ min_date: '2020-11-01', max_date: '2026-08-31', total_dates: 2126 });
  const [stats, setStats] = useState({ count: 0, maxBrightness: 0, avgBrightness: 0, totalFrp: 0 });
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapLayer, setMapLayer] = useState('satellite');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INITIAL_CENTER,
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const initialTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; NASA FIRMS Active Fire Hotspots',
      maxZoom: 18
    }).addTo(map);

    tileLayerRef.current = initialTile;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newTile;
    if (mapLayer === 'standard') {
      newTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
    } else {
      newTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; NASA FIRMS Active Fire Hotspots',
        maxZoom: 18
      });
    }

    newTile.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapLayer]);

  // Fetch available dates on mount
  useEffect(() => {
    fetch('/api/dates')
      .then(res => res.json())
      .then(data => {
        if (data.min_date) {
          setDateRange(data);
        }
      })
      .catch(err => console.error("Could not fetch date range:", err));
  }, []);

  // Fetch fire records
  useEffect(() => {
    setLoading(true);
    fetch(`/api/fires?date=${date}&daynight=${daynight}`)
      .then(res => res.json())
      .then(data => {
        const fireData = data.fires || [];
        setFires(fireData);

        if (fireData.length > 0) {
          let maxB = 0;
          let sumB = 0;
          let sumFrp = 0;
          for (let f of fireData) {
            if (f.brightness > maxB) maxB = f.brightness;
            sumB += f.brightness;
            sumFrp += f.frp || 0;
          }
          setStats({
            count: fireData.length,
            maxBrightness: maxB.toFixed(1),
            avgBrightness: (sumB / fireData.length).toFixed(1),
            totalFrp: sumFrp.toFixed(1)
          });
        } else {
          setStats({ count: 0, maxBrightness: 0, avgBrightness: 0, totalFrp: 0 });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching fires:", err);
        setLoading(false);
      });
  }, [date, daynight]);

  // Render Static Hotspot Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (fires.length === 0) return;

    let minB = Infinity;
    let maxB = -Infinity;
    for (let f of fires) {
      if (f.brightness < minB) minB = f.brightness;
      if (f.brightness > maxB) maxB = f.brightness;
    }
    const bSpan = (maxB - minB) || 1;

    fires.forEach((fire) => {
      const relBrightness = Math.max(0, Math.min(1, (fire.brightness - minB) / bSpan));
      const radius = 4 + (relBrightness * 9);
      const fillOpacity = 0.55 + (relBrightness * 0.4);
      const color = relBrightness > 0.7 ? '#ff3b00' : (relBrightness > 0.35 ? '#f97316' : '#fb923c');

      const circle = L.circleMarker([fire.lat, fire.lon], {
        radius: radius,
        fillColor: color,
        color: '#ffedd5',
        weight: relBrightness > 0.6 ? 1.5 : 0.8,
        opacity: 0.95,
        fillOpacity: fillOpacity
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f97316;"></span>
            <strong style="font-size: 13px; color:#ffedd5;">Thermal Detection</strong>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size: 12px; color:#cbd5e1;">
            <div><strong>Location:</strong> ${fire.lat.toFixed(4)}, ${fire.lon.toFixed(4)}</div>
            <div><strong>Brightness:</strong> <span style="color:#fb923c; font-weight:700;">${fire.brightness} K</span></div>
            <div><strong>FRP:</strong> ${fire.frp} MW</div>
            <div><strong>Time:</strong> ${String(fire.time).padStart(4, '0')} UTC</div>
            <div><strong>Cycle:</strong> ${fire.daynight === 'D' ? 'Day' : 'Night'}</div>
            <div><strong>Confidence:</strong> ${fire.confidence.toUpperCase()}</div>
          </div>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); font-size: 11px; color:#94a3b8;">
            Sensor: <strong>${fire.instrument}</strong>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => setSelectedFire(fire));
      layer.addLayer(circle);
    });
  }, [fires]);

  const fitBounds = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(INITIAL_BOUNDS);
    }
  };

  const handleSelectDateFromCalendar = (newDate) => {
    setDate(newDate);
    setActiveTab('surveillance');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#06090e', overflow: 'hidden' }}>
      
      {/* LEFT: MAP SURVEILLANCE VIEW */}
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Top Navbar / Brand Badge */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          zIndex: 1000,
          background: 'rgba(12, 18, 29, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(249, 115, 22, 0.45)'
          }}>
            <Flame size={19} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                FireSync
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}>
                NASA FIRMS
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Global Active Fire Surveillance & Harmonization
            </p>
          </div>
        </div>

        {/* Map View Mode Controls */}
        <div style={{
          position: 'absolute',
          bottom: '22px',
          left: '70px',
          zIndex: 1000,
          background: 'rgba(12, 18, 29, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '4px',
          display: 'flex',
          gap: '4px'
        }}>
          <button 
            onClick={() => setMapLayer('satellite')}
            style={{
              background: mapLayer === 'satellite' ? '#f97316' : 'transparent',
              color: mapLayer === 'satellite' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}>
            Satellite
          </button>
          <button 
            onClick={() => setMapLayer('standard')}
            style={{
              background: mapLayer === 'standard' ? '#f97316' : 'transparent',
              color: mapLayer === 'standard' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}>
            Standard
          </button>
          <button 
            onClick={fitBounds}
            title="Focus Initial Area"
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}>
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Floating Brightness Legend on Map */}
        <div style={{
          position: 'absolute',
          bottom: '22px',
          right: '480px',
          zIndex: 1000,
          background: 'rgba(12, 18, 29, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '11px'
        }}>
          <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>Relative Brightness Intensity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Low</span>
            <div style={{
              width: '100px',
              height: '6px',
              borderRadius: '999px',
              background: 'linear-gradient(to right, #fb923c, #f97316, #ff3b00)'
            }} />
            <span style={{ fontSize: '10px', color: '#64748b' }}>Severe</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE PANEL: DUAL TAB INTERFACE */}
      <div style={{
        width: '460px',
        height: '100%',
        backgroundColor: '#0c121d',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.6)'
      }}>

        {/* TAB NAVIGATION HEADER */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 16px 0',
          gap: '8px',
          background: '#090e17'
        }}>
          <button
            onClick={() => setActiveTab('surveillance')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'surveillance' ? '#f97316' : 'transparent'}`,
              color: activeTab === 'surveillance' ? '#f8fafc' : '#64748b',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}>
            <Sliders size={16} color={activeTab === 'surveillance' ? '#f97316' : '#64748b'} />
            Surveillance & Map
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'calendar' ? '#f97316' : 'transparent'}`,
              color: activeTab === 'calendar' ? '#f8fafc' : '#64748b',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}>
            <CalendarIcon size={16} color={activeTab === 'calendar' ? '#f97316' : '#64748b'} />
            Burning Activity Calendar
          </button>
        </div>

        {/* TAB 1: SURVEILLANCE & CONTROLS */}
        {activeTab === 'surveillance' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Observation Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Observation Date
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date"
                  value={date}
                  min={dateRange.min_date}
                  max={dateRange.max_date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                <span>Available dataset: {dateRange.min_date}</span>
                <span>to {dateRange.max_date}</span>
              </div>
            </div>

            {/* Diurnal Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Diurnal Cycle
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setDaynight('ALL')}
                  style={{
                    padding: '9px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'ALL' ? '#f97316' : 'transparent',
                    color: daynight === 'ALL' ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s'
                  }}>
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDaynight('D')}
                  style={{
                    padding: '9px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'D' ? '#f97316' : 'transparent',
                    color: daynight === 'D' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}>
                  <Sun size={14} /> Day
                </button>
                <button
                  type="button"
                  onClick={() => setDaynight('N')}
                  style={{
                    padding: '9px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'N' ? '#f97316' : 'transparent',
                    color: daynight === 'N' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}>
                  <Moon size={14} /> Night
                </button>
              </div>
            </div>

            {/* Quick Benchmark Days */}
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key Fire Outbreak Dates:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {[
                  { label: 'Apr 15, 2021', val: '2021-04-15' },
                  { label: 'May 01, 2022', val: '2022-05-01' },
                  { label: 'Nov 10, 2021', val: '2021-11-10' },
                  { label: 'Mar 30, 2023', val: '2023-03-30' },
                ].map(p => (
                  <button
                    key={p.val}
                    onClick={() => setDate(p.val)}
                    style={{
                      background: date === p.val ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${date === p.val ? '#f97316' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: date === p.val ? '#f97316' : '#94a3b8',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Daily Observation Summary
                </span>
                {loading && <RefreshCw size={14} color="#f97316" className="animate-spin" />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Active Spots</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f97316', marginTop: '2px' }}>
                    {stats.count.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Peak Brightness</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {stats.maxBrightness} <span style={{ fontSize: '12px', color: '#64748b' }}>K</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Avg Brightness</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                    {stats.avgBrightness} <span style={{ fontSize: '11px', color: '#64748b' }}>K</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Cumulative FRP</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                    {Number(stats.totalFrp).toLocaleString()} <span style={{ fontSize: '11px', color: '#64748b' }}>MW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clicked Fire Inspection Details */}
            {selectedFire && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.07)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f97316' }}>Inspected Spot</span>
                  <button 
                    onClick={() => setSelectedFire(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Coords:</strong> {selectedFire.lat.toFixed(4)}, {selectedFire.lon.toFixed(4)}</div>
                  <div><strong>Brightness:</strong> {selectedFire.brightness} K</div>
                  <div><strong>Fire Radiative Power:</strong> {selectedFire.frp} MW</div>
                  <div><strong>Time:</strong> {String(selectedFire.time).padStart(4, '0')} UTC</div>
                  <div><strong>Sensor:</strong> {selectedFire.instrument}</div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: BURNING ACTIVITY CALENDAR HEATMAP */}
        {activeTab === 'calendar' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <ActivityCalendar 
              onSelectDate={handleSelectDateFromCalendar} 
              selectedDate={date} 
            />
          </div>
        )}

        {/* Panel Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '11px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#090e17'
        }}>
          <span>FireSync Harmonized Engine</span>
          <span style={{ color: '#94a3b8' }}>3,258,122 Records</span>
        </div>

      </div>

    </div>
  );
}
