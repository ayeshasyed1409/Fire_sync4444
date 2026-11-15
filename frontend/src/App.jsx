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
  Sparkles,
  Camera,
  Crosshair,
  Check,
  ArrowLeft,
  Home
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toPng } from 'html-to-image';
import ActivityCalendar from './ActivityCalendar.jsx';
import LandingPage from './LandingPage.jsx';

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
  const [view, setView] = useState('landing'); // 'landing' | 'app'
  const [activeTab, setActiveTab] = useState('surveillance'); // 'surveillance' | 'calendar'
  const [date, setDate] = useState('2021-04-15');
  const [daynight, setDaynight] = useState('ALL');
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ min_date: '2020-11-01', max_date: '2026-08-31', total_dates: 2126 });
  const [stats, setStats] = useState({ count: 0, maxBrightness: 0, avgBrightness: 0, totalFrp: 0 });
  const [selectedFire, setSelectedFire] = useState(null);
  const [mapLayer, setMapLayer] = useState('satellite');

  // Real-time cursor coordinates and map capture state
  const [cursorCoords, setCursorCoords] = useState({ lat: INITIAL_CENTER[0], lng: INITIAL_CENTER[1], active: false });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null); // 'success' | 'error' | null

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const selectionLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const handleLaunchApp = (tab = 'surveillance', targetDate = null) => {
    if (targetDate) {
      setDate(targetDate);
    }
    if (tab) {
      setActiveTab(tab);
    }
    setView('app');
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 50);
    }
  };

  useEffect(() => {
    if (view === 'app' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 50);
    }
  }, [view]);

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
      maxZoom: 18,
      crossOrigin: true
    }).addTo(map);

    tileLayerRef.current = initialTile;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    const selectionGroup = L.layerGroup().addTo(map);
    selectionLayerRef.current = selectionGroup;

    // Track live cursor coordinates on mousemove
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        active: true
      });
    });

    map.on('mouseout', () => {
      const center = map.getCenter();
      setCursorCoords({
        lat: center.lat,
        lng: center.lng,
        active: false
      });
    });

    map.on('move', () => {
      setCursorCoords(prev => {
        if (!prev?.active) {
          const center = map.getCenter();
          return { lat: center.lat, lng: center.lng, active: false };
        }
        return prev;
      });
    });

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
        maxZoom: 19,
        crossOrigin: true
      });
    } else {
      newTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; NASA FIRMS Active Fire Hotspots',
        maxZoom: 18,
        crossOrigin: true
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

  // Render Hotspot Markers
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

      // Color gradation: Yellow (moderate) -> Orange (high) -> Red (severe)
      let fillColor, strokeColor, radius;

      if (relBrightness > 0.7) {
        // Severe: Vivid red
        fillColor = '#ef4444';
        strokeColor = '#b91c1c';
        radius = 4.5 + (relBrightness * 2.0); // 4.5px - 6.5px
      } else if (relBrightness > 0.35) {
        // High: Flame orange
        fillColor = '#f97316';
        strokeColor = '#ea580c';
        radius = 3.5 + (relBrightness * 1.8); // 3.5px - 5.0px
      } else {
        // Moderate: Warm Yellow
        fillColor = '#facc15';
        strokeColor = '#ca8a04';
        radius = 2.8 + (relBrightness * 1.5); // 2.8px - 3.8px
      }

      const circle = L.circleMarker([fire.lat, fire.lon], {
        radius: radius,
        fillColor: fillColor,
        color: strokeColor,
        weight: 1,
        opacity: 0.95,
        fillOpacity: 0.9
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${fillColor};"></span>
              <strong style="font-size: 13px; color:#f8fafc;">Thermal Hotspot</strong>
            </div>
            <span style="font-size:10px; font-weight:700; color:${fillColor}; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
              ${fire.confidence ? fire.confidence.toUpperCase() : 'CONFIRMED'}
            </span>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size: 12px; color:#cbd5e1;">
            <div><strong>Location:</strong> ${fire.lat.toFixed(4)}° N, ${fire.lon.toFixed(4)}° E</div>
            <div><strong>Brightness:</strong> <span style="color:#fb923c; font-weight:700;">${fire.brightness} K</span></div>
            <div><strong>FRP:</strong> ${fire.frp} MW</div>
            <div><strong>Time:</strong> ${String(fire.time).padStart(4, '0')} UTC</div>
            <div><strong>Cycle:</strong> ${fire.daynight === 'D' ? 'Day' : 'Night'}</div>
            <div><strong>Sensor:</strong> ${fire.instrument}</div>
          </div>
          <div style="margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); font-size: 11px; color:#94a3b8; display:flex; justify-content:space-between;">
            <span>NASA FIRMS Active Detection</span>
            <span>Date: <strong>${date}</strong></span>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => setSelectedFire(fire));

      // Dynamic hover interaction
      circle.on('mouseover', function () {
        this.setRadius(radius + 2);
        this.setStyle({ weight: 2, opacity: 1 });
      });
      circle.on('mouseout', function () {
        this.setRadius(radius);
        this.setStyle({ weight: 1, opacity: 0.95 });
      });

      layer.addLayer(circle);
    });
  }, [fires, date]);

  // Pulse beacon for inspected / selected fire
  useEffect(() => {
    if (!mapInstanceRef.current || !selectionLayerRef.current) return;
    const layer = selectionLayerRef.current;
    layer.clearLayers();

    if (selectedFire) {
      const beaconRing = L.circleMarker([selectedFire.lat, selectedFire.lon], {
        radius: 18,
        fillColor: '#f97316',
        color: '#ffffff',
        weight: 2,
        opacity: 0.95,
        fillOpacity: 0.15,
        dashArray: '3, 4'
      });
      const centerDot = L.circleMarker([selectedFire.lat, selectedFire.lon], {
        radius: 4,
        fillColor: '#ffffff',
        color: '#f97316',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      });
      layer.addLayer(beaconRing);
      layer.addLayer(centerDot);
    }
  }, [selectedFire]);

  // Capture Screenshot of the Map
  const handleCaptureMap = async () => {
    if (!mapInstanceRef.current || !mapContainerRef.current || isCapturing) return;
    setIsCapturing(true);
    setCaptureStatus(null);

    try {
      const container = mapContainerRef.current;
      const dataUrl = await toPng(container, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 1,
        filter: (node) => {
          // Exclude leaflet controls like zoom buttons from the screenshot
          if (node.classList && node.classList.contains('leaflet-control-zoom')) return false;
          return true;
        }
      });

      const fileName = `FireSync-Map-${date}-${Date.now()}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCaptureStatus('success');
      setTimeout(() => setCaptureStatus(null), 3500);
    } catch (err) {
      console.error('Failed to capture map screenshot:', err);
      setCaptureStatus('error');
      setTimeout(() => setCaptureStatus(null), 4000);
    } finally {
      setIsCapturing(false);
    }
  };

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
    <>
      {view === 'landing' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <LandingPage 
            onLaunchApp={handleLaunchApp} 
            dateRange={dateRange} 
          />
        </div>
      )}

      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#06090e',
        overflow: 'hidden',
        visibility: view === 'landing' ? 'hidden' : 'visible'
      }}>
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

          <button
            onClick={() => setView('landing')}
            title="Return to Landing Page Overview"
            style={{
              marginLeft: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '7px',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}>
            <ArrowLeft size={13} color="#f97316" /> Landing Page
          </button>
        </div>

        {/* Top Center: Live Cursor Coordinates HUD */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(12, 18, 29, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          borderRadius: '30px',
          padding: '8px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(249, 115, 22, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair size={14} color="#f97316" />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#fb923c', textTransform: 'uppercase' }}>
              Coordinates
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'monospace', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>LAT</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                {cursorCoords ? `${Math.abs(cursorCoords.lat).toFixed(4)}° ${cursorCoords.lat >= 0 ? 'N' : 'S'}` : '--'}
              </span>
            </div>

            <div style={{ width: '1px', height: '10px', background: 'rgba(255, 255, 255, 0.08)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>LON</span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                {cursorCoords ? `${Math.abs(cursorCoords.lng).toFixed(4)}° ${cursorCoords.lng >= 0 ? 'E' : 'W'}` : '--'}
              </span>
            </div>
          </div>

          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: cursorCoords?.active ? '#22c55e' : '#64748b',
              boxShadow: cursorCoords?.active ? '0 0 8px #22c55e' : 'none',
              transition: 'all 0.2s ease'
            }}
            title={cursorCoords?.active ? 'Live cursor tracking active' : 'Map center position'}
          />
        </div>

        {/* Top Right: Screenshot Capture Button */}
        <div style={{
          position: 'absolute',
          top: '18px',
          right: '18px',
          zIndex: 1000
        }}>
          <button
            onClick={handleCaptureMap}
            disabled={isCapturing}
            title="Capture and download high-resolution screenshot of the map"
            style={{
              background: captureStatus === 'success' ? '#15803d' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isCapturing ? 'wait' : 'pointer',
              boxShadow: captureStatus === 'success'
                ? '0 0 16px rgba(34, 197, 94, 0.4)'
                : '0 4px 18px rgba(249, 115, 22, 0.4)',
              transition: 'all 0.2s ease'
            }}>
            {isCapturing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Capturing...</span>
              </>
            ) : captureStatus === 'success' ? (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Camera size={15} />
                <span>Capture Map</span>
              </>
            )}
          </button>
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
          <button
            onClick={handleCaptureMap}
            title="Capture Screenshot of Map"
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
            <Camera size={14} />
          </button>
        </div>

        {/* Floating Brightness Legend on Map */}
        <div style={{
          position: 'absolute',
          bottom: '22px',
          right: '18px',
          zIndex: 1000,
          background: 'rgba(12, 18, 29, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '11px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>Thermal Brightness Intensity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#facc15', fontWeight: 700 }}>Moderate</span>
            <div style={{
              width: '110px',
              height: '6px',
              borderRadius: '999px',
              background: 'linear-gradient(to right, #facc15, #f97316, #ef4444)'
            }} />
            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>Severe (&gt;375K)</span>
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

          <button
            onClick={() => setView('landing')}
            title="Return to Landing Page"
            style={{
              marginLeft: 'auto',
              marginBottom: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s'
            }}>
            <Home size={12} color="#f97316" /> Overview
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
    </>
  );
}
