import React from 'react';
import { Shield, BarChart3, Users, BrainCircuit, Sliders, Award, Plus } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, modelInfo, onOpenLivePredict }) {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'students', label: 'Cohort Roster', icon: Users },
    { id: 'explain', label: 'Student Diagnostics', icon: BrainCircuit },
    { id: 'whatif', label: 'Simulation Lab', icon: Sliders },
    { id: 'metrics', label: 'Model Benchmarks', icon: Award },
  ];

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-icon">
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-title">EduGuard</span>
              <span style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                EWS
              </span>
            </div>
            <p className="brand-subtitle">Early Warning Intelligence</p>
          </div>
        </div>

        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={onOpenLivePredict} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={13} color="#2563eb" />
            <span>Simulate Student</span>
          </button>

          <div className="model-badge">
            <span className="pulse-dot"></span>
            <span>{modelInfo?.best_model_name || 'LightGBM'} • 82.4% AUC</span>
          </div>
        </div>
      </div>
    </header>
  );
}
