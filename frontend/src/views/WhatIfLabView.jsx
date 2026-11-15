import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function WhatIfLabView({ initialStudent, sampleStudents }) {
  const [selectedStudent, setSelectedStudent] = useState(
    initialStudent || (sampleStudents.length > 0 ? sampleStudents[0] : null)
  );

  const [features, setFeatures] = useState({
    total_clicks: 120,
    active_days: 12,
    clicks_last_2wk: 20,
    recent_share: 0.15,
    avg_score: 50.0,
    missed_assessments: 1,
    late_submissions: 1,
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      const init = {
        total_clicks: selectedStudent.features.total_clicks || 100,
        active_days: selectedStudent.features.active_days || 10,
        clicks_last_2wk: selectedStudent.features.clicks_last_2wk || 15,
        recent_share: selectedStudent.features.recent_share || 0.15,
        avg_score: selectedStudent.features.avg_score || 50,
        missed_assessments: selectedStudent.features.missed_assessments || 0,
        late_submissions: selectedStudent.features.late_submissions || 0,
      };
      setFeatures(init);
      runSimulation(init);
    }
  }, [selectedStudent]);

  const runSimulation = async (customFeatures) => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const activeFeats = customFeatures || features;
      const res = await api.simulateWhatIf(selectedStudent.features, activeFeats);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    const updated = { ...features, [key]: parseFloat(val) };
    setFeatures(updated);
  };

  const applyPreset = (presetName) => {
    let preset = {};
    if (presetName === 'tutor') {
      preset = {
        ...features,
        missed_assessments: 0,
        avg_score: Math.min((features.avg_score || 50) + 25, 95),
        late_submissions: 0,
      };
    } else if (presetName === 'nudge') {
      preset = {
        ...features,
        total_clicks: (features.total_clicks || 50) + 200,
        active_days: Math.min((features.active_days || 10) + 15, 60),
        clicks_last_2wk: (features.clicks_last_2wk || 10) + 100,
      };
    }
    setFeatures(preset);
    runSimulation(preset);
  };

  return (
    <div>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="section-title">Intervention Simulator (What-If Lab)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Simulate behavioral and assessment improvements to assess quantitative risk reduction in real time.
          </p>
        </div>

        {/* Student Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Student:</span>
          <select
            className="form-input"
            style={{ width: '240px', padding: '7px 12px' }}
            value={selectedStudent?.id_student || ''}
            onChange={(e) => {
              const found = sampleStudents.find((s) => s.id_student.toString() === e.target.value);
              if (found) setSelectedStudent(found);
            }}
          >
            {sampleStudents.map((s) => (
              <option key={s.id_student} value={s.id_student}>
                #{s.id_student} ({s.code_module} - {s.prediction.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Action Pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={() => applyPreset('tutor')}>
          <Sparkles size={15} color="#d97706" />
          <span>Apply "Remedial Tutoring" (Submit missed test + boost score by 25%)</span>
        </button>
        <button className="btn btn-outline" onClick={() => applyPreset('nudge')}>
          <Zap size={15} color="#2563eb" />
          <span>Apply "Portal Re-engagement" (+200 clicks &amp; +15 active days)</span>
        </button>
      </div>

      <div className="responsive-whatif-grid">
        {/* Sliders Panel */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '18px' }}>Adjust Student Behavioral Attributes</h3>

          {/* Slider 1: Total Clicks */}
          <div className="form-group">
            <div className="form-label">
              <span>Total Clicks (Day 0-60)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 700 }}>{features.total_clicks}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="25"
              value={features.total_clicks}
              onChange={(e) => handleChange('total_clicks', e.target.value)}
              className="slider-range"
            />
          </div>

          {/* Slider 2: Recent Activity (Last 14 Days) */}
          <div className="form-group">
            <div className="form-label">
              <span>Clicks in Last 14 Days (Trend)</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 700 }}>{features.clicks_last_2wk}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={features.clicks_last_2wk}
              onChange={(e) => handleChange('clicks_last_2wk', e.target.value)}
              className="slider-range"
            />
          </div>

          {/* Slider 3: Active Days */}
          <div className="form-group">
            <div className="form-label">
              <span>Active Portal Days</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#4f46e5', fontWeight: 700 }}>{features.active_days} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={features.active_days}
              onChange={(e) => handleChange('active_days', e.target.value)}
              className="slider-range"
            />
          </div>

          {/* Slider 4: Average Score */}
          <div className="form-group">
            <div className="form-label">
              <span>Continuous Assessment Average</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700 }}>{features.avg_score}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={features.avg_score}
              onChange={(e) => handleChange('avg_score', e.target.value)}
              className="slider-range"
            />
          </div>

          {/* Slider 5: Missed Assessments */}
          <div className="form-group">
            <div className="form-label">
              <span>Missed Early Assessments</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: features.missed_assessments > 0 ? '#e11d48' : '#059669', fontWeight: 700 }}>
                {features.missed_assessments} missed
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={features.missed_assessments}
              onChange={(e) => handleChange('missed_assessments', e.target.value)}
              className="slider-range"
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            onClick={() => runSimulation()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Recalculate Model Risk Prediction</span>
          </button>
        </div>

        {/* Real-Time Outcome Comparison Panel */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '18px' }}>Simulated Outcome Comparison</h3>

          {simulationResult ? (
            <div>
              {/* Baseline vs Simulated comparison boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                    Current Baseline Risk
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px', color: simulationResult.original_risk_score >= 0.6 ? '#e11d48' : '#d97706' }}>
                    {Math.round(simulationResult.original_risk_score * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                    {simulationResult.original_level}
                  </div>
                </div>

                <div style={{ background: '#eff6ff', padding: '18px', borderRadius: '10px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                    Simulated Intervention
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px', color: '#2563eb' }}>
                    {Math.round(simulationResult.simulated_risk_score * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    {simulationResult.simulated_level}
                  </div>
                </div>
              </div>

              {/* Delta Callout Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '10px',
                  background: simulationResult.risk_score_delta < 0 ? '#ecfdf5' : '#fff1f2',
                  border: `1px solid ${simulationResult.risk_score_delta < 0 ? '#a7f3d0' : '#fecdd3'}`,
                  marginBottom: '20px',
                }}
              >
                {simulationResult.risk_score_delta < 0 ? (
                  <TrendingDown size={30} color="#059669" />
                ) : (
                  <TrendingUp size={30} color="#e11d48" />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: simulationResult.risk_score_delta < 0 ? '#065f46' : '#9f1239' }}>
                    Risk Score Delta: {simulationResult.risk_score_delta > 0 ? '+' : ''}
                    {Math.round(simulationResult.risk_score_delta * 100)}%
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {simulationResult.impact_summary}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                💡 <strong>Decision Support:</strong> Demonstrates that resolving the missed assessment and restoring active login frequency pulls this student from the danger zone into passing status.
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Calculating simulation...</p>
          )}
        </div>
      </div>
    </div>
  );
}
