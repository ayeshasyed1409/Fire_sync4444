import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Flame, 
  TrendingUp, 
  ArrowRight,
  Database,
  Satellite,
  Clock,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function ActivityCalendar({ onSelectDate, selectedDate }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'daily'
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2021');
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);

  const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];

  useEffect(() => {
    fetch('/api/monthly')
      .then(res => res.json())
      .then(data => {
        setMonthlyData(data);
        setLoading(false);
      })
      .catch(err => console.error("Error loading monthly data:", err));
  }, []);

  useEffect(() => {
    fetch(`/api/calendar?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        setDailyData(data);
      })
      .catch(err => console.error("Error loading daily calendar:", err));
  }, [selectedYear]);

  // Find max fires for matrix color scaling
  const maxMonthlyFires = monthlyData.reduce((max, d) => Math.max(max, d.fires), 1);
  const maxDailyFires = dailyData.reduce((max, d) => Math.max(max, d.count), 1);

  // Color ramp function: Yellow -> Orange -> Deep Red -> Maroon
  const getMatrixColor = (fires) => {
    if (!fires || fires === 0) return 'rgba(255, 255, 255, 0.03)';
    const ratio = Math.min(1, Math.max(0.05, fires / maxMonthlyFires));
    
    if (ratio < 0.15) return '#fef08a'; // Light yellow
    if (ratio < 0.35) return '#facc15'; // Amber yellow
    if (ratio < 0.6)  return '#f97316'; // Vibrant orange
    if (ratio < 0.85) return '#dc2626'; // Red
    return '#7f1d1d'; // Dark intense red
  };

  const getDailyColor = (count) => {
    if (!count || count === 0) return 'rgba(255, 255, 255, 0.04)';
    const ratio = Math.min(1, Math.max(0.08, count / maxDailyFires));
    
    if (ratio < 0.15) return '#fef08a';
    if (ratio < 0.35) return '#fbbf24';
    if (ratio < 0.6)  return '#f97316';
    if (ratio < 0.85) return '#dc2626';
    return '#881337';
  };

  // Build matrix dictionary [year][month]
  const matrixMap = {};
  monthlyData.forEach(item => {
    if (!matrixMap[item.year]) matrixMap[item.year] = {};
    matrixMap[item.year][parseInt(item.month, 10)] = item;
  });

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '36px 28px 60px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px'
    }}>
      
      {/* PAGE HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        paddingBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Temporal Analysis
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>&bull; 2020 &ndash; 2026 Archive</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            Burning Activity Calendar
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '6px 0 0', maxWidth: '680px' }}>
            Multi-year fire intensity history and seasonal distribution across India. Click any cell to launch that date in the Live Surveillance Map.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div style={{
          display: 'flex',
          backgroundColor: '#0c1322',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setViewMode('matrix')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'matrix' ? '#f97316' : 'transparent',
              color: viewMode === 'matrix' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}>
            Year-vs-Month Matrix
          </button>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'daily' ? '#f97316' : 'transparent',
              color: viewMode === 'daily' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}>
            Daily Calendar Heatmap
          </button>
        </div>
      </div>

      {/* TOP KPI SUMMARY STRIP */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Harmonized Records
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f97316', marginTop: '4px' }}>
            3,285,447
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Deduplicated ~1.1 km² Grid
          </div>
        </div>

        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Peak Recorded Day
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            2021-04-01
          </div>
          <div style={{ fontSize: '12px', color: '#f97316', marginTop: '2px' }}>
            18,566 Active Detections
          </div>
        </div>

        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Observation Span
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
            2,191 Days
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Nov 1, 2020 &ndash; Nov 2, 2026
          </div>
        </div>

        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px 20px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sensors Integrated
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
            MODIS + VIIRS
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Terra, Aqua & Suomi-NPP
          </div>
        </div>
      </div>

      {/* VIEW 1: YEAR VS MONTH HEATMAP MATRIX */}
      {viewMode === 'matrix' && (
        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '12px' }}>Year</th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} style={{ textAlign: 'center', padding: '10px 6px', color: '#94a3b8', fontWeight: 700, fontSize: '12px' }}>
                      {m}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '12px' }}>Annual Total</th>
                </tr>
              </thead>
              <tbody>
                {availableYears.map(yr => {
                  let yearTotal = 0;
                  return (
                    <tr key={yr}>
                      <td style={{ fontWeight: 800, color: '#f8fafc', padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {yr}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(monthNum => {
                        const cell = matrixMap[yr] ? matrixMap[yr][monthNum] : null;
                        const count = cell ? cell.fires : 0;
                        yearTotal += count;
                        const color = getMatrixColor(count);
                        const isHovered = hoveredCell && hoveredCell.year === yr && hoveredCell.month === monthNum;

                        return (
                          <td
                            key={monthNum}
                            onMouseEnter={() => cell && setHoveredCell({ year: yr, month: monthNum, ...cell })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => {
                              if (cell) {
                                const padM = String(monthNum).padStart(2, '0');
                                onSelectDate(`${yr}-${padM}-15`);
                              }
                            }}
                            style={{
                              backgroundColor: color,
                              height: '44px',
                              borderRadius: '6px',
                              textAlign: 'center',
                              cursor: cell ? 'pointer' : 'default',
                              border: isHovered ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.06)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s',
                              transform: isHovered ? 'scale(1.08)' : 'none',
                              zIndex: isHovered ? 10 : 1,
                              color: count > 30000 ? '#ffffff' : (count > 0 ? '#111827' : 'transparent'),
                              fontWeight: 700,
                              fontSize: '11px'
                            }}
                            title={cell ? `${MONTH_NAMES[monthNum - 1]} ${yr}: ${count.toLocaleString()} fire spots` : 'No data'}
                          >
                            {count > 0 ? (count >= 1000 ? `${Math.round(count / 1000)}k` : count) : ''}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: '#cbd5e1', fontWeight: 700, fontFamily: 'monospace' }}>
                        {yearTotal > 0 ? yearTotal.toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Hover Detail Card */}
          <div style={{
            minHeight: '52px',
            marginTop: '16px',
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: hoveredCell ? 'rgba(249, 115, 22, 0.09)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${hoveredCell ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px'
          }}>
            {hoveredCell ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={18} color="#f97316" />
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>
                    {MONTH_NAMES[hoveredCell.month - 1]} {hoveredCell.year}:
                  </span>
                  <span style={{ color: '#fb923c', fontWeight: 800 }}>
                    {hoveredCell.fires.toLocaleString()} active fire detections
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <span>Avg Brightness: <strong style={{ color: '#cbd5e1' }}>{hoveredCell.avg_b} K</strong></span>
                  <span>Peak: <strong style={{ color: '#cbd5e1' }}>{hoveredCell.max_b} K</strong></span>
                  <span style={{ color: '#f97316', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Click cell to open map <ArrowRight size={13} />
                  </span>
                </div>
              </>
            ) : (
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                Hover over any month cell to view thermal metrics, or click a cell to open the Live Map for that period.
              </span>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY CALENDAR MATRIX FOR SELECTED YEAR */}
      {viewMode === 'daily' && (
        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          {/* Year Selector Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginRight: '4px' }}>SELECT YEAR:</span>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedYear === yr ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                  background: selectedYear === yr ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: selectedYear === yr ? '#f97316' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                {yr}
              </button>
            ))}
          </div>

          {/* Contribution Grid */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '20px',
            overflowX: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 15px)',
              gridAutoColumns: '15px',
              gap: '4px'
            }}>
              {dailyData.map((d) => {
                const isSelected = selectedDate === d.date;
                return (
                  <div
                    key={d.date}
                    onClick={() => onSelectDate(d.date)}
                    style={{
                      width: '15px',
                      height: '15px',
                      borderRadius: '3px',
                      backgroundColor: getDailyColor(d.count),
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #ffffff' : 'none',
                      boxShadow: isSelected ? '0 0 10px #f97316' : 'none',
                      transition: 'transform 0.1s'
                    }}
                    title={`${d.date}: ${d.count.toLocaleString()} fire detections`}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            <span>Showing {dailyData.length} recorded observation days in {selectedYear}</span>
            <span style={{ color: '#ea580c', fontWeight: 600 }}>Click any day square to open that date directly in the Live Map</span>
          </div>
        </div>
      )}

      {/* Unified Color Ramp Scale Bar */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#0c1322',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} color="#f97316" />
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>Relative Fire Frequency Scale:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Low Count</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['#fef08a', '#facc15', '#f97316', '#dc2626', '#7f1d1d'].map((col, idx) => (
              <div key={idx} style={{ width: '28px', height: '12px', borderRadius: '3px', backgroundColor: col }} />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Severe Outbreak Peak</span>
        </div>
      </div>

    </div>
  );
}
