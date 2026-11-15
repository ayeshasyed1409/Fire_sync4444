import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Filter,
  Flame,
  Database,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';
import { FIRE_TYPE_INFO, getFireTypeInfo, formatConfidence } from './fireTypes.js';

export default function ArchivePage({ onLaunchMap, defaultDateRange }) {
  const [startDate, setStartDate] = useState('2021-04-10');
  const [endDate, setEndDate] = useState('2021-04-16');
  const [daynight, setDaynight] = useState('ALL');
  const [sensor, setSensor] = useState('ALL');
  const [fireType, setFireType] = useState('ALL');
  const [rowLimit, setRowLimit] = useState('50000');

  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [summary, setSummary] = useState({
    count: 0,
    avg_brightness: 0,
    max_brightness: 0,
    total_frp: 0,
    preview: []
  });

  const PRESETS = [
    { label: 'Peak Outbreak (Apr 10–16, 2021)', start: '2021-04-10', end: '2021-04-16' },
    { label: 'Stubble Burning Peak (Nov 05–12, 2021)', start: '2021-11-05', end: '2021-11-12' },
    { label: 'May Heatwave (Apr 28–May 04, 2022)', start: '2022-04-28', end: '2022-05-04' },
    { label: 'Spring Fire Season (Mar 25–31, 2023)', start: '2023-03-25', end: '2023-03-31' },
    { label: 'April 2021 (Full Month)', start: '2021-04-01', end: '2021-04-30' },
  ];

  // Fetch summary and preview data with automatic fallback
  const fetchSummary = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      daynight: daynight,
      instrument: sensor,
      type: fireType
    });

    try {
      const res = await fetch(`/api/archive/summary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.count === 'number') {
          setSummary({
            count: data.count || 0,
            avg_brightness: data.avg_brightness || 0,
            max_brightness: data.max_brightness || 0,
            total_frp: data.total_frp || 0,
            preview: Array.isArray(data.preview) ? data.preview : []
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend /api/archive/summary not available, attempting fallback:", err);
    }

    // Client-side fallback via /api/calendar & /api/fires
    try {
      const startYear = startDate.slice(0, 4);
      const endYear = endDate.slice(0, 4);
      const calRes = await fetch(`/api/calendar?year=${startYear}`);
      const calData = await calRes.json();
      
      let filtered = Array.isArray(calData) ? calData.filter(d => d.date >= startDate && d.date <= endDate) : [];
      
      if (startYear !== endYear) {
        const calRes2 = await fetch(`/api/calendar?year=${endYear}`);
        const calData2 = await calRes2.json();
        if (Array.isArray(calData2)) {
          filtered = filtered.concat(calData2.filter(d => d.date >= startDate && d.date <= endDate));
        }
      }

      const totalCount = filtered.reduce((acc, d) => acc + (d.count || 0), 0);
      const maxB = filtered.reduce((acc, d) => Math.max(acc, d.max_b || 0), 0);
      const totalF = filtered.reduce((acc, d) => acc + (d.frp || 0), 0);
      const avgB = filtered.length > 0 
        ? Math.round(filtered.reduce((acc, d) => acc + (d.avg_b || 0), 0) / filtered.length * 10) / 10 
        : 0;

      let previewRows = [];
      try {
        const fireRes = await fetch(`/api/fires?date=${startDate}`);
        const fireData = await fireRes.json();
        if (fireData && Array.isArray(fireData.fires)) {
          previewRows = fireData.fires.slice(0, 15).map(f => ({
            acq_date: startDate,
            acq_time: f.time,
            latitude: f.lat,
            longitude: f.lon,
            brightness: f.brightness,
            frp: f.frp,
            instrument: f.instrument,
            daynight: f.daynight,
            confidence: f.confidence,
            type: f.type,
            confidence_cat: f.confidence_cat
          }));
        }
      } catch (e) {
        // ignore preview errors
      }

      setSummary({
        count: totalCount,
        avg_brightness: avgB,
        max_brightness: maxB,
        total_frp: Math.round(totalF * 10) / 10,
        preview: previewRows
      });
    } catch (fallbackErr) {
      console.error("Fallback summary failed:", fallbackErr);
      setSummary({ count: 0, avg_brightness: 0, max_brightness: 0, total_frp: 0, preview: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate, daynight, sensor, fireType]);

  // Handle CSV Export with fallback
  const handleExportCSV = async () => {
    if (!startDate || !endDate || isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      daynight: daynight,
      instrument: sensor,
      type: fireType
    });

    if (rowLimit && rowLimit !== 'ALL') {
      params.append('limit', rowLimit);
    }

    const exportUrl = `/api/export?${params.toString()}`;

    try {
      const res = await fetch(exportUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `firesync_archive_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
        return;
      }
    } catch (e) {
      console.warn("Backend /api/export unavailable, falling back to client-side CSV generation:", e);
    }

    // Client-side fallback: Fetch dates and build CSV
    try {
      let datesToFetch = [startDate];
      if (startDate !== endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const cur = new Date(start);
        datesToFetch = [];
        while (cur <= end && datesToFetch.length < 31) {
          datesToFetch.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
      }

      let allFires = [];
      for (const d of datesToFetch) {
        try {
          const res = await fetch(`/api/fires?date=${d}&daynight=${daynight}`);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.fires)) {
              allFires.push(...data.fires.map(f => ({ ...f, acq_date: d })));
            }
          }
        } catch (err) {
          // ignore single day error
        }
      }

      if (sensor !== 'ALL') {
        allFires = allFires.filter(f => (f.instrument || '').includes(sensor));
      }
      if (fireType !== 'ALL') {
        allFires = allFires.filter(f => String(f.type) === String(fireType));
      }

      if (rowLimit && rowLimit !== 'ALL') {
        allFires = allFires.slice(0, parseInt(rowLimit, 10));
      }

      const csvRows = [
        "latitude,longitude,brightness,scan,track,acq_date,acq_time,instrument,confidence,frp,daynight,type"
      ];
      for (const f of allFires) {
        csvRows.push(`${f.lat},${f.lon},${f.brightness},,,${f.acq_date},${f.time},${f.instrument},${f.confidence},${f.frp},${f.daynight},${f.type ?? -1}`);
      }

      const blob = new Blob([csvRows.join("\r\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firesync_archive_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Client CSV export fallback failed:", err);
      setIsExporting(false);
      alert("Failed to export CSV. Please ensure the backend server is running.");
    }
  };

  const totalCount = Number(summary?.count || 0);
  const maxBrightness = Number(summary?.max_brightness || 0);
  const avgBrightness = Number(summary?.avg_brightness || 0);
  const totalFrp = Number(summary?.total_frp || 0);
  const previewRows = Array.isArray(summary?.preview) ? summary.preview : [];

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      backgroundColor: '#070b14',
      color: '#f8fafc',
      padding: '36px 32px 64px',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d1527', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            <Database size={13} />
            Data Archive & Export Engine
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', margin: 0, marginBottom: '8px' }}>
            Historical Fire Observations Archive
          </h1>

          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
            Filter harmonized satellite active fire detections across the Indian subcontinent (2020&ndash;2026), inspect query telemetry and record previews, and export customized subsets directly as clean CSV files.
          </p>
        </div>

        {/* QUERY & FILTER CONSOLE */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          marginBottom: '28px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#ea580c" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Query Parameters
              </span>
            </div>

            {/* Quick Benchmark Range Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Quick Presets:
              </span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setStartDate(p.start);
                    setEndDate(p.end);
                  }}
                  style={{
                    backgroundColor: startDate === p.start && endDate === p.end ? 'rgba(234, 88, 12, 0.2)' : '#070b14',
                    border: `1px solid ${startDate === p.start && endDate === p.end ? '#ea580c' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: startDate === p.start && endDate === p.end ? '#ea580c' : '#94a3b8',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Start Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min="2020-11-01"
                max={endDate || "2026-08-31"}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || "2020-11-01"}
                max="2026-08-31"
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            {/* Diurnal Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Diurnal Cycle
              </label>
              <select
                value={daynight}
                onChange={(e) => setDaynight(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                <option value="ALL">All (Day & Night)</option>
                <option value="D">Daytime Observations (D)</option>
                <option value="N">Nighttime Observations (N)</option>
              </select>
            </div>

            {/* Satellite Sensor Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Satellite Instrument
              </label>
              <select
                value={sensor}
                onChange={(e) => setSensor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                <option value="ALL">All Instruments (MODIS + VIIRS)</option>
                <option value="MODIS">MODIS (Aqua & Terra)</option>
                <option value="SNPP">VIIRS (Suomi-NPP)</option>
              </select>
            </div>

            {/* Fire Classification Type Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Classification Type
              </label>
              <select
                value={fireType}
                onChange={(e) => setFireType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                <option value="ALL">All Classification Types</option>
                <option value="0">Type 0 - Presumed vegetation fire</option>
                <option value="1">Type 1 - Active volcano</option>
                <option value="2">Type 2 - Other static land source</option>
                <option value="3">Type 3 - Offshore</option>
                <option value="-1">Type -1 - Undetermined</option>
              </select>
            </div>

            {/* Export Limit */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                Export Row Limit
              </label>
              <select
                value={rowLimit}
                onChange={(e) => setRowLimit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                <option value="10000">10,000 Records</option>
                <option value="25000">25,000 Records</option>
                <option value="50000">50,000 Records</option>
                <option value="100000">100,000 Records</option>
                <option value="ALL">No Limit (Complete Query Result)</option>
              </select>
            </div>

          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={fetchSummary}
                disabled={loading}
                style={{
                  backgroundColor: '#070b14',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}>
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh Summary
              </button>

              {onLaunchMap && (
                <button
                  onClick={() => onLaunchMap(startDate)}
                  style={{
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    color: '#ea580c',
                    padding: '9px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}>
                  <Flame size={14} />
                  Open {startDate} on Live Map
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isExporting || totalCount === 0}
              style={{
                backgroundColor: exportSuccess ? '#15803d' : '#ea580c',
                border: 'none',
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isExporting || totalCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: exportSuccess ? '0 2px 10px rgba(34, 197, 94, 0.4)' : '0 2px 10px rgba(234, 88, 12, 0.4)',
                opacity: totalCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}>
              {isExporting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Generating CSV Export...
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle size={15} />
                  CSV Exported!
                </>
              ) : (
                <>
                  <Download size={15} />
                  Export {totalCount > 0 ? totalCount.toLocaleString() : 0} Rows as CSV
                </>
              )}
            </button>
          </div>

        </div>

        {/* QUERY SUMMARY METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          
          <div style={{ backgroundColor: '#0c121d', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Matching Hotspots
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
              {loading ? '--' : totalCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              From {startDate} to {endDate}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c121d', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Peak Thermal Brightness
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {loading ? '--' : maxBrightness} <span style={{ fontSize: '14px', color: '#64748b' }}>K</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Highest intensity detection
            </div>
          </div>

          <div style={{ backgroundColor: '#0c121d', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Brightness
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
              {loading ? '--' : avgBrightness} <span style={{ fontSize: '14px', color: '#64748b' }}>K</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Across selected observations
            </div>
          </div>

          <div style={{ backgroundColor: '#0c121d', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cumulative FRP
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
              {loading ? '--' : totalFrp.toLocaleString()} <span style={{ fontSize: '14px', color: '#64748b' }}>MW</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Total Fire Radiative Power
            </div>
          </div>

        </div>

        {/* DATA PREVIEW TABLE */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
        }}>
          
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#090e17' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="#ea580c" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Query Preview (Sample Records)
              </span>
            </div>

            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Showing sample records formatted as exported in CSV
            </span>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#070b14', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 14px' }}>Date</th>
                  <th style={{ padding: '10px 14px' }}>UTC</th>
                  <th style={{ padding: '10px 14px' }}>Latitude</th>
                  <th style={{ padding: '10px 14px' }}>Longitude</th>
                  <th style={{ padding: '10px 14px' }}>Brightness (K)</th>
                  <th style={{ padding: '10px 14px' }}>FRP (MW)</th>
                  <th style={{ padding: '10px 14px' }}>Sensor</th>
                  <th style={{ padding: '10px 14px' }}>Cycle</th>
                  <th style={{ padding: '10px 14px' }}>Confidence</th>
                  <th style={{ padding: '10px 14px' }}>Type Code & Description</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.length > 0 ? (
                  previewRows.map((row, idx) => {
                    const typeInfo = getFireTypeInfo(row.type);
                    const confInfo = formatConfidence(row.confidence, row.confidence_cat);

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                        }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                          {row.acq_date || startDate}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {row.acq_time != null ? String(row.acq_time).padStart(4, '0') : '--'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {row.latitude != null ? `${Number(row.latitude).toFixed(4)}° N` : '--'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {row.longitude != null ? `${Number(row.longitude).toFixed(4)}° E` : '--'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#ea580c', fontFamily: 'monospace' }}>
                          {row.brightness != null ? row.brightness : '--'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {row.frp != null ? row.frp : '--'}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                          {row.instrument || 'MODIS/VIIRS'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: row.daynight === 'D' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: row.daynight === 'D' ? '#ea580c' : '#38bdf8'
                          }}>
                            {row.daynight === 'D' ? 'Day' : 'Night'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: confInfo.color,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {confInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: typeInfo.badgeBg,
                            border: `1px solid ${typeInfo.badgeBorder}`,
                            color: typeInfo.badgeColor
                          }}>
                            {typeInfo.code}: {typeInfo.title}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      {loading ? 'Executing archive query...' : 'No active fire records found matching the specified date span and filter criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Schema Note */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#090e17', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <strong>CSV Headers:</strong> <code>latitude,longitude,brightness,scan,track,acq_date,acq_time,instrument,confidence,frp,daynight,type</code>
            </span>
            <span>Total Dataset: 3,285,447 Indexed Hotspots</span>
          </div>

        </div>

      </div>
    </div>
  );
}
