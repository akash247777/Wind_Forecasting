import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar 
} from 'recharts';
import { 
  Calendar, Clock, Sliders, TrendingUp, AlertTriangle, 
  CheckCircle, Zap, ShieldCheck, ArrowRight, Info 
} from 'lucide-react';

export default function DayAheadDecision({ selectedDate, setSelectedDate, onOpenAiModal }) {
  const [cutoffHour, setCutoffHour] = useState(12);
  const [demandScale, setDemandScale] = useState(1.0);
  const [confidenceLevel, setConfidenceLevel] = useState(0.90);
  
  const [comparisonData, setComparisonData] = useState([]);
  const [procurementData, setProcurementData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch comparison & procurement data when parameters change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [compRes, procRes] = await Promise.all([
          fetch(`/api/data/comparison?date_from=${selectedDate}&date_to=${selectedDate}&cutoff_hour=${cutoffHour}`),
          fetch(`/api/procurement/simulate?date=${selectedDate}&cutoff_hour=${cutoffHour}&demand_scale=${demandScale}&confidence_level=${confidenceLevel}`)
        ]);
        
        if (compRes.ok) {
          const compJson = await compRes.json();
          setComparisonData(compJson);
        }
        if (procRes.ok) {
          const procJson = await procRes.json();
          setProcurementData(procJson);
        }
      } catch (err) {
        console.error("Error loading day-ahead data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDate, cutoffHour, demandScale, confidenceLevel]);

  // Derived metrics
  const totalForecastMWh = comparisonData.reduce((acc, d) => acc + d.forecastMW * 0.5, 0);
  const totalActualMWh = comparisonData.reduce((acc, d) => acc + d.actualMW * 0.5, 0);
  const avgErrorMW = comparisonData.length 
    ? comparisonData.reduce((acc, d) => acc + d.errorMW, 0) / comparisonData.length 
    : 0;
  const totalAbsError = comparisonData.reduce((acc, d) => acc + d.absErrorMW, 0);
  const totalActualMW = comparisonData.reduce((acc, d) => acc + d.actualMW, 0);
  const wape = totalActualMW > 0 ? (totalAbsError / totalActualMW) * 100 : 0;

  const presetDates = [
    { label: "Jan 01 (New Year)", date: "2026-01-01" },
    { label: "Jan 05 (High Deficit)", date: "2026-01-05" },
    { label: "Jan 12 (Stable)", date: "2026-01-12" },
    { label: "Jan 18 (Low Wind)", date: "2026-01-18" },
    { label: "Jan 25 (Gale Event)", date: "2026-01-25" },
    { label: "Jan 31 (Peak Demand)", date: "2026-01-31" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Control Banner */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        
        {/* Left: Date & Gate Closure Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              DELIVERY DATE (JANUARY 2026)
            </label>
            <input 
              type="date" 
              value={selectedDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              DECISION GATE CUTOFF (D-1)
            </label>
            <select 
              value={cutoffHour} 
              onChange={(e) => setCutoffHour(Number(e.target.value))}
              style={{ fontWeight: 600 }}
            >
              <option value={11}>11:00 GMT (D-1 Early Auction Prep)</option>
              <option value={12}>12:00 GMT (D-1 EPEX Gate Closure - Standard)</option>
              <option value={18}>18:00 GMT (D-1 Evening Post-Auction)</option>
              <option value={23}>23:00 GMT (D-1 Midnight Final)</option>
            </select>
          </div>

          {/* Presets */}
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
              SCENARIO PRESETS:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {presetDates.map((p) => (
                <button
                  key={p.date}
                  onClick={() => setSelectedDate(p.date)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    border: selectedDate === p.date ? '1px solid var(--cyan-primary)' : '1px solid var(--border-subtle)',
                    background: selectedDate === p.date ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedDate === p.date ? 'var(--cyan-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Quick Action */}
        <div>
          <button 
            className="btn-primary" 
            onClick={onOpenAiModal}
            style={{ padding: '10px 18px' }}
          >
            <Zap size={16} />
            <span>AI Risk Briefing for {selectedDate}</span>
          </button>
        </div>

      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Forecast Available */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Day-Ahead Wind Forecast
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem', fontWeight: 700 }}>
              At D-1 {cutoffHour}:00
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a5b4fc', letterSpacing: '-0.02em' }}>
              {Math.round(totalForecastMWh).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginLeft: '6px' }}>MWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            48 half-hour settlement periods evaluated
          </div>
        </div>

        {/* Card 2: Actual Delivered */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Actual Wind Generation
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-success)', fontSize: '0.7rem', fontWeight: 700 }}>
              Delivered FUELHH
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald-success)', letterSpacing: '-0.02em' }}>
              {Math.round(totalActualMWh).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginLeft: '6px' }}>MWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Actual generation across UK national grid
          </div>
        </div>

        {/* Card 3: Forecast Error / Bias */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Forecast Error (WAPE)
            </span>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px', 
              background: wape > 20 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
              color: wape > 20 ? 'var(--rose-danger)' : 'var(--amber-warning)', 
              fontSize: '0.7rem', 
              fontWeight: 700 
            }}>
              {avgErrorMW > 0 ? "OVER-FORECAST" : "UNDER-FORECAST"}
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: wape > 20 ? 'var(--rose-danger)' : 'var(--amber-warning)', letterSpacing: '-0.02em' }}>
              {wape.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
              (Bias: {avgErrorMW > 0 ? `+${Math.round(avgErrorMW)}` : Math.round(avgErrorMW)} MW)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            {avgErrorMW > 0 
              ? "Wind under-delivered vs forecast -> Deficit risk in system" 
              : "Wind over-delivered vs forecast -> Long position in market"}
          </div>
        </div>

        {/* Card 4: Downside Risk Buffer */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Recommended Thermal Buffer
            </span>
            <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-primary)', fontSize: '0.7rem', fontWeight: 700 }}>
              P90 Protection
            </span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cyan-primary)', letterSpacing: '-0.02em' }}>
              {procurementData ? Math.round(procurementData.downsideBufferMWh).toLocaleString() : "..."}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginLeft: '6px' }}>MWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Protects desk from Balancing Mechanism cash-out spikes
          </div>
        </div>

      </div>

      {/* Main Chart Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Day-Ahead Forecast vs Actual Generation Profile</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>({selectedDate})</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Half-hourly national wind generation (MW). D-1 forecast locked at {cutoffHour}:00 GMT EPEX Gate Closure.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#818cf8', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>D-1 Forecast</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>Delivered Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.4)', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>Forecast Error Delta</span>
            </div>
          </div>
        </div>

        {/* Recharts Area */}
        <div style={{ height: '360px', width: '100%' }}>
          {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis 
                  dataKey="settlementPeriod" 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(sp) => `SP ${sp}`}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k MW`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const isOver = d.errorMW > 0;
                      return (
                        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                            Settlement Period {d.settlementPeriod} ({d.startTime.slice(11, 16)} UTC)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: '#818cf8' }}>
                              D-1 Forecast: <strong>{d.forecastMW.toLocaleString()} MW</strong>
                            </div>
                            <div style={{ color: '#10b981' }}>
                              Actual Output: <strong>{d.actualMW.toLocaleString()} MW</strong>
                            </div>
                            <div style={{ color: isOver ? '#f43f5e' : '#38bdf8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                              Error: <strong>{isOver ? `+${d.errorMW.toLocaleString()}` : d.errorMW.toLocaleString()} MW</strong> ({isOver ? "Over-prediction" : "Under-prediction"})
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                              Forecast Lead Time: {d.leadHours} hours
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="actualMW" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#actualGrad)" 
                  name="Actual Output"
                />
                <Area 
                  type="monotone" 
                  dataKey="forecastMW" 
                  stroke="#818cf8" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#forecastGrad)" 
                  name="D-1 Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading settlement periods for {selectedDate}...
            </div>
          )}
        </div>
      </div>

      {/* Day-Ahead Wholesale Procurement Calculator (PM Requirement Core) */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(6, 182, 212, 0.3)', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(6, 182, 212, 0.05) 100%)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--cyan-primary)', fontSize: '0.75rem', fontWeight: 800 }}>
                DECISION ENGINE
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Wholesale Day-Ahead Power Purchase Simulator
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Calculates how much thermal power (e.g., CCGT / peakers) the utility desk must procure on EPEX SPOT beyond expected wind generation, incorporating quantified downside forecast error reserves.
            </p>
          </div>

          {/* Interactive Parameters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* Demand Scale */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Consumer Demand Scaler:</span>
                <strong style={{ color: 'var(--cyan-primary)' }}>{Math.round(demandScale * 100)}%</strong>
              </div>
              <input 
                type="range" 
                min="0.7" 
                max="1.3" 
                step="0.05"
                value={demandScale}
                onChange={(e) => setDemandScale(Number(e.target.value))}
                style={{ width: '130px' }}
              />
            </div>

            {/* Confidence Level */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Risk Buffer Confidence:</span>
                <strong style={{ color: 'var(--emerald-success)' }}>P{Math.round(confidenceLevel * 100)}</strong>
              </div>
              <select 
                value={confidenceLevel} 
                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                <option value={0.50}>P50 (Median - Aggressive)</option>
                <option value={0.75}>P75 (Moderate Hedge)</option>
                <option value={0.90}>P90 (Standard Utility Risk Band)</option>
                <option value={0.95}>P95 (Conservative - Deep Protection)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Simulation Output Stats Grid */}
        {procurementData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Consumer Demand
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
                {Math.round(procurementData.totalDemandMWh).toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Total energy required by retail consumers
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Wind Generation Expected
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a5b4fc', marginTop: '6px' }}>
                {Math.round(procurementData.forecastWindMWh).toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Covers {(procurementData.forecastWindMWh / procurementData.totalDemandMWh * 100).toFixed(1)}% of demand
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Baseline Thermal Needed
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fdba74', marginTop: '6px' }}>
                {Math.round(procurementData.baselineThermalMWh).toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Demand - Expected Wind (Unbuffered)
              </div>
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Recommended Purchase (with Buffer)
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '6px' }}>
                {Math.round(procurementData.recommendedThermalMWh).toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Includes +{Math.round(procurementData.downsideBufferMWh).toLocaleString()} MWh P{Math.round(confidenceLevel * 100)} buffer
              </div>
            </div>

          </div>
        )}

        {/* Stack Breakdown Chart */}
        {procurementData && (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Procurement Stack Across 48 Settlement Periods (MW):
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procurementData.periods} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="settlementPeriod" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(sp) => `SP ${sp}`} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>SP {p.settlementPeriod} ({p.startTime.slice(11, 16)} UTC)</div>
                            <div style={{ color: '#94a3b8', marginTop: '4px' }}>Consumer Demand: <strong>{p.demandMW.toLocaleString()} MW</strong></div>
                            <div style={{ color: '#818cf8' }}>Expected Wind: <strong>{p.windForecastMW.toLocaleString()} MW</strong></div>
                            <div style={{ color: '#fdba74' }}>Baseline Thermal: <strong>{p.baselineThermalMW.toLocaleString()} MW</strong></div>
                            <div style={{ color: '#06b6d4' }}>Risk Buffer: <strong>+{p.downsideRiskBufferMW.toLocaleString()} MW</strong></div>
                            <div style={{ color: '#10b981', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                              Recommended Buy: <strong>{p.recommendedThermalMW.toLocaleString()} MW</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="windForecastMW" stackId="stack" fill="#818cf8" name="Wind Power" />
                  <Bar dataKey="baselineThermalMW" stackId="stack" fill="#f97316" name="Baseline Thermal" />
                  <Bar dataKey="downsideRiskBufferMW" stackId="stack" fill="#06b6d4" name="Reserve Buffer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
