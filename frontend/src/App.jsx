import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DayAheadDecision from './components/DayAheadDecision';
import MetricsDashboard from './components/MetricsDashboard';
import LeadTimeAnalysis from './components/LeadTimeAnalysis';
import DataExplorer from './components/DataExplorer';
import PresentationGuide from './components/PresentationGuide';
import AiCopilotModal from './components/AiCopilotModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('day-ahead');
  const [selectedDate, setSelectedDate] = useState('2026-01-05');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/data/status');
        if (res.ok) {
          const json = await res.json();
          setDataStatus(json);
        }
      } catch (e) {
        console.error("Could not fetch status:", e);
      }
    }
    fetchStatus();
  }, []);

  async function handleSync() {
    setIsSyncing(true);
    try {
      await fetch('/api/data/sync', { method: 'POST' });
      setTimeout(async () => {
        const res = await fetch('/api/data/status');
        if (res.ok) setDataStatus(await res.json());
        setIsSyncing(false);
      }, 3000);
    } catch (e) {
      console.error("Sync error:", e);
      setIsSyncing(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Sticky Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAiModal={() => setIsAiModalOpen(true)}
        dataStatus={dataStatus}
        isSyncing={isSyncing}
        onSync={handleSync}
      />

      {/* Main App Container */}
      <main style={{ flex: 1, maxWidth: '1600px', width: '100%', margin: '0 auto', padding: '24px 24px 48px' }}>
        {activeTab === 'day-ahead' && (
          <DayAheadDecision 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
            onOpenAiModal={() => setIsAiModalOpen(true)} 
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsDashboard />
        )}

        {activeTab === 'lead-time' && (
          <LeadTimeAnalysis />
        )}

        {activeTab === 'explorer' && (
          <DataExplorer 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
          />
        )}

        {activeTab === 'presentation' && (
          <PresentationGuide />
        )}
      </main>

      {/* AI Intelligence Modal */}
      <AiCopilotModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        selectedDate={selectedDate} 
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(5, 10, 20, 0.95)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span>AURA Wind Trading Desk &copy; 2026 | UK Day-Ahead Renewable Procurement & Forecasting Portal</span>
          <span>Data Sources: Elexon BMRS FUELHH & WINDFOR Datasets | Built with React, Python FastAPI, & Gemini AI</span>
        </div>
      </footer>

    </div>
  );
}
