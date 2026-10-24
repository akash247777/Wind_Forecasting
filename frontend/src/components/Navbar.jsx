import React from 'react';
import { Wind, Activity, Brain, ShieldAlert, FileText, Database, Clock, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAiModal, dataStatus, isSyncing, onSync }) {
  return (
    <header className="glass-panel" style={{ borderBottom: '1px solid var(--border-subtle)', borderRadius: '0', position: 'sticky', top: 0, zIndex: 50, padding: '12px 24px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)' }}>
            <Wind size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AURA WIND TRADING DESK
              </span>
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-primary)', fontWeight: 700, border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                UK DAY-AHEAD v4.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Elexon BMRS Wholesale Power Procurement & Error Analytics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <button 
            className={`nav-tab ${activeTab === 'day-ahead' ? 'active' : ''}`}
            onClick={() => setActiveTab('day-ahead')}
          >
            <Activity size={16} />
            <span>Day-Ahead Decision</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <ShieldAlert size={16} />
            <span>Error Analytics</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'lead-time' ? 'active' : ''}`}
            onClick={() => setActiveTab('lead-time')}
          >
            <Clock size={16} />
            <span>Uncertainty Cone</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Database size={16} />
            <span>Data Explorer</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'presentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('presentation')}
          >
            <FileText size={16} />
            <span>Pitch & Tech Review</span>
          </button>
        </nav>

        {/* Live Status & AI Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Elexon Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.75rem' }}>
            <span className="pulse-dot" />
            <span style={{ color: 'var(--emerald-success)', fontWeight: 600 }}>Elexon Live</span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>{dataStatus?.actualsCount || 1488} Actuals</span>
          </div>

          {/* AI Briefing Button */}
          <button 
            className="btn-primary"
            onClick={onOpenAiModal}
            title="Generate AI Executive Briefing with Gemini"
          >
            <Brain size={16} />
            <span>AI Copilot</span>
          </button>

          {/* Refresh/Sync */}
          <button 
            className="btn-secondary"
            onClick={onSync}
            disabled={isSyncing}
            title="Re-sync data from Elexon API"
            style={{ padding: '8px' }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>

      </div>
    </header>
  );
}
