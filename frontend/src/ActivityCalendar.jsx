import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, TrendingUp, BarChart2, Info } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Calendar Header with Mode Toggles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Burning Activity Heatmap
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Multi-year fire intensity history across seasons & diurnal shifts
          </p>
        </div>

        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setViewMode('matrix')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'matrix' ? '#f97316' : 'transparent',
              color: viewMode === 'matrix' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}>
            Year-vs-Month
          </button>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'daily' ? '#f97316' : 'transparent',
              color: viewMode === 'daily' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}>
            Daily Matrix
          </button>
        </div>
      </div>

      {/* VIEW 1: YEAR VS MONTH HEATMAP MATRIX */}
      {viewMode === 'matrix' && (
        <div>
          <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontWeight: 600 }}>Year</th>
                  {MONTH_NAMES.map((m, i) => (
                    <th key={m} style={{ textAlign: 'center', padding: '6px 4px', color: '#94a3b8', fontWeight: 600 }}>
                      {m}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: '#64748b', fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {availableYears.map(yr => {
                  let yearTotal = 0;
                  return (
                    <tr key={yr}>
                      <td style={{ fontWeight: 700, color: '#cbd5e1', padding: '6px 8px' }}>{yr}</td>
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
                              height: '32px',
                              borderRadius: '6px',
                              textAlign: 'center',
                              cursor: cell ? 'pointer' : 'default',
                              border: isHovered ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.05)',
                              transition: 'transform 0.15s ease, border-color 0.15s',
                              transform: isHovered ? 'scale(1.12)' : 'none',
                              zIndex: isHovered ? 10 : 1,
                              color: count > 30000 ? '#ffffff' : (count > 0 ? '#111827' : 'transparent'),
                              fontWeight: 700,
                              fontSize: '10px'
                            }}
                            title={cell ? `${MONTH_NAMES[monthNum - 1]} ${yr}: ${count.toLocaleString()} fires` : 'No data'}
                          >
                            {count > 0 ? (count >= 1000 ? `${Math.round(count / 1000)}k` : count) : ''}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: '#cbd5e1', fontWeight: 600 }}>
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
            minHeight: '48px',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: hoveredCell ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${hoveredCell ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            {hoveredCell ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={16} color="#f97316" />
                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                    {MONTH_NAMES[hoveredCell.month - 1]} {hoveredCell.year}:
                  </span>
                  <span style={{ color: '#fb923c', fontWeight: 700 }}>
                    {hoveredCell.fires.toLocaleString()} fire spots
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', gap: '12px' }}>
                  <span>Avg: <strong>{hoveredCell.avg_b} K</strong></span>
                  <span>Peak: <strong>{hoveredCell.max_b} K</strong></span>
                  <span style={{ color: '#f97316', fontWeight: 600 }}>Click to jump to date</span>
                </div>
              </>
            ) : (
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                Hover over any month cell to view metrics, or click to load that period onto the map.
              </span>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY CALENDAR MATRIX FOR SELECTED YEAR */}
      {viewMode === 'daily' && (
        <div>
          {/* Year Selector Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>YEAR:</span>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedYear === yr ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                  background: selectedYear === yr ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: selectedYear === yr ? '#f97316' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                {yr}
              </button>
            ))}
          </div>

          {/* GitHub-style Contribution Grid */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '14px',
            overflowX: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 12px)',
              gridAutoColumns: '12px',
              gap: '3px'
            }}>
              {dailyData.map((d) => {
                const isSelected = selectedDate === d.date;
                return (
                  <div
                    key={d.date}
                    onClick={() => onSelectDate(d.date)}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      backgroundColor: getDailyColor(d.count),
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #ffffff' : 'none',
                      boxShadow: isSelected ? '0 0 8px #f97316' : 'none',
                      transition: 'transform 0.1s'
                    }}
                    title={`${d.date}: ${d.count.toLocaleString()} fire detections`}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
            <span>Showing {dailyData.length} recorded days in {selectedYear}</span>
            <span>Click any day square to inspect on map</span>
          </div>
        </div>
      )}

      {/* Unified Color Ramp Scale Bar */}
      <div style={{
        marginTop: '6px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Relative Burning Scale:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Low</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {['#fef08a', '#facc15', '#f97316', '#dc2626', '#7f1d1d'].map((col, idx) => (
              <div key={idx} style={{ width: '22px', height: '10px', borderRadius: '2px', backgroundColor: col }} />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Severe Hotspot Peak</span>
        </div>
      </div>

    </div>
  );
}

