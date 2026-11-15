import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import StudentsListView from './views/StudentsListView';
import StudentDetailView from './views/StudentDetailView';
import WhatIfLabView from './views/WhatIfLabView';
import ModelMetricsView from './views/ModelMetricsView';
import LivePredictModal from './components/LivePredictModal';
import { api } from './services/api';
import fallbackStudents from './data/fallbackStudents.json';
import fallbackStats from './data/fallbackStats.json';
import fallbackMetrics from './data/fallbackMetrics.json';
import { AlertCircle, CheckCircle2, Server } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [stats, setStats] = useState(fallbackStats);
  const [sampleStudents, setSampleStudents] = useState(fallbackStudents);
  const [metrics, setMetrics] = useState(fallbackMetrics);
  const [loading, setLoading] = useState(true);
  const [isLivePredictOpen, setIsLivePredictOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashStats, studentsList, modelMetrics] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getSampleStudents().catch(() => []),
          api.getModelMetrics().catch(() => null),
        ]);

        if (studentsList && studentsList.length > 0) {
          setStats(dashStats || fallbackStats);
          setSampleStudents(studentsList);
          setMetrics(modelMetrics || fallbackMetrics);
          const highRisk = studentsList.find((s) => s.prediction.risk_level === 'High Risk');
          setSelectedStudent(highRisk || studentsList[0]);
          setIsBackendConnected(true);
        } else {
          // Graceful fallback to pre-computed OULAD dataset
          setStats(fallbackStats);
          setSampleStudents(fallbackStudents);
          setMetrics(fallbackMetrics);
          const highRisk = fallbackStudents.find((s) => s.prediction.risk_level === 'High Risk');
          setSelectedStudent(highRisk || fallbackStudents[0]);
          setIsBackendConnected(false);
        }
      } catch (err) {
        setStats(fallbackStats);
        setSampleStudents(fallbackStudents);
        setMetrics(fallbackMetrics);
        const highRisk = fallbackStudents.find((s) => s.prediction.risk_level === 'High Risk');
        setSelectedStudent(highRisk || fallbackStudents[0]);
        setIsBackendConnected(false);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setActiveTab('explain');
  };

  const handleOpenWhatIf = (student) => {
    setSelectedStudent(student);
    setActiveTab('whatif');
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelInfo={metrics}
        onOpenLivePredict={() => setIsLivePredictOpen(true)}
      />

      <main className="main-content">
        {/* Backend Connection Status Banner */}
        {!isBackendConnected && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#d97706" />
              <span>
                <strong>Backend Offline:</strong> Displaying pre-evaluated OULAD cohort data (50 students). To enable live custom predictions &amp; What-If API recalculations, run <code>python backend\run_server.py</code> or <code>.\start_all.bat</code>.
              </span>
            </div>
            <span style={{ fontSize: '11px', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              Cached OULAD Mode
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Loading EduGuard Early Warning System...
            </div>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Fetching Day-60 checkpoints and ML models...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                metrics={metrics}
                onSelectStudent={handleSelectStudent}
                sampleStudents={sampleStudents}
                onOpenLivePredict={() => setIsLivePredictOpen(true)}
              />
            )}

            {activeTab === 'students' && (
              <StudentsListView
                students={sampleStudents}
                onSelectStudent={handleSelectStudent}
              />
            )}

            {activeTab === 'explain' && (
              <StudentDetailView
                student={selectedStudent}
                onBack={() => setActiveTab('students')}
                onOpenWhatIf={handleOpenWhatIf}
              />
            )}

            {activeTab === 'whatif' && (
              <WhatIfLabView
                initialStudent={selectedStudent}
                sampleStudents={sampleStudents}
              />
            )}

            {activeTab === 'metrics' && (
              <ModelMetricsView metrics={metrics} />
            )}
          </>
        )}
      </main>

      <LivePredictModal
        isOpen={isLivePredictOpen}
        onClose={() => setIsLivePredictOpen(false)}
      />

      <footer className="app-footer">
        <div>
          <strong>EduGuard Student Early Warning System</strong> • B.Tech Major Project in Educational Data Mining
        </div>
        <div style={{ marginTop: '4px', fontSize: '12px' }}>
          Trained on Open University Learning Analytics Dataset (OULAD) • Decision Horizon: Day 60 • Powered by LightGBM &amp; TreeSHAP
        </div>
      </footer>
    </div>
  );
}
