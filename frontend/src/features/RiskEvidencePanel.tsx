import React from 'react';
import { CalendarCheck, BookOpenCheck, MousePointer, ShieldCheck, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  evidenceBreakdown: Record<string, any>;
  policyPath: string;
  primaryTriggers: string[];
}

export const RiskEvidencePanel: React.FC<Props> = ({
  evidenceBreakdown,
  policyPath,
  primaryTriggers,
}) => {
  const raw = evidenceBreakdown || {};

  // Attendance
  const att = raw.attendance || (raw.attendance_rate ? {
    value: `${raw.attendance_rate.value}%`,
    denominator: 'Session attendance rate',
    status: raw.attendance_rate.is_concerning ? 'Concerning' : 'Adequate',
    isConcerning: !!raw.attendance_rate.is_concerning,
  } : {});
  const attNum = parseFloat(att.value) || (raw.attendance_rate?.value != null ? raw.attendance_rate.value : 100);

  // Coursework
  const cw = raw.coursework || (raw.assessment_avg_score ? {
    value: `${raw.assessment_avg_score.value}%`,
    denominator: raw.overdue_submissions_count?.value > 0
      ? `${raw.overdue_submissions_count.value} overdue task(s)`
      : 'Continuous assessment score',
    status: (raw.assessment_avg_score.is_concerning || raw.overdue_submissions_count?.is_concerning) ? 'Concerning' : 'Adequate',
    isConcerning: !!(raw.assessment_avg_score.is_concerning || raw.overdue_submissions_count?.is_concerning),
  } : {});
  const cwNum = parseFloat(cw.value) || (raw.assessment_avg_score?.value != null ? raw.assessment_avg_score.value : 100);

  // Engagement
  const eng = raw.engagement || (raw.total_clicks ? {
    value: `${raw.total_clicks.value} clicks`,
    denominator: `${raw.active_study_days?.value || 0} active study days`,
    status: (raw.active_study_days?.is_concerning || raw.total_clicks?.is_concerning) ? 'Concerning' : 'Adequate',
    isConcerning: !!(raw.active_study_days?.is_concerning || raw.total_clicks?.is_concerning),
  } : {});

  const cov = raw.coverage || {
    has_sufficient_coverage: true,
    covered_families_count: 3,
  };

  const families = [
    {
      name: 'Session Attendance',
      icon: CalendarCheck,
      value: att.value || '100%',
      denom: att.denominator || 'Recorded eligible sessions',
      status: att.status || 'Adequate',
      isConcerning: att.status === 'Concerning' || !!att.isConcerning,
      progressPct: Math.min(Math.max(attNum, 0), 100),
      thresholdText: 'Threshold: ≥ 70%',
    },
    {
      name: 'Continuous Assessment',
      icon: BookOpenCheck,
      value: cw.value || 'N/A',
      denom: cw.denominator || 'Released grades & overdue tasks',
      status: cw.status || 'Adequate',
      isConcerning: cw.status === 'Concerning' || !!cw.isConcerning,
      progressPct: Math.min(Math.max(cwNum, 0), 100),
      thresholdText: 'Threshold: ≥ 60%',
    },
    {
      name: 'LMS Platform Activity',
      icon: MousePointer,
      value: eng.value || 'N/A',
      denom: eng.denominator || 'Active study days & clicks',
      status: eng.status || 'Adequate',
      isConcerning: eng.status === 'Concerning' || !!eng.isConcerning,
      progressPct: Math.min((parseFloat(eng.value) || 0) / 10, 100),
      thresholdText: 'Active Days & Clicks',
    },
  ];

  return (
    <div className="arm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
            Academic Evidence &amp; Policy Decision
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Deterministic review prioritization based on observed institutional data feeds.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              background: cov.has_sufficient_coverage ? '#ecfdf5' : '#fff1f2',
              color: cov.has_sufficient_coverage ? '#065f46' : '#9f1239',
              border: `1px solid ${cov.has_sufficient_coverage ? '#a7f3d0' : '#fecdd3'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {cov.has_sufficient_coverage ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            <span>{cov.covered_families_count || 3} of 3 Families Active</span>
          </span>
        </div>
      </div>

      {/* 3 Family Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {families.map((f, idx) => {
          const Icon = f.icon;
          const cardBg = f.isConcerning ? '#fff1f2' : '#f8fafc';
          const borderColor = f.isConcerning ? '#fecdd3' : '#e2e8f0';
          const accentColor = f.isConcerning ? '#e11d48' : '#059669';

          return (
            <div
              key={idx}
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: f.isConcerning ? '#9f1239' : '#334155' }}>
                    {f.name}
                  </span>
                  <div style={{ color: f.isConcerning ? '#e11d48' : '#64748b' }}>
                    <Icon size={16} />
                  </div>
                </div>

                <div style={{ fontSize: '22px', fontWeight: 800, color: f.isConcerning ? '#e11d48' : '#0f172a', letterSpacing: '-0.5px' }}>
                  {f.value}
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  {f.denom}
                </div>
              </div>

              {/* Progress gauge hairline */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${f.progressPct}%`,
                      height: '100%',
                      background: accentColor,
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>
                  <span>{f.thresholdText}</span>
                  <span style={{ fontWeight: 700, color: accentColor }}>{f.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy Path Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.6px' }}>
          DECISION POLICY PATH EXECUTED
        </div>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px', lineHeight: 1.4 }}>
          {policyPath}
        </div>

        {primaryTriggers && primaryTriggers.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Corroborating Diagnostic Observations:
            </span>
            <ul style={{ marginTop: '6px', paddingLeft: '18px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {primaryTriggers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
