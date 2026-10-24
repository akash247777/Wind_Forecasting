import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { Clock, TrendingDown, Layers, CheckCircle, Lightbulb } from 'lucide-react';

export default function LeadTimeAnalysis() {
  const [leadMetrics, setLeadMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeadTimeData() {
      setLoading(true);
      try {
        const res = await fetch('/api/metrics/lead-time?date_from=2026-01-01&date_to=2026-01-31');
        if (res.ok) {
          const json = await res.json();
          setLeadMetrics(json);
        }
      } catch (err) {
        console.error("Error loading lead time metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeadTimeData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="var(--cyan-primary)" />
          <span>Forecast Horizon & Lead-Time Uncertainty Cone</span>
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Analyzing how Elexon WINDFOR forecast error evolves as delivery approaches. Compares Intraday (0-6h) through Day-Ahead (24-36h) to Two-Day Ahead (48h+).
        </p>
      </div>

      {/* Uncertainty Cone Visual */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Error Degradation by Forecast Lead Time Horizon
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Mean Absolute Error (MAE) and Root Mean Square Error (RMSE) across 19,272 forecast publications in January 2026.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--cyan-primary)', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>MAE (MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#a78bfa', borderRadius: '3px' }} />
              <span style={{ color: 'var(--text-muted)' }}>RMSE (MW)</span>
            </div>
          </div>
        </div>

        <div style={{ height: '340px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="leadBucket" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `${v} MW`} tick={{ fontSize: 11 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{d.leadBucket} Horizon</div>
                        <div style={{ color: '#06b6d4', marginTop: '4px' }}>MAE: <strong>{d.mae.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#a78bfa' }}>RMSE: <strong>{d.rmse.toLocaleString()} MW</strong></div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '2px' }}>Sample publications evaluated: {d.count.toLocaleString()}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="mae" fill="#06b6d4" radius={[4, 4, 0, 0]} name="MAE (MW)" />
              <Bar dataKey="rmse" fill="#818cf8" radius={[4, 4, 0, 0]} name="RMSE (MW)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trading Strategy Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Strategy Card 1 */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--cyan-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Lightbulb size={20} color="var(--cyan-primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              The Day-Ahead Liquidity vs Precision Trade-off
            </h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Wholesale Day-Ahead auctions (EPEX SPOT / Nord Pool) close at <strong>12:00 GMT on D-1</strong>, when forecast error averages ~2,000 MW (MAE). While waiting for intraday forecasts (0-6h ahead) reduces MAE to ~1,200 MW, wholesale market liquidity is 5x lower and prompt thermal power prices carry severe bid-ask spreads.
          </p>
        </div>

        {/* Strategy Card 2 */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--emerald-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <CheckCircle size={20} color="var(--emerald-success)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Recommended Optimal Desk Execution Policy
            </h4>
          </div>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Stage 1 (D-1 12:00 Auction):</strong> Hedge 80-85% of baseline thermal procurement requirement with a calibrated P90 buffer.
            </li>
            <li>
              <strong>Stage 2 (Intraday Gate 4h Ahead):</strong> Evaluate newly published WINDFOR updates and adjust final 15% balancing position in prompt trading.
            </li>
            <li>
              <strong>Cash-Out Protection:</strong> Eliminates exposure to single-direction £300+/MWh System Buy Price spikes during high-demand winter cold spells.
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
