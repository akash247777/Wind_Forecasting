import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart 
} from 'recharts';
import { ShieldAlert, BarChart2, TrendingUp, AlertOctagon, CheckCircle2, HelpCircle } from 'lucide-react';

export default function MetricsDashboard() {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-01-31");
  const [cutoffHour, setCutoffHour] = useState(12);

  const [summary, setSummary] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const [sumRes, hourRes] = await Promise.all([
          fetch(`/api/metrics/summary?date_from=${dateFrom}&date_to=${dateTo}&cutoff_hour=${cutoffHour}`),
          fetch(`/api/metrics/hourly?date_from=${dateFrom}&date_to=${dateTo}&cutoff_hour=${cutoffHour}`)
        ]);

        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          setSummary(sumJson);
        }
        if (hourRes.ok) {
          const hourJson = await hourRes.json();
          setHourly(hourJson);
        }
      } catch (err) {
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [dateFrom, dateTo, cutoffHour]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner Filter */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--cyan-primary)" />
            <span>Quantitative Forecast Error & Accuracy Evaluation</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rigorous statistical benchmarking of National Grid ESO / Elexon WINDFOR forecasts against FUELHH actuals for January 2026.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>FROM DATE</label>
            <input type="date" value={dateFrom} min="2026-01-01" max="2026-01-31" onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>TO DATE</label>
            <input type="date" value={dateTo} min="2026-01-01" max="2026-01-31" onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>D-1 CUTOFF</label>
            <select value={cutoffHour} onChange={(e) => setCutoffHour(Number(e.target.value))}>
              <option value={11}>11:00 GMT</option>
              <option value={12}>12:00 GMT (Gate Closure)</option>
              <option value={18}>18:00 GMT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistical Cards Grid */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* MAE */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Mean Absolute Error (MAE)
            </span>
            <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
              {summary.mae.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>MW</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
              Average magnitude of error per period
            </div>
          </div>

          {/* RMSE */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Root Mean Square Error (RMSE)
            </span>
            <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
              {summary.rmse.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>MW</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
              Heavily penalizes large forecast misses
            </div>
          </div>

          {/* WAPE */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Weighted Percentage Error (WAPE)
            </span>
            <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
              {summary.wape}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
              Sum(|Error|) / Sum(Actuals)
            </div>
          </div>

          {/* Mean Bias */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--rose-danger)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Mean Error / Bias (MBE)
            </span>
            <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: 'var(--rose-danger)' }}>
              +{summary.meanBias.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>MW</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--rose-danger)', marginTop: '6px', fontWeight: 600 }}>
              Persistent Over-prediction bias
            </div>
          </div>

          {/* Error Std Dev */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Error Volatility (1σ Std Dev)
            </span>
            <div style={{ marginTop: '10px', fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
              {summary.stdDev.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>MW</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
              Gaussian dispersion of forecast errors
            </div>
          </div>

        </div>
      )}

      {/* Quantiles & Error Distribution Banner */}
      {summary && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
            Forecast Error Quantile Distribution (MW)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Crucial for day-ahead risk management. The 90th percentile error (+{summary.p90Error.toLocaleString()} MW) represents the conservative downside deficit buffer required to prevent short positions in the Balancing Mechanism.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>P10 (Upside Wind)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                {summary.p10Error > 0 ? `+${summary.p10Error}` : summary.p10Error} MW
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>10% chance error is lower</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>P50 (Median Error)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#a78bfa', marginTop: '4px' }}>
                +{summary.p50Error} MW
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Median model offset</div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--rose-danger)', fontWeight: 700 }}>P90 (Downside Deficit)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--rose-danger)', marginTop: '4px' }}>
                +{summary.p90Error} MW
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Standard buffer threshold</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Max Over-prediction</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                +{summary.maxOverForecast} MW
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Worst-case shortage</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total Periods Tested</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--emerald-success)', marginTop: '4px' }}>
                {summary.totalPeriods} SPs
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>30-min settlement intervals</div>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Error Profile Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Diurnal Settlement Error Profile (Hours 00:00 to 23:00 GMT)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Evaluates how forecast accuracy changes throughout the day. Notice the error expansion during morning ramp-up (07:00-09:00) and evening peak (17:00-19:00).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#38bdf8', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>MAE (MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#f43f5e', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>Mean Bias (MW)</span>
            </div>
          </div>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="hour" stroke="#64748b" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `${v} MW`} tick={{ fontSize: 11 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const h = payload[0].payload;
                    return (
                      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>Hour {h.hour}:00 - {h.hour}:59 GMT</div>
                        <div style={{ color: '#38bdf8', marginTop: '4px' }}>MAE: <strong>{h.mae.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#a78bfa' }}>RMSE: <strong>{h.rmse.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#f43f5e' }}>Mean Bias: <strong>+{h.meanBias.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '2px' }}>Avg Actual: {h.avgActual.toLocaleString()} MW | Avg Forecast: {h.avgForecast.toLocaleString()} MW</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="mae" fill="#38bdf8" radius={[4, 4, 0, 0]} name="MAE" />
              <Line type="monotone" dataKey="meanBias" stroke="#f43f5e" strokeWidth={3} name="Mean Bias" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
