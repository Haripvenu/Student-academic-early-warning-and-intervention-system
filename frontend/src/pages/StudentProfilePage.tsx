import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { EnrollmentDetail } from '../api/types';
import { PriorityBadge } from '../components/PriorityBadge';
import { StudentAvatar } from '../components/StudentAvatar';
import { RiskEvidencePanel } from '../features/RiskEvidencePanel';
import { ModelSignalsPanel } from '../features/ModelSignalsPanel';
import { CheckpointTrend } from '../features/CheckpointTrend';
import { InterventionForm } from '../features/InterventionForm';
import { StudentRadarChart } from '../features/StudentRadarChart';
import { WhatIfSimulator } from '../features/WhatIfSimulator';
import { NudgeGeneratorModal } from '../features/NudgeGeneratorModal';
import { AsyncState } from '../components/AsyncState';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, PlusCircle, Printer, Clock, User, BookOpen,
  Calendar, Award, Check, Copy, GraduationCap, Sparkles, MessageSquare, ShieldAlert, Mail
} from 'lucide-react';

interface Props {
  enrollmentId: string;
  onBack: () => void;
}

export const StudentProfilePage: React.FC<Props> = ({ enrollmentId, onBack }) => {
  const { success } = useToast();
  const initialCheckpoint = new URLSearchParams(window.location.search).get('checkpoint') || 'W4';
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>(initialCheckpoint);
  const [detail, setDetail] = useState<EnrollmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const loadDetail = async (ck: string = selectedCheckpoint) => {
    setLoading(true);
    setError(null);
    try {
      const res = await queries.getEnrollmentDetail(enrollmentId, ck);
      setDetail(res);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch student diagnostic profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail(selectedCheckpoint);
  }, [enrollmentId, selectedCheckpoint]);

  const cleanStudentId = detail ? String(detail.student.student_id).replace('STU-', '') : '';
  const studentLabel = `Student #${cleanStudentId}`;

  const handleCreateIntervention = async (formData: any) => {
    await queries.createIntervention(formData);
    success(`Support case committed with action: ${formData.support_action}`, 'Intervention Case Logged');
    loadDetail(selectedCheckpoint); // Refresh intervention timeline
  };

  const copyStudentId = (id: string | number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Caseload</span>
        </button>

        {/* Checkpoint Horizon Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Evaluation Horizon:</span>
          <div style={{ display: 'flex', gap: '3px', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
            {['W2', 'W4', 'W6'].map((ck) => {
              const isSelected = selectedCheckpoint === ck;
              return (
                <button
                  key={ck}
                  onClick={() => setSelectedCheckpoint(ck)}
                  style={{
                    border: isSelected ? '1px solid #4f46e5' : '1px solid transparent',
                    background: isSelected ? '#4f46e5' : 'transparent',
                    color: isSelected ? '#ffffff' : '#475569',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {ck === 'W2' ? 'Week 2' : ck === 'W4' ? 'Week 4' : 'Week 6'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Print Dossier</span>
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsNudgeModalOpen(true)}
            style={{
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
              background: 'rgba(79, 70, 229, 0.04)',
            }}
          >
            <Mail size={14} />
            <span>Send Outreach Nudge</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsInterventionModalOpen(true)}>
            <PlusCircle size={14} />
            <span>Open Support Case</span>
          </button>
        </div>
      </div>

      <AsyncState isLoading={loading} error={error} onRetry={() => loadDetail(selectedCheckpoint)}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Header Profile Dossier Banner */}
            <div
              className="arm-card"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <StudentAvatar
                    studentId={cleanStudentId}
                    size={64}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', fontFamily: 'var(--font-mono)' }}>
                        {studentLabel}
                      </h2>
                      {detail.assessment && <PriorityBadge priority={detail.assessment.priority} />}
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Student ID:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>#{cleanStudentId}</strong>
                        <button
                          onClick={() => copyStudentId(cleanStudentId)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
                          title="Copy student ID"
                        >
                          {copiedId ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <span>•</span>
                      <span>Email: <strong style={{ fontFamily: 'var(--font-mono)' }}>{detail.student.email}</strong></span>
                      <span>•</span>
                      <span>Cohort: <strong>{detail.student.cohort_year}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Course Offering Details Box */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #e2e8f0',
                    textAlign: 'right',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                    {detail.offering.course_code}: {detail.offering.course_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Section {detail.offering.section} • {detail.offering.credits} Credits • Term {detail.offering.term_code}
                  </div>
                </div>
              </div>

              {/* Quick Diagnostic Metrics Ribbon */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>ATTENDANCE RATE</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {detail.features?.attendance_rate != null ? `${round1(detail.features.attendance_rate)}%` : '100%'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>CONTINUOUS ASSESSMENT</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: (detail.features?.assessment_avg_score || 0) < 60 ? '#e11d48' : '#0f172a', marginTop: '2px' }}>
                    {detail.features?.assessment_avg_score != null ? `${round1(detail.features.assessment_avg_score)} pts` : '—'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>LMS PLATFORM CLICKS</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {detail.features?.total_clicks != null ? `${detail.features.total_clicks} clicks` : '—'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>ANOMALY PERCENTILE</span>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: (detail.assessment?.anomaly_percentile || 0) >= 90 ? '#e11d48' : ((detail.assessment?.anomaly_percentile || 0) >= 70 ? '#d97706' : '#059669'),
                      marginTop: '2px',
                    }}
                  >
                    {detail.assessment?.anomaly_percentile != null ? `${detail.assessment.anomaly_percentile}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Split layout: Academic Evidence + Model Signals */}
            <div className="grid-two-column">
              <RiskEvidencePanel
                evidenceBreakdown={detail.evidence_breakdown}
                policyPath={detail.assessment?.policy_path || 'No evaluation policy recorded'}
                primaryTriggers={detail.assessment?.primary_triggers || []}
              />

              <ModelSignalsPanel
                clusterLabel={detail.assessment?.cluster_label}
                anomalyPercentile={detail.assessment?.anomaly_percentile}
                sensitivities={detail.score_sensitivities || []}
              />
            </div>

            {/* Radar Comparison Chart & Interactive Simulator */}
            <div className="grid-two-column">
              <StudentRadarChart
                features={detail.features || {}}
                priority={detail.assessment?.priority}
              />

              <WhatIfSimulator
                initialFeatures={detail.features || {}}
                observedPriority={detail.assessment?.priority}
                observedAnomaly={detail.assessment?.anomaly_percentile}
                onCommitContract={(contract) => {
                  success(contract, 'Academic Contract Saved');
                }}
              />
            </div>

            {/* Checkpoint Trajectory History */}
            {detail.historical_checkpoints && detail.historical_checkpoints.length > 0 && (
              <CheckpointTrend historicalCheckpoints={detail.historical_checkpoints} />
            )}

            {/* Intervention Cases & Audit Trail */}
            <div className="arm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                    Intervention Case History &amp; Audit Trail
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Official mentoring timeline, assigned support protocols, and student progress notes.
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsInterventionModalOpen(true)}
                  style={{ fontSize: '12px' }}
                >
                  <PlusCircle size={13} />
                  <span>Log Support Action</span>
                </button>
              </div>

              {detail.interventions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13px' }}>
                  No prior intervention cases recorded for this student in this course offering.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {detail.interventions.map((c: any) => (
                    <div
                      key={c.case_id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>
                            {c.support_action}
                          </span>
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: c.status === 'open' ? '#eff6ff' : (c.status === 'closed' ? '#ecfdf5' : '#fffbeb'),
                              color: c.status === 'open' ? '#1d4ed8' : (c.status === 'closed' ? '#047857' : '#b45309'),
                              fontWeight: 700,
                            }}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Follow-up Due: <strong>{c.due_date?.split('T')[0]}</strong>
                        </span>
                      </div>
                      {c.notes && (
                        <p style={{ fontSize: '13px', color: '#334155', marginBottom: '10px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          "{c.notes}"
                        </p>
                      )}
                      {c.events && c.events.length > 0 && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            AUDIT TIMELINE
                          </span>
                          <ul style={{ paddingLeft: '16px', fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {c.events.map((ev: any) => (
                              <li key={ev.id}>
                                <strong>{ev.type}</strong>: {ev.desc} <span style={{ opacity: 0.7 }}>({ev.time.split('T')[0]})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AsyncState>

      {/* Intervention Modal */}
      {detail && (
        <InterventionForm
          enrollmentId={detail.enrollment_id}
          studentName={studentLabel}
          courseCode={detail.offering.course_code}
          isOpen={isInterventionModalOpen}
          onClose={() => setIsInterventionModalOpen(false)}
          onSubmit={handleCreateIntervention}
        />
      )}

      {/* 1-Click Outreach Nudge Generator Modal */}
      {detail && (
        <NudgeGeneratorModal
          isOpen={isNudgeModalOpen}
          onClose={() => setIsNudgeModalOpen(false)}
          student={{
            student_id: cleanStudentId,
            course_code: detail.offering.course_code,
            term_code: detail.offering.term_code,
            priority: detail.assessment?.priority,
            primary_factor: detail.assessment?.primary_triggers?.[0],
          }}
          onLogIntervention={(info) => {
            handleCreateIntervention({
              enrollment_id: detail.enrollment_id,
              support_action: `Outreach Nudge (${info.template})`,
              assigned_to: 'Dr. Sarah Chen',
              due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              notes: `Email Subject: ${info.subject}. Notes: ${info.notes || 'Automated outreach generated.'}`,
            });
          }}
        />
      )}
    </div>
  );
};

function round1(val: number): string {
  return Number(val).toFixed(1);
}
