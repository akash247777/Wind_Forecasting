import React, { useState, useEffect } from 'react';
import { Database, Download, Search, Filter, Calendar } from 'lucide-react';

export default function DataExplorer({ selectedDate, setSelectedDate }) {
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExplorerData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/data/comparison?date_from=${selectedDate}&date_to=${selectedDate}&cutoff_hour=12`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error loading comparison table:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExplorerData();
  }, [selectedDate]);

  const filteredData = data.filter((item) => {
    if (filterType === 'OVER' && item.errorMW <= 0) return false;
    if (filterType === 'UNDER' && item.errorMW >= 0) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.settlementPeriod.toString().includes(term) ||
        item.startTime.toLowerCase().includes(term) ||
        item.publishTime.toLowerCase().includes(term)
      );
    }
    return true;
  });

  function downloadCsv() {
    if (!data.length) return;
    const headers = ["SettlementPeriod", "StartTime", "ActualMW", "ForecastMW", "ErrorMW", "AbsErrorMW", "PercError", "PublishTime", "LeadHours"];
    const rows = data.map(d => [
      d.settlementPeriod,
      d.startTime,
      d.actualMW,
      d.forecastMW,
      d.errorMW,
      d.absErrorMW,
      d.percError ?? "",
      d.publishTime,
      d.leadHours
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UK_Wind_Elexon_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search & Action Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>DATE</label>
            <input type="date" value={selectedDate} min="2026-01-01" max="2026-01-31" onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>FILTER BIAS</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="ALL">All Periods (48 SPs)</option>
              <option value="OVER">Over-forecasted (Shortfall Risk)</option>
              <option value="UNDER">Under-forecasted (Wind Surplus)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>SEARCH</label>
            <input 
              type="text" 
              placeholder="Filter by SP, UTC time..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '200px' }}
            />
          </div>
        </div>

        <button className="btn-secondary" onClick={downloadCsv} disabled={!data.length}>
          <Download size={16} />
          <span>Export Clean CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px' }}>SP</th>
              <th style={{ padding: '12px 16px' }}>Target Start (UTC)</th>
              <th style={{ padding: '12px 16px' }}>Delivered Actual</th>
              <th style={{ padding: '12px 16px' }}>D-1 Forecast</th>
              <th style={{ padding: '12px 16px' }}>Error (MW)</th>
              <th style={{ padding: '12px 16px' }}>Error (%)</th>
              <th style={{ padding: '12px 16px' }}>Publish Time</th>
              <th style={{ padding: '12px 16px' }}>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => {
              const isOver = row.errorMW > 0;
              return (
                <tr key={row.startTime} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f8fafc' }}>
                    {row.settlementPeriod}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {row.startTime.slice(11, 16)} UTC
                  </td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>
                    {row.actualMW.toLocaleString()} MW
                  </td>
                  <td style={{ padding: '12px 16px', color: '#818cf8', fontWeight: 600 }}>
                    {row.forecastMW.toLocaleString()} MW
                  </td>
                  <td style={{ padding: '12px 16px', color: isOver ? '#f43f5e' : '#38bdf8', fontWeight: 700 }}>
                    {isOver ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()} MW
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {row.percError !== null ? `${row.percError}%` : "-"}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {row.publishTime.replace("T", " ").replace("Z", "")}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {row.leadHours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
