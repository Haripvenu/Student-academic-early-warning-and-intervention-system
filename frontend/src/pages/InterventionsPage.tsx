import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { InterventionCase } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { StudentAvatar } from '../components/StudentAvatar';
import { useToast } from '../components/Toast';
import {
  HeartHandshake, Clock, CheckCircle2, AlertCircle, MessageSquare,
  PlusCircle, Calendar, ShieldCheck, User, Filter, AlertTriangle
} from 'lucide-react';

export const InterventionsPage: React.FC = () => {
  const { success, info } = useToast();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cases, setCases] = useState<InterventionCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected detail modal
  const [activeCase, setActiveCase] = useState<InterventionCase | null>(null);
  const [noteText, setNoteText] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await queries.getInterventions(statusFilter);
      setCases(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load intervention caseload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await queries.updateIntervention(caseId, { status: newStatus });
      success(`Case status transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`, 'Status Updated');
      loadCases();
      if (activeCase?.case_id === caseId) {
        const refreshed = await queries.getInterventionDetail(caseId);
        setActiveCase(refreshed);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update case status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (caseId: string) => {
    if (!noteText.trim()) return;
    setUpdating(true);
    try {
      await queries.updateIntervention(caseId, { new_note: noteText.trim() });
      success('Progress note recorded to student audit timeline', 'Note Logged');
      setNoteText('');
      const refreshed = await queries.getInterventionDetail(caseId);
      setActiveCase(refreshed);
      loadCases();
    } catch (e: any) {
      alert(e.message || 'Failed to add note');
    } finally {
      setUpdating(false);
    }
  };

  const openCasesCount = cases.filter((c) => c.status === 'open' || c.status === 'in_progress').length;
  const overdueCasesCount = cases.filter((c) => c.is_overdue).length;
  const resolvedCasesCount = cases.filter((c) => c.status === 'closed').length;

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
              Advisor Caseload
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Scheduled Follow-up Tracking</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Academic Support &amp; Intervention Cases
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Track assigned student interventions, outreach deadlines, and chronological mentor counseling audit events.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'pending_review', label: 'Pending Review' },
            { id: 'closed', label: 'Resolved / Closed' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                border: statusFilter === f.id ? '1px solid #4f46e5' : '1px solid transparent',
                background: statusFilter === f.id ? '#4f46e5' : 'transparent',
                color: statusFilter === f.id ? '#ffffff' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: statusFilter === f.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caseload Stat Strips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="arm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '8px', color: '#1d4ed8' }}>
            <HeartHandshake size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Caseload</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{openCasesCount} Cases</div>
          </div>
        </div>

        <div className="arm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: overdueCasesCount > 0 ? '#fff1f2' : '#ecfdf5', borderRadius: '8px', color: overdueCasesCount > 0 ? '#e11d48' : '#059669' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Past Target Deadline</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: overdueCasesCount > 0 ? '#e11d48' : '#059669' }}>
              {overdueCasesCount} Overdue
            </div>
          </div>
        </div>

        <div className="arm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Resolved Interventions</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>{resolvedCasesCount} Closed</div>
          </div>
        </div>
      </div>

      <AsyncState isLoading={loading} error={error} onRetry={loadCases}>
        <div className="arm-card">
          <div className="data-table-container">
            <table className="arm-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Student ID</th>
                  <th>Course Code</th>
                  <th>Prescribed Action Protocol</th>
                  <th>Priority</th>
                  <th>Follow-up Due Date</th>
                  <th>Deadline Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No intervention cases found under the selected filter.
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => {
                    const cleanId = String(c.student_id).replace('STU-', '');
                    return (
                      <tr key={c.case_id}>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: c.status === 'open' ? '#eff6ff' : (c.status === 'closed' ? '#ecfdf5' : '#fffbeb'),
                              color: c.status === 'open' ? '#1d4ed8' : (c.status === 'closed' ? '#047857' : '#b45309'),
                              border: `1px solid ${c.status === 'open' ? '#bfdbfe' : (c.status === 'closed' ? '#a7f3d0' : '#fde68a')}`,
                            }}
                          >
                            {c.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
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
                          {c.course_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.support_action}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: c.priority === 'High' ? '#fff1f2' : '#fffbeb',
                            color: c.priority === 'High' ? '#e11d48' : '#d97706',
                          }}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#334155', fontFamily: 'var(--font-mono)' }}>
                          {c.due_date.split('T')[0]}
                        </span>
                      </td>
                      <td>
                        {c.is_overdue ? (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={13} /> Overdue
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> On schedule
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            const detail = await queries.getInterventionDetail(c.case_id);
                            setActiveCase(detail);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11.5px' }}
                        >
                          <span>Manage</span>
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
      </AsyncState>

      {/* Case Management Drawer / Modal */}
      {activeCase && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveCase(null)}
        >
          <div
            className="arm-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#ffffff',
              boxShadow: 'var(--shadow-modal)',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CASE ID: #{activeCase.case_id}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', marginTop: '2px' }}>
                  {activeCase.support_action}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Student: <strong style={{ fontFamily: 'var(--font-mono)' }}>Student #{String(activeCase.student_id).replace('STU-', '')}</strong> ({activeCase.course_code})
                </p>
              </div>
              <button
                onClick={() => setActiveCase(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Status Toggles */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-card)', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TRANSITION CASE STATUS:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['open', 'in_progress', 'pending_review', 'closed'].map((st) => {
                  const isCurrent = activeCase.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(activeCase.case_id, st)}
                      disabled={updating}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isCurrent ? 700 : 500,
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: isCurrent ? '1px solid #4f46e5' : '1px solid var(--border-card)',
                        background: isCurrent ? '#4f46e5' : '#ffffff',
                        color: isCurrent ? '#ffffff' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Existing Notes */}
            {activeCase.notes && (
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Mentor Prescribed Action Plan:</span>
                <p style={{ fontSize: '13px', color: '#0f172a', background: '#f8fafc', padding: '12px', borderRadius: '6px', marginTop: '4px', border: '1px solid #e2e8f0' }}>
                  "{activeCase.notes}"
                </p>
              </div>
            )}

            {/* Add Progress Note */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Record Counseling Note / Student Conversation Log:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Record advising discussion notes, action agreed upon, or attendance pledge..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-card)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote(activeCase.case_id);
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddNote(activeCase.case_id)}
                  disabled={updating || !noteText.trim()}
                >
                  <MessageSquare size={13} />
                  <span>Log Note</span>
                </button>
              </div>
            </div>

            {/* Audit Trail Events */}
            {activeCase.events && activeCase.events.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CHRONOLOGICAL AUDIT TRAIL
                </span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeCase.events.map((ev) => (
                    <div key={ev.event_id} style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                      <strong>{ev.event_type}</strong>: {ev.description}
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>
                        ({ev.created_at.split('T')[0]})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
