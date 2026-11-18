import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { ClusterProfile } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { StudentAvatar } from '../components/StudentAvatar';
import { ArrowRight, ShieldCheck, AlertCircle, Compass, Zap } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

const ARCHETYPE_ICONS: Record<number, any> = {
  0: ShieldCheck,
  1: Compass,
  2: AlertCircle,
  3: Zap,
};

const ARCHETYPE_PROTOCOLS: Record<number, string> = {
  0: 'Commendation letter; invite to serve as departmental peer tutor or course study group leader.',
  1: 'Periodic milestone monitoring; send automated encouragement ahead of mid-term assignment deadlines.',
  2: 'Advisor check-in; discuss coursework pacing, past due TMA remediation, and academic office hours.',
  3: 'Immediate proactive contact; conduct comprehensive study planning, evaluate potential hardship or tutoring referral.',
};

export const PatternsPage: React.FC<Props> = ({ onNavigate }) => {
  const [checkpoint, setCheckpoint] = useState('W4');
  const [clusters, setClusters] = useState<ClusterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [clusterStudents, setClusterStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const loadClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await queries.getClusterPatterns(checkpoint);
      setClusters(res.cluster_profiles);
      if (res.cluster_profiles.length > 0 && selectedClusterId === null) {
        setSelectedClusterId(res.cluster_profiles[0].cluster_id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load cluster profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [checkpoint]);

  useEffect(() => {
    if (selectedClusterId !== null) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const resStudents = await queries.getClusterStudents(selectedClusterId, checkpoint);
          setClusterStudents(resStudents);
        } catch (e) {
          console.error('Failed to load cluster students:', e);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [selectedClusterId, checkpoint]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#e0e7ff',
                color: '#3730a3',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              Unsupervised Learning
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>K-Means Archetype Discovery ($K=4$)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Discovered Academic Archetypes
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Behavioral archetypes discovered on historical terms without outcome labels, categorizing students at checkpoint {checkpoint}.
          </p>
        </div>

        {/* Checkpoint selector */}
        <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          {['W2', 'W4', 'W6'].map((ck) => (
            <button
              key={ck}
              onClick={() => setCheckpoint(ck)}
              style={{
                border: checkpoint === ck ? '1px solid #4f46e5' : '1px solid transparent',
                background: checkpoint === ck ? '#4f46e5' : 'transparent',
                color: checkpoint === ck ? '#ffffff' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: checkpoint === ck ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {ck === 'W2' ? 'Week 2 Archetypes' : ck === 'W4' ? 'Week 4 Archetypes' : 'Week 6 Archetypes'}
            </button>
          ))}
        </div>
      </div>

      <AsyncState isLoading={loading} error={error} onRetry={loadClusters}>
        {/* 4 Profile Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '24px' }}>
          {clusters.map((c) => {
            const isSelected = selectedClusterId === c.cluster_id;
            const Icon = ARCHETYPE_ICONS[c.cluster_id] || Network;
            const protocol = ARCHETYPE_PROTOCOLS[c.cluster_id] || 'Advisor review.';
            const pct = c.actual_cohort_pct || c.sample_pct || 0;

            return (
              <div
                key={c.cluster_id}
                className="arm-card-elevated"
                onClick={() => setSelectedClusterId(c.cluster_id)}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-card)',
                  boxShadow: isSelected ? '0 0 0 2px var(--primary-border), var(--shadow-card-hover)' : 'var(--shadow-card)',
                  background: isSelected ? '#fafbff' : '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active Highlight Hairline */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'var(--primary)',
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: isSelected ? '#e0e7ff' : '#f1f5f9',
                        color: isSelected ? '#4f46e5' : '#64748b',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                      Cluster #{c.cluster_id}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSelected ? '#4f46e5' : '#64748b',
                      background: isSelected ? '#e0e7ff' : '#f8fafc',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {pct}% of cohort
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                  {c.label}
                </h3>
                <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.45, marginBottom: '14px' }}>
                  {c.description}
                </p>

                {/* Means in original units */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>ATTENDANCE RATE</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      {c.original_means.attendance_rate || 0}%
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>ASSESSMENT AVG</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      {c.original_means.assessment_avg_score || 0}%
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>TOTAL CLICKS</span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      {c.original_means.total_clicks || 0}
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>OVERDUE TASKS</span>
                    <strong style={{ fontSize: '13px', color: (c.original_means.overdue_submissions_count || 0) > 0 ? '#e11d48' : '#059669' }}>
                      {c.original_means.overdue_submissions_count || 0}
                    </strong>
                  </div>
                </div>

                {/* Recommended Advisor Protocol */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    fontSize: '11.5px',
                    color: '#334155',
                    borderLeft: '3px solid var(--primary)',
                  }}
                >
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Recommended Advisor Protocol:
                  </strong>
                  {protocol}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Cluster Student Drill-down */}
        {selectedClusterId !== null && (
          <div className="arm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  Student Cohort Drill-Down: Cluster #{selectedClusterId} ({clusters.find(c => c.cluster_id === selectedClusterId)?.label})
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Representative active students assigned to this behavioral archetype at checkpoint {checkpoint}.
                </p>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                Showing Active Sample
              </div>
            </div>

            <div className="data-table-container">
              <table className="arm-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Course Code</th>
                    <th>Assigned Priority</th>
                    <th>Anomaly Rank</th>
                    <th>Primary Observed Driver</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        {loadingStudents ? 'Loading student cohort...' : 'No students found in this cluster.'}
                      </td>
                    </tr>
                  ) : (
                    clusterStudents.map((s: any) => {
                      const cleanId = String(s.student_id).replace('STU-', '');
                      return (
                        <tr key={s.enrollment_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <StudentAvatar studentId={cleanId} size={32} />
                              <div>
                                <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>Student #{cleanId}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                  student.{cleanId}@campus.edu
                                </div>
                              </div>
                            </div>
                          </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                            {s.course_code}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: s.priority === 'High' ? '#fff1f2' : (s.priority === 'Monitor' ? '#fffbeb' : '#ecfdf5'),
                              color: s.priority === 'High' ? '#e11d48' : (s.priority === 'Monitor' ? '#d97706' : '#059669'),
                              border: `1px solid ${s.priority === 'High' ? '#fecdd3' : (s.priority === 'Monitor' ? '#fde68a' : '#a7f3d0')}`,
                            }}
                          >
                            {s.priority}
                          </span>
                        </td>
                        <td>
                          {s.anomaly_percentile != null ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.anomaly_percentile >= 90 ? '#e11d48' : '#059669' }}>
                              {s.anomaly_percentile}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>{s.primary_warning}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => onNavigate(`/students/${s.enrollment_id}?checkpoint=${checkpoint}`)}
                            style={{ padding: '3px 8px', fontSize: '11.5px' }}
                          >
                            <span>Dossier</span>
                            <ArrowRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncState>
    </div>
  );
};
