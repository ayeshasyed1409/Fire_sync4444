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
  Home,
  Archive as ArchiveIcon,
  Download,
  MapPin
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toPng } from 'html-to-image';
import ActivityCalendar from './ActivityCalendar.jsx';
import LandingPage from './LandingPage.jsx';
import ArchivePage from './ArchivePage.jsx';
import { FIRE_TYPE_INFO, getFireTypeInfo, formatConfidence, fetchLocation } from './fireTypes.js';

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
  const [view, setView] = useState('landing'); // 'landing' | 'map' | 'calendar'
  const [date, setDate] = useState('2021-04-15');
  const [daynight, setDaynight] = useState('ALL');
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ min_date: '2020-11-01', max_date: '2026-08-31', total_dates: 2126 });
  const [stats, setStats] = useState({ count: 0, maxBrightness: 0, avgBrightness: 0, totalFrp: 0 });
  const [selectedFire, setSelectedFire] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite');

  // Fetch geographic location (district, state, country) when a fire is selected
  useEffect(() => {
    if (selectedFire) {
      setLoadingLocation(true);
      setSelectedLocation(null);
      fetchLocation(selectedFire.lat, selectedFire.lon)
        .then(loc => {
          setSelectedLocation(loc);
          setLoadingLocation(false);
        })
        .catch(() => {
          setLoadingLocation(false);
        });
    } else {
      setSelectedLocation(null);
      setLoadingLocation(false);
    }
  }, [selectedFire]);

  // Real-time cursor coordinates and map capture state
  const [cursorCoords, setCursorCoords] = useState({ lat: INITIAL_CENTER[0], lng: INITIAL_CENTER[1], active: false });
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null); // 'success' | 'error' | null

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const selectionLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const handleLaunchMap = (targetDate = null) => {
    if (targetDate) {
      setDate(targetDate);
    }
    setView('map');
  };

  useEffect(() => {
    if (view === 'map' && mapInstanceRef.current) {
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

      const confInfo = formatConfidence(fire.confidence, fire.confidence_cat);
      const typeInfo = getFireTypeInfo(fire.type);

      const placeId = `popup-place-text-${Math.round(fire.lat * 1000)}_${Math.round(fire.lon * 1000)}`;

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; min-width: 230px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${fillColor};"></span>
              <strong style="font-size: 13px; color:#f8fafc;">Thermal Hotspot</strong>
            </div>
            <span style="font-size:10px; font-weight:700; color:${confInfo.color}; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
              ${confInfo.label}
            </span>
          </div>

          <!-- Fire Classification Type -->
          <div style="margin-bottom:8px; padding:6px 8px; border-radius:6px; background:${typeInfo.badgeBg}; border:1px solid ${typeInfo.badgeBorder}; font-size:11px;">
            <div style="font-weight:800; color:${typeInfo.badgeColor}; font-size:11px;">
              Type ${typeInfo.code}: ${typeInfo.title}
            </div>
            <div style="font-size:10px; color:#cbd5e1; margin-top:2px; line-height:1.3;">
              ${typeInfo.desc}
            </div>
          </div>

          <!-- Geographic Place (District, State, Country) -->
          <div style="margin-bottom:8px; padding:6px 8px; border-radius:6px; background:#070b14; border:1px solid rgba(255,255,255,0.08); font-size:11px;">
            <div style="color:#ea580c; font-size:10px; font-weight:700; text-transform:uppercase;">
              📍 Geographic Location
            </div>
            <div id="${placeId}" style="color:#f8fafc; font-weight:700; margin-top:2px; font-size:11px;">
              Resolving place...
            </div>
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
            <span>NASA FIRMS Detection</span>
            <span>Date: <strong>${date}</strong></span>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => {
        setSelectedFire(fire);
        fetchLocation(fire.lat, fire.lon).then(loc => {
          const el = document.getElementById(placeId);
          if (el && loc) {
            el.innerHTML = `${loc.district ? `<strong>${loc.district}</strong>, ` : ''}${loc.state}, ${loc.country}`;
          }
        });
      });

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#070b14',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>

      {/* TOP PERSISTENT NAVBAR */}
      <header style={{
        height: '52px',
        backgroundColor: '#0c121d',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        zIndex: 2000,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Left: FireSync Logo & Brand */}
        <div
          onClick={() => setView('landing')}
          title="Return to FireSync Overview"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none'
          }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)'
          }}>
            <Flame size={18} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1.2 }}>
              FireSync
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: '#ea580c', textTransform: 'uppercase' }}>
              NASA FIRMS Engine
            </span>
          </div>
        </div>

        {/* Center: Main Navigation Pills */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#070b14',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '3px'
        }}>
          <button
            onClick={() => setView('landing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: view === 'landing' ? '#ea580c' : 'transparent',
              color: view === 'landing' ? '#ffffff' : '#94a3b8',
              boxShadow: view === 'landing' ? '0 2px 8px rgba(234, 88, 12, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}>
            <Globe size={14} />
            Overview
          </button>

          <button
            onClick={() => {
              setView('map');
              if (mapInstanceRef.current) {
                setTimeout(() => mapInstanceRef.current.invalidateSize(), 50);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: view === 'map' ? '#ea580c' : 'transparent',
              color: view === 'map' ? '#ffffff' : '#94a3b8',
              boxShadow: view === 'map' ? '0 2px 8px rgba(234, 88, 12, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}>
            <Crosshair size={14} />
            Live Map
          </button>

          <button
            onClick={() => setView('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: view === 'calendar' ? '#ea580c' : 'transparent',
              color: view === 'calendar' ? '#ffffff' : '#94a3b8',
              boxShadow: view === 'calendar' ? '0 2px 8px rgba(234, 88, 12, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}>
            <CalendarIcon size={14} />
            Activity Calendar
          </button>

          <button
            onClick={() => setView('archive')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: view === 'archive' ? '#ea580c' : 'transparent',
              color: view === 'archive' ? '#ffffff' : '#94a3b8',
              boxShadow: view === 'archive' ? '0 2px 8px rgba(234, 88, 12, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}>
            <ArchiveIcon size={14} />
            Data Archive
          </button>
        </nav>

        {/* Right: Contextual Telemetry & Map Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {view === 'map' && (
            <>
              {/* Coordinates HUD */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '5px 10px',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>LAT</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                  {cursorCoords ? `${Math.abs(cursorCoords.lat).toFixed(4)}° ${cursorCoords.lat >= 0 ? 'N' : 'S'}` : '--'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>LON</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                  {cursorCoords ? `${Math.abs(cursorCoords.lng).toFixed(4)}° ${cursorCoords.lng >= 0 ? 'E' : 'W'}` : '--'}
                </span>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: cursorCoords?.active ? '#22c55e' : '#64748b',
                    boxShadow: cursorCoords?.active ? '0 0 6px #22c55e' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={cursorCoords?.active ? 'Live cursor tracking active' : 'Map center position'}
                />
              </div>

              {/* Basemap Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '2px'
              }}>
                <button
                  onClick={() => setMapLayer('satellite')}
                  style={{
                    background: mapLayer === 'satellite' ? '#ea580c' : 'transparent',
                    color: mapLayer === 'satellite' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                  Satellite
                </button>
                <button
                  onClick={() => setMapLayer('standard')}
                  style={{
                    background: mapLayer === 'standard' ? '#ea580c' : 'transparent',
                    color: mapLayer === 'standard' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                  Standard
                </button>
              </div>

              {/* Recenter Bounds */}
              <button
                onClick={fitBounds}
                title="Fit India View"
                style={{
                  background: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                <Maximize2 size={13} />
              </button>

              {/* Screenshot Capture Button */}
              <button
                onClick={handleCaptureMap}
                disabled={isCapturing}
                title="Capture and download high-resolution map image"
                style={{
                  background: captureStatus === 'success' ? '#15803d' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isCapturing ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.2s ease'
                }}>
                {isCapturing ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Capturing...</span>
                  </>
                ) : captureStatus === 'success' ? (
                  <>
                    <Check size={12} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Camera size={13} />
                    <span>Capture</span>
                  </>
                )}
              </button>
            </>
          )}

          {view === 'calendar' && (
            <button
              onClick={() => handleLaunchMap(date)}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
              }}>
              <Flame size={13} />
              <span>Open in Live Map ({date})</span>
            </button>
          )}

          {view === 'archive' && (
            <button
              onClick={() => handleLaunchMap(date)}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
              }}>
              <Flame size={13} />
              <span>Launch Live Map</span>
            </button>
          )}

          {view === 'landing' && (
            <button
              onClick={() => handleLaunchMap('2021-04-15')}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
              }}>
              <Flame size={13} />
              <span>Launch Live Map</span>
            </button>
          )}
        </div>
      </header>

      {/* VIEW 1: LANDING OVERVIEW */}
      {view === 'landing' && (
        <div style={{ flex: 1, overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
          <LandingPage
            onLaunchApp={(targetView, targetDate) => {
              if (targetDate) setDate(targetDate);
              setView(targetView === 'calendar' ? 'calendar' : targetView === 'archive' ? 'archive' : 'map');
              if (targetView === 'map' && mapInstanceRef.current) {
                setTimeout(() => mapInstanceRef.current.invalidateSize(), 50);
              }
            }}
            dateRange={dateRange}
          />
        </div>
      )}

      {/* VIEW 2: DEDICATED ACTIVITY CALENDAR */}
      {view === 'calendar' && (
        <div style={{ flex: 1, overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
          <ActivityCalendar
            onSelectDate={(targetDate) => {
              setDate(targetDate);
              setView('map');
              if (mapInstanceRef.current) {
                setTimeout(() => mapInstanceRef.current.invalidateSize(), 50);
              }
            }}
            selectedDate={date}
          />
        </div>
      )}

      {/* VIEW 3: DATA ARCHIVE & CSV EXPORT */}
      {view === 'archive' && (
        <div style={{ flex: 1, overflowY: 'auto', height: 'calc(100vh - 52px)' }}>
          <ArchivePage
            onLaunchMap={(targetDate) => {
              if (targetDate) setDate(targetDate);
              setView('map');
              if (mapInstanceRef.current) {
                setTimeout(() => mapInstanceRef.current.invalidateSize(), 50);
              }
            }}
            defaultDateRange={dateRange}
          />
        </div>
      )}

      {/* VIEW 3: LIVE SURVEILLANCE MAP */}
      <div style={{
        display: view === 'map' ? 'flex' : 'none',
        flex: 1,
        height: 'calc(100vh - 52px)',
        width: '100vw',
        overflow: 'hidden'
      }}>
        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Brightness Legend on Map */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(12, 18, 29, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '11px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>Thermal Brightness Intensity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#facc15', fontWeight: 700 }}>Moderate (&lt;340K)</span>
              <div style={{
                width: '100px',
                height: '6px',
                borderRadius: '999px',
                background: 'linear-gradient(to right, #facc15, #f97316, #ef4444)'
              }} />
              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>Severe (&gt;375K)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Surveillance & Telemetry Controls */}
        <div style={{
          width: '380px',
          height: '100%',
          backgroundColor: '#0c121d',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.6)'
        }}>

          {/* Sidebar Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#080d1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={15} color="#ea580c" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Surveillance Controls
              </span>
            </div>
          </div>

          {/* Controls Body */}
          <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Observation Date Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
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
                    padding: '10px 12px',
                    backgroundColor: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: '#64748b' }}>
                <span>Range: {dateRange.min_date}</span>
                <span>to {dateRange.max_date}</span>
              </div>
            </div>

            {/* Diurnal Cycle Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Diurnal Cycle
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '5px',
                background: '#070b14',
                padding: '3px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setDaynight('ALL')}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'ALL' ? '#ea580c' : 'transparent',
                    color: daynight === 'ALL' ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s'
                  }}>
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDaynight('D')}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'D' ? '#ea580c' : 'transparent',
                    color: daynight === 'D' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}>
                  <Sun size={13} /> Day
                </button>
                <button
                  type="button"
                  onClick={() => setDaynight('N')}
                  style={{
                    padding: '7px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: daynight === 'N' ? '#ea580c' : 'transparent',
                    color: daynight === 'N' ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s'
                  }}>
                  <Moon size={13} /> Night
                </button>
              </div>
            </div>

            {/* Daily Metrics Grid */}
            <div style={{
              background: '#070b14',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Daily Observation Summary
                </span>
                {loading && <RefreshCw size={13} color="#ea580c" className="animate-spin" />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#0c121d', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Active Spots</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                    {stats.count.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#0c121d', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Peak Brightness</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {stats.maxBrightness} <span style={{ fontSize: '10px', color: '#64748b' }}>K</span>
                  </div>
                </div>

                <div style={{ background: '#0c121d', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Avg Brightness</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                    {stats.avgBrightness} <span style={{ fontSize: '10px', color: '#64748b' }}>K</span>
                  </div>
                </div>

                <div style={{ background: '#0c121d', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Cumulative FRP</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                    {Number(stats.totalFrp).toLocaleString()} <span style={{ fontSize: '10px', color: '#64748b' }}>MW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clicked Fire Inspection Details */}
            {selectedFire && (() => {
              const confInfo = formatConfidence(selectedFire.confidence, selectedFire.confidence_cat);
              const typeInfo = getFireTypeInfo(selectedFire.type);

              return (
                <div style={{
                  background: 'rgba(234, 88, 12, 0.06)',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ea580c',
                        boxShadow: '0 0 8px #ea580c'
                      }} />
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Inspected Hotspot
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFire(null)}
                      title="Close Inspector"
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>

                  {/* Geographic Location (District, State, Country) */}
                  <div style={{
                    backgroundColor: '#070b14',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="#ea580c" />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Geographic Location
                        </span>
                      </div>
                      {loadingLocation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ea580c' }}>
                          <RefreshCw size={10} className="animate-spin" />
                          <span>Resolving...</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>District:</span>
                        <strong style={{ color: '#f8fafc' }}>
                          {selectedLocation?.district || (loadingLocation ? 'Locating...' : 'Rural Sector')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>State:</span>
                        <strong style={{ color: '#ea580c' }}>
                          {selectedLocation?.state || (loadingLocation ? 'Locating...' : 'India Region')}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Country:</span>
                        <strong style={{ color: '#f8fafc' }}>
                          {selectedLocation?.country || 'India'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Classification Type Card */}
                  <div style={{
                    backgroundColor: typeInfo.badgeBg,
                    border: `1px solid ${typeInfo.badgeBorder}`,
                    borderRadius: '8px',
                    padding: '9px 11px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: typeInfo.badgeColor,
                        letterSpacing: '0.02em'
                      }}>
                        Type {typeInfo.code} &bull; {typeInfo.title}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: '#cbd5e1',
                      margin: 0,
                      lineHeight: 1.45
                    }}>
                      {typeInfo.desc}
                    </p>
                  </div>

                  {/* Confidence & Telemetry Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{
                      background: '#070b14',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Confidence</div>
                      <div style={{ color: confInfo.color, fontWeight: 800, fontSize: '12px', marginTop: '2px' }}>
                        {confInfo.label}
                      </div>
                    </div>

                    <div style={{
                      background: '#070b14',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Thermal Brightness</div>
                      <div style={{ color: '#ea580c', fontWeight: 800, fontSize: '12px', marginTop: '2px' }}>
                        {selectedFire.brightness} K
                      </div>
                    </div>

                    <div style={{
                      background: '#070b14',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Fire Radiative Power</div>
                      <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '12px', marginTop: '2px' }}>
                        {selectedFire.frp} MW
                      </div>
                    </div>

                    <div style={{
                      background: '#070b14',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Overpass Time</div>
                      <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '12px', marginTop: '2px' }}>
                        {String(selectedFire.time).padStart(4, '0')} UTC
                      </div>
                    </div>
                  </div>

                  {/* Location & Metadata Details */}
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '8px'
                  }}>
                    <div><strong>Coordinates:</strong> {selectedFire.lat.toFixed(4)}° N, {selectedFire.lon.toFixed(4)}° E</div>
                    <div><strong>Sensor:</strong> {selectedFire.instrument} ({selectedFire.daynight === 'D' ? 'Day' : 'Night'} pass)</div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Panel Footer */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '10px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#080d1a'
          }}>
            <span>FireSync Engine &bull; India Region</span>
            <span style={{ color: '#94a3b8' }}>3,285,447 Records</span>
          </div>

        </div>

      </div>

    </div>
  );
}
