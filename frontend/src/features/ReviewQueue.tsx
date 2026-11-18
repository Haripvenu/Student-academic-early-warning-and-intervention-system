import React from 'react';
import { ReviewQueueItem } from '../api/types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StudentAvatar } from '../components/StudentAvatar';
import { PlusCircle, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  items: ReviewQueueItem[];
  onSelectEnrollment: (enrollmentId: string) => void;
  onCreateIntervention: (item: ReviewQueueItem) => void;
}

export const ReviewQueue: React.FC<Props> = ({
  items,
  onSelectEnrollment,
  onCreateIntervention,
}) => {
  return (
    <div className="arm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <div style={{ padding: '6px', background: '#fff1f2', borderRadius: '8px', color: '#e11d48' }}>
              <ShieldAlert size={18} />
            </div>
            <span>Priority Mentor Review Queue</span>
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Action-ranked active caseload ordered by multi-family severity, urgent follow-up deadlines, and corroborating anomaly percentile.
          </p>
        </div>

        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          Showing Top {items.length} Caseload Action Items
        </div>
      </div>

      <div className="data-table-container">
        <table className="arm-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Priority</th>
              <th>Student ID</th>
              <th>Course Offering</th>
              <th>Discovered Archetype</th>
              <th style={{ width: '130px' }}>Anomaly Rank</th>
              <th>Primary Warning Sign</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={24} color="#059669" />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>All students in this cohort are on track</span>
                    <span style={{ fontSize: '12px' }}>No pending High or Monitor review cases at this checkpoint.</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const anom = item.anomaly_percentile || 0;
                const anomColor = anom >= 90 ? '#e11d48' : anom >= 70 ? '#d97706' : '#059669';
                const cleanId = String(item.student_id).replace('STU-', '');

                return (
                  <tr key={item.enrollment_id}>
                    <td>
                      <PriorityBadge priority={item.priority} size="sm" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <StudentAvatar studentId={cleanId} size={32} />
                        <div>
                          <div
                            onClick={() => onSelectEnrollment(item.enrollment_id)}
                            style={{
                              fontWeight: 700,
                              color: '#0f172a',
                              cursor: 'pointer',
                              fontSize: '13.5px',
                              fontFamily: 'var(--font-mono)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                          >
                            Student #{cleanId}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                            student.{cleanId}@campus.edu
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: '#eef2ff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}
                        >
                          {item.course_code}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Sec {item.section}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {item.course_name}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                        {item.cluster_label || '—'}
                      </span>
                    </td>
                    <td>
                      {item.anomaly_percentile != null ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: anomColor }}>
                              {item.anomaly_percentile}%
                            </span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>rank</span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(anom, 100)}%`,
                                height: '100%',
                                background: anomColor,
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '12px',
                          color: item.priority === 'High' ? '#be123c' : '#475569',
                          fontWeight: item.priority === 'High' ? 600 : 400,
                        }}
                      >
                        {item.primary_warning}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onSelectEnrollment(item.enrollment_id)}
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="Open student diagnostic dossier"
                        >
                          <span>Diagnose</span>
                          <ChevronRight size={12} />
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onCreateIntervention(item)}
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="Log support action"
                        >
                          <PlusCircle size={12} />
                          <span>Intervene</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
