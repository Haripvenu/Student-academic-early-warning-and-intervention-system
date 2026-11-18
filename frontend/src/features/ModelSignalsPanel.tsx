import React from 'react';
import { ScoreSensitivity } from '../api/types';
import { Cpu } from 'lucide-react';

interface Props {
  clusterLabel?: string;
  anomalyPercentile?: number;
  sensitivities: ScoreSensitivity[];
}

export const ModelSignalsPanel: React.FC<Props> = ({
  clusterLabel,
  anomalyPercentile,
  sensitivities,
}) => {
  const anom = anomalyPercentile || 0;
  const anomColor = anom >= 90 ? '#e11d48' : anom >= 70 ? '#d97706' : '#059669';

  return (
    <div className="arm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <div style={{ padding: '6px', background: '#eef2ff', borderRadius: '6px', color: 'var(--primary)' }}>
              <Cpu size={17} />
            </div>
            <span>Unsupervised Signals &amp; Local Sensitivity</span>
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Machine learning signals used solely to corroborate evidence or uncover unusual patterns.
          </p>
        </div>
      </div>

      {/* Cluster & Anomaly Percentile Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.4px' }}>
            Discovered Academic Archetype (K-Means)
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {clusterLabel || 'Profile Unassigned'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Unsupervised behavioral grouping
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.4px' }}>
            Anomaly Percentile (Isolation Forest)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: anomColor,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {anomalyPercentile != null ? `${anomalyPercentile}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              relative to checkpoint cohort
            </span>
          </div>
          {/* Visual Gauge */}
          <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(anom, 100)}%`, height: '100%', background: anomColor, borderRadius: '3px' }} />
          </div>
        </div>
      </div>

      {/* Score Sensitivity to Benchmark Substitutions Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Score Sensitivity to Benchmark Substitutions:
          </h4>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Replacing observed value with cohort median
          </span>
        </div>

        <div className="data-table-container">
          <table className="arm-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Observed</th>
                <th>Cohort Median</th>
                <th style={{ width: '110px' }}>Anomaly Score Δ</th>
                <th>Diagnostic Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {sensitivities && sensitivities.length > 0 ? (
                sensitivities.map((s, idx) => {
                  const isAdverse = s.impact_direction === 'supports_adverse_signal';
                  const isProtective = s.impact_direction === 'protective_factor';
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {s.feature_name_display}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {s.observed_value} {s.unit}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {s.benchmark_value} {s.unit}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: s.score_delta < 0 ? '#e11d48' : '#059669',
                            background: s.score_delta < 0 ? '#fff1f2' : '#ecfdf5',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${s.score_delta < 0 ? '#fecdd3' : '#a7f3d0'}`,
                            display: 'inline-block',
                          }}
                        >
                          {s.score_delta > 0 ? '+' : ''}{typeof s.score_delta === 'number' ? s.score_delta.toFixed(3) : s.score_delta}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: isAdverse ? '#9f1239' : (isProtective ? '#065f46' : '#64748b'),
                            fontWeight: isAdverse ? 600 : 400,
                          }}
                        >
                          {s.interpretation}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                    No significant score sensitivities observed for this profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
