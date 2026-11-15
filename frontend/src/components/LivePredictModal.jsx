import React, { useState } from 'react';
import { X, Cpu } from 'lucide-react';
import { api } from '../services/api';

export default function LivePredictModal({ isOpen, onClose, onDiagnoseResult }) {
  if (!isOpen) return null;

  const [features, setFeatures] = useState({
    total_clicks: 75,
    active_days: 9,
    distinct_resources: 14,
    clicks_last_2wk: 8,
    recent_share: 0.10,
    avg_score: 42.0,
    missed_assessments: 1,
    late_submissions: 1,
    highest_education: 2,
    studied_credits: 60,
    clicks_vs_cohort: 0.45,
    score_vs_cohort: -18.0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const applyPreset = (type) => {
    if (type === 'at-risk') {
      setFeatures({
        total_clicks: 45,
        active_days: 6,
        distinct_resources: 10,
        clicks_last_2wk: 4,
        recent_share: 0.08,
        avg_score: 38.0,
        missed_assessments: 2,
        late_submissions: 1,
        highest_education: 1,
        studied_credits: 90,
        clicks_vs_cohort: 0.30,
        score_vs_cohort: -24.0
      });
    } else if (type === 'high-performer') {
      setFeatures({
        total_clicks: 850,
        active_days: 42,
        distinct_resources: 68,
        clicks_last_2wk: 190,
        recent_share: 0.22,
        avg_score: 86.0,
        missed_assessments: 0,
        late_submissions: 0,
        highest_education: 3,
        studied_credits: 60,
        clicks_vs_cohort: 1.45,
        score_vs_cohort: 18.5
      });
    } else {
      setFeatures({
        total_clicks: 380,
        active_days: 24,
        distinct_resources: 38,
        clicks_last_2wk: 75,
        recent_share: 0.19,
        avg_score: 68.0,
        missed_assessments: 0,
        late_submissions: 0,
        highest_education: 2,
        studied_credits: 60,
        clicks_vs_cohort: 0.95,
        score_vs_cohort: 2.0
      });
    }
    setResult(null);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictSingle(features);
      setResult(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Live Supervised ML Inference</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Input custom Day-60 student metrics to test real-time LightGBM inference &amp; SHAP diagnostics.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>Test Scenarios:</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset('at-risk')}>
            🚨 Disengaging Student
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset('average')}>
            ⚖️ Average Student
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset('high-performer')}>
            ⭐ Star Student
          </button>
        </div>

        <form onSubmit={handlePredict}>
          <div className="live-predict-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Total Clicks (0-60d)</label>
              <input
                type="number"
                className="form-input"
                value={features.total_clicks}
                onChange={(e) => setFeatures({ ...features, total_clicks: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Active Days (0-60d)</label>
              <input
                type="number"
                className="form-input"
                value={features.active_days}
                onChange={(e) => setFeatures({ ...features, active_days: parseInt(e.target.value) || 0 })}
                max={60}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Clicks in Last 14 Days</label>
              <input
                type="number"
                className="form-input"
                value={features.clicks_last_2wk}
                onChange={(e) => setFeatures({ ...features, clicks_last_2wk: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Average Score (%)</label>
              <input
                type="number"
                className="form-input"
                value={features.avg_score}
                onChange={(e) => setFeatures({ ...features, avg_score: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Missed Assessments</label>
              <input
                type="number"
                className="form-input"
                value={features.missed_assessments}
                onChange={(e) => setFeatures({ ...features, missed_assessments: parseFloat(e.target.value) || 0 })}
                min={0}
                max={5}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Late Submissions</label>
              <input
                type="number"
                className="form-input"
                value={features.late_submissions}
                onChange={(e) => setFeatures({ ...features, late_submissions: parseFloat(e.target.value) || 0 })}
                min={0}
                max={5}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            <Cpu size={16} />
            <span>{loading ? 'Running Inference...' : 'Run Supervised ML Prediction'}</span>
          </button>
        </form>

        {/* Prediction Output Card */}
        {result && (
          <div style={{ marginTop: '20px', padding: '18px', background: 'var(--bg-muted)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Prediction Result</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: result.risk_level === 'High Risk' ? '#e11d48' : result.risk_level === 'Moderate Risk' ? '#d97706' : '#059669' }}>
                  {result.risk_level} ({result.risk_percentage}% Probability)
                </div>
              </div>
              <span className={`badge ${result.risk_level === 'High Risk' ? 'badge-high' : result.risk_level === 'Moderate Risk' ? 'badge-moderate' : 'badge-low'}`}>
                Class: {result.predicted_class === 1 ? 'Dropout / Fail' : 'Pass / Complete'}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              💡 <strong>Advisor Recommendation:</strong> {result.recommended_action}
            </p>

            {result.top_factors && result.top_factors.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top SHAP Drivers:</span>
                <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {result.top_factors.slice(0, 3).map((f, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      <strong>{f.feature_name_display}</strong>: {f.interpretation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
