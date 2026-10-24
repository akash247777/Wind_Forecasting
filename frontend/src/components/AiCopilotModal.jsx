import React, { useState, useEffect } from 'react';
import { Brain, X, Sparkles, Send, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AiCopilotModal({ isOpen, onClose, selectedDate }) {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const samplePrompts = [
    "Why did National Grid ESO over-predict wind by 1.8 GW on average?",
    "What thermal procurement buffer is optimal for high-demand days?",
    "How does the System Buy Price penalize under-procured desks?",
    "Explain the trade-off between D-1 12:00 auction vs 4h-ahead intraday trading."
  ];

  async function fetchBriefing(prompt = "") {
    setLoading(true);
    try {
      const res = await fetch('/api/copilot/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          prompt: prompt || undefined
        })
      });
      if (res.ok) {
        const json = await res.json();
        setBriefing(json);
      }
    } catch (err) {
      console.error("AI briefing error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', background: '#0b1120', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  AI Energy Trading Copilot
                </h3>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  {briefing?.source === 'gemini' ? 'Gemini 2.5 Flash' : 'Quantitative Intelligence'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Targeting Wholesale Delivery Date: <strong>{selectedDate}</strong>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cyan-primary)' }}>
              <Sparkles size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>Synthesizing Elexon wind metrics and wholesale trading intelligence...</p>
            </div>
          ) : briefing ? (
            <>
              {/* Reliability Indicator Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', background: briefing.forecastReliability === 'ELEVATED RISK' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', border: briefing.forecastReliability === 'ELEVATED RISK' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {briefing.forecastReliability === 'ELEVATED RISK' ? (
                    <AlertTriangle size={18} color="var(--rose-danger)" />
                  ) : (
                    <CheckCircle size={18} color="var(--emerald-success)" />
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: briefing.forecastReliability === 'ELEVATED RISK' ? 'var(--rose-danger)' : 'var(--emerald-success)' }}>
                    FORECAST RELIABILITY ASSESSMENT: {briefing.forecastReliability}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Evaluated across 48 settlement periods
                </span>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--cyan-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Executive Market Briefing
                </h4>
                <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  {briefing.executiveSummary}
                </p>
              </div>

              {/* Procurement Advice */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Day-Ahead Wholesale Procurement Recommendation
                </h4>
                <div style={{ fontSize: '0.925rem', color: '#f8fafc', lineHeight: '1.6', background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  {briefing.procurementAdvice}
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Key Operational & Market Risk Factors
                </h4>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {briefing.riskFactors?.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          {/* Interactive Question Input */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              PROMPT THE COPILOT (ENERGY TRADER ASSISTANT):
            </span>

            {/* Quick Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomPrompt(p);
                    fetchBriefing(p);
                  }}
                  style={{
                    fontSize: '0.7rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (customPrompt.trim()) fetchBriefing(customPrompt);
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input 
                type="text" 
                placeholder="Ask specific questions about wind error, risk buffers, or EPEX day-ahead strategy..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                <Send size={16} />
                <span>Ask</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
