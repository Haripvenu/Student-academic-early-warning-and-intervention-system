import React, { useState } from 'react';
import { ArrowLeft, Sliders, ShieldAlert, Award, Clock, Activity, BookOpen, CheckCircle2, Printer, Send, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import RadialGauge from '../components/RadialGauge';

export default function StudentDetailView({ student, onBack, onOpenWhatIf }) {
  if (!student) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>No student selected. Please pick a student from the Student Cohort Roster.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
          Go to Student Roster
        </button>
      </div>
    );
  }

  const { id_student, code_module, code_presentation, features, prediction } = student;
  const isHighRisk = prediction.risk_level === 'High Risk';
  const isModRisk = prediction.risk_level === 'Moderate Risk';

  const [mentorStatus, setMentorStatus] = useState('Pending Outreach');
  const [mentorNotes, setMentorNotes] = useState('');
  const [savedLog, setSavedLog] = useState(null);

  const shapData = prediction.top_factors.map((f) => ({
    name: f.feature_name_display,
    shap: f.shap_value,
    impact: f.direction === 'increases_risk' ? 'Increases Risk' : 'Protective Factor',
    color: f.direction === 'increases_risk' ? '#e11d48' : '#059669',
    value: f.student_value,
  }));

  const pillars = prediction.pillars || {
    attendance: { score: 45, label: 'Platform Attendance', status: 'Moderate', detail: `${features.active_days || 0} active days` },
    course_engagement: { score: 55, label: 'Course Engagement', status: 'Moderate', detail: `${features.total_clicks || 0} total clicks` },
    assessment_performance: { score: features.avg_score || 50, label: 'Continuous Assessment', status: 'Needs Review', detail: `${features.avg_score || 'N/A'}% average` },
    academic_background: { score: 70, label: 'Previous Academic Record', status: 'Adequate', detail: `Edu Tier: ${features.highest_education || 2}` }
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    setSavedLog({
      status: mentorStatus,
      notes: mentorNotes || 'Mentor reviewed Day 60 risk indicators and scheduled intervention.',
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to Roster</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Dossier</span>
          </button>
          <button className="btn btn-primary" onClick={() => onOpenWhatIf(student)}>
            <Sliders size={15} />
            <span>Simulate in What-If Lab</span>
          </button>
        </div>
      </div>

      {/* Main Diagnostic Profile Header Card */}
      <div className="card">
        <div className="profile-diagnostic-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Student #{id_student}
              </h2>
              <span className={`badge ${isHighRisk ? 'badge-high' : isModRisk ? 'badge-moderate' : 'badge-low'}`}>
                {prediction.risk_level}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '16px' }}>
              Module: <strong style={{ color: '#2563eb' }}>{code_module}</strong> ({code_presentation}) • Enrolled Credits: <strong>{features.studied_credits || 60}</strong>
            </p>

            <div className={`alert-banner ${isHighRisk ? 'alert-danger' : 'alert-info'}`} style={{ marginBottom: 0, padding: '14px 16px' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '13.5px' }}>Advisor Recommendation</h4>
                  <span style={{ fontSize: '10.5px', background: isHighRisk ? '#fee2e2' : '#e0f2fe', color: isHighRisk ? '#9f1239' : '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {prediction.urgency || 'Review'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.4 }}>{prediction.recommended_action}</p>
              </div>
            </div>
          </div>

          {/* Radial SVG Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RadialGauge
              percentage={prediction.risk_percentage}
              level={prediction.risk_level}
              size={170}
            />
          </div>
        </div>
      </div>

      {/* 4 PILLARS OF ACADEMIC & ENGAGEMENT ANALYSIS */}
      <div>
        <div className="section-header" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="section-title">Diagnostic Dimensions</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Key assessment and engagement categories</p>
          </div>
        </div>

        <div className="grid-kpi" style={{ marginBottom: 0 }}>
          {/* Pillar 1: Attendance */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <Clock size={14} color="#4f46e5" /> {pillars.attendance.label}
              </div>
              <span className={`badge ${pillars.attendance.score >= 60 ? 'badge-low' : (pillars.attendance.score >= 35 ? 'badge-moderate' : 'badge-high')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {pillars.attendance.status}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {pillars.attendance.score} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {pillars.attendance.detail}
            </div>
          </div>

          {/* Pillar 2: Continuous Assessment */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <Award size={14} color="#059669" /> {pillars.assessment_performance.label}
              </div>
              <span className={`badge ${pillars.assessment_performance.score >= 65 ? 'badge-low' : (pillars.assessment_performance.score >= 50 ? 'badge-moderate' : 'badge-high')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {pillars.assessment_performance.status}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: pillars.assessment_performance.score < 50 ? '#e11d48' : '#059669' }}>
              {features.avg_score != null ? `${features.avg_score}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {features.missed_assessments > 0 ? `${features.missed_assessments} missed test(s)` : 'All tests submitted'}
            </div>
          </div>

          {/* Pillar 3: Course Engagement */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <Activity size={14} color="#2563eb" /> {pillars.course_engagement.label}
              </div>
              <span className={`badge ${pillars.course_engagement.score >= 60 ? 'badge-low' : (pillars.course_engagement.score >= 30 ? 'badge-moderate' : 'badge-high')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {pillars.course_engagement.status}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {features.total_clicks || 0} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Clicks</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {features.clicks_last_2wk || 0} clicks in past 14 days
            </div>
          </div>

          {/* Pillar 4: Previous Academic Record */}
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <BookOpen size={14} color="#d97706" /> {pillars.academic_background.label}
              </div>
              <span className={`badge ${pillars.academic_background.score >= 60 ? 'badge-low' : 'badge-moderate'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {pillars.academic_background.status}
              </span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Tier {features.highest_education || 2} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ 4</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {features.num_of_prev_attempts || 0} prior attempt(s)
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions & Mentor Console Grid */}
      <div className="responsive-mentor-grid" style={{ marginBottom: 0 }}>
        {/* Prescribed Interventions List */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <div>
              <h3 className="section-title">Action Items</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Targeted recommendations based on risk factors
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(prediction.prescribed_interventions && prediction.prescribed_interventions.length > 0
              ? prediction.prescribed_interventions
              : [
                  { type: "Academic Deadline", priority: "High", title: "Assignment Recovery Window", action: "Grant a 7-day extension on missed coursework." },
                  { type: "Counseling", priority: "Medium", title: "Mentor Check-In", action: "Schedule 1-on-1 advisor call to diagnose attendance drop." }
                ]
            ).map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-card)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${item.priority === 'High' ? '#e11d48' : '#2563eb'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: item.priority === 'High' ? '#e11d48' : '#2563eb' }}>
                    {item.priority}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Mentor Action & Logging Console */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '14px' }}>
            <div>
              <h3 className="section-title">Log Action</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Record counseling or intervention progress
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveLog}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Status</label>
              <select
                className="form-input"
                style={{ padding: '7px 10px', fontSize: '13px' }}
                value={mentorStatus}
                onChange={(e) => setMentorStatus(e.target.value)}
              >
                <option value="Pending Outreach">Pending Outreach</option>
                <option value="1-on-1 Scheduled">1-on-1 Meeting Scheduled</option>
                <option value="Tutoring Assigned">Remedial Tutoring Assigned</option>
                <option value="Extension Granted">Deadline Extension Granted</option>
                <option value="Resolved">Resolved / Student On Track</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Notes</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Enter counseling summary..."
                value={mentorNotes}
                onChange={(e) => setMentorNotes(e.target.value)}
                style={{ fontSize: '13px' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              <Send size={13} />
              <span>Save Action Log</span>
            </button>
          </form>

          {savedLog && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#065f46' }}>
                <CheckCircle2 size={13} /> Logged: {savedLog.status}
              </div>
              <p style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                {savedLog.timestamp}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SHAP Factors & Root Cause Analysis */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '10px' }}>
          <div>
            <h3 className="section-title">Feature Attribution (SHAP)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Factors that contributed most strongly to this prediction
            </p>
          </div>
        </div>

        <div style={{ height: 230, margin: '10px 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ left: 80, right: 30, top: 5, bottom: 5 }}>
              <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={160} />
              <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                formatter={(val, name, item) => [`${val} (${item.payload.impact})`, 'SHAP Impact']}
              />
              <Bar dataKey="shap" radius={[3, 3, 3, 3]}>
                {shapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '11.5px', marginBottom: '14px' }}>
          <span style={{ color: '#e11d48', fontWeight: 600 }}>■ Increases Risk</span>
          <span style={{ color: '#059669', fontWeight: 600 }}>■ Protective Factor</span>
        </div>

        {/* Narrative interpretations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '14px' }}>
          {prediction.top_factors.slice(0, 3).map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                background: f.direction === 'increases_risk' ? '#fff1f2' : '#ecfdf5',
                borderRadius: '6px',
                borderLeft: `3px solid ${f.direction === 'increases_risk' ? '#e11d48' : '#059669'}`,
                fontSize: '12.5px'
              }}
            >
              <span style={{ fontWeight: 700, minWidth: '150px' }}>{f.feature_name_display}</span>
              <span style={{ color: f.direction === 'increases_risk' ? '#9f1239' : '#065f46', flex: 1 }}>
                {f.interpretation}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
