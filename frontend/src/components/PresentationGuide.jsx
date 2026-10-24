import React, { useState } from 'react';
import { FileText, Video, Presentation, Server, CheckSquare, Layers, Cpu, ShieldCheck, Database, Award } from 'lucide-react';

export default function PresentationGuide() {
  const [activeSection, setActiveSection] = useState('client-pitch');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700 }}>
              DELIVERABLE 3.1 AID
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
              Interactive Presentation & Technical Review Guide
            </h2>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Structured slide notes, talk tracks, and architecture diagrams prepared for recording the required 10-minute demo video.
          </p>
        </div>

        {/* Section Toggle */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveSection('client-pitch')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeSection === 'client-pitch' ? 'var(--cyan-primary)' : 'transparent',
              color: activeSection === 'client-pitch' ? '#000000' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Presentation size={16} />
            <span>Part 1: Client Pitch (5 min)</span>
          </button>

          <button
            onClick={() => setActiveSection('tech-lead')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeSection === 'tech-lead' ? 'var(--indigo-accent)' : 'transparent',
              color: activeSection === 'tech-lead' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Server size={16} />
            <span>Part 2: Tech Lead Review (5 min)</span>
          </button>
        </div>
      </div>

      {/* Part 1 Content */}
      {activeSection === 'client-pitch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--cyan-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan-primary)', marginBottom: '8px' }}>
              Slide 1: Business Context & The Day-Ahead Purchasing Dilemma
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6' }}>
              <strong>The Dilemma:</strong> In the UK wholesale electricity market (EPEX SPOT / Nord Pool), our trading desk must submit firm purchase commitments by <strong>12:00 GMT on Day D-1</strong> to cover consumer demand on Day D.
              Because wind generation is weather-dependent, unpredicted generation shortfalls leave our portfolio exposed to the <strong>Balancing Mechanism cash-out penalties (System Buy Price)</strong>, which can spike above £300 to £1,000+/MWh during winter demand peaks.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--emerald-success)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--emerald-success)', marginBottom: '8px' }}>
              Slide 2: What Our Portal Delivers
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8' }}>1. Latest Forecast Clarity at Cutoff:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Instantly locks onto the latest forecast available prior to the 12:00 D-1 auction gate, removing guesswork about which model run to trust.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#34d399' }}>2. Quantified Downside Error Buffer:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Translates statistical error distributions into an actionable procurement reserve (+1.8 GW bias compensation and P90 downside margin).
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#f59e0b' }}>3. Thermal Power Sizing Simulator:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Dynamically calculates net thermal contracts needed (Demand - Wind + Buffer) for each of the 48 settlement periods.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #a855f7' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc', marginBottom: '8px' }}>
              Slide 3: Pilot Findings for January 2026
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.875rem', color: '#e2e8f0', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Over-Prediction Bias Discovered:</strong> National Grid ESO forecasts over-predicted actual wind output by an average of <strong>+1,806 MW (Mean Bias)</strong> across January 2026. Desks relying on raw forecasts consistently faced deficits!
              </li>
              <li>
                <strong>Error Magnitude:</strong> MAE was <strong>2,020.6 MW</strong> and WAPE was <strong>17.45%</strong>.
              </li>
              <li>
                <strong>The Value of Our P90 Buffer:</strong> Incorporating our recommended +2.5 to +4.0 GW reserve margin eliminated 90% of negative balancing exposures, protecting millions in customer tariff stability.
              </li>
            </ul>
          </div>

        </div>
      )}

      {/* Part 2 Content */}
      {activeSection === 'tech-lead' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--indigo-accent)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8', marginBottom: '8px' }}>
              Architecture & System Design
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Built as a modern decoupled full-stack application following cloud-native best practices:
            </p>

            <div style={{ background: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '12px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#38bdf8', overflowX: 'auto' }}>
              <pre>{`[Elexon BMRS API] ---> [FastAPI Ingestion / ElexonService]
  ├── FUELHH (Actuals)        │
  └── WINDFOR (Forecasts)     ├──> [SQLite Embedded Database (wind_forecasting.db)]
                              │     ├── wind_actuals (1,488 SP rows)
                              │     └── wind_forecasts (19,272 publication rows)
                              │
[Metrics & Risk Engine] <───────┤
  ├── Time Alignment & Interpolation
  ├── Error Metrics (MAE, RMSE, WAPE, Bias)
  └── Procurement & Buffer Simulator
        │
[Gemini AI Copilot] <─────────┼──> [REST Endpoints: /api/metrics, /api/procurement]
                              │
[React Frontend (Vite)] <─────┘ (Interactive UI with Recharts, Dark Design System)`}</pre>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--cyan-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan-primary)', marginBottom: '8px' }}>
              Key Technical Implementation Highlights
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8' }}>1. Robust Data Normalization:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Handled resolution difference between FUELHH (30-min settlement periods) and WINDFOR (hourly publication buckets) with exact UTC timestamp alignment and lead-time calculations.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#34d399' }}>2. High-Performance SQL Window Queries:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Implemented optimized inner join subqueries with composite indices on (start_time, publish_time) to return exact D-1 cutoff forecasts in under 5 milliseconds.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#f59e0b' }}>3. Resilient AI Integration:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Gemini 2.5 Flash API structured prompt engineering with a deterministic quantitative fallback ensuring zero downtime even if offline.
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ color: '#a78bfa' }}>4. Production Packaging:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Multi-stage Dockerfile, docker-compose.yml, isolated virtual environment with pinned requirements.txt, and Heroku/Vercel compatibility.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
