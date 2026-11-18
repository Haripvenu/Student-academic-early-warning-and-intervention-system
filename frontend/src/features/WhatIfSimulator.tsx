import React, { useState } from 'react';
import { Sliders, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import { PriorityBadge } from '../components/PriorityBadge';

interface Props {
  initialFeatures: Record<string, any>;
  observedPriority?: string;
  observedAnomaly?: number;
  onCommitContract?: (contractText: string) => void;
}

export const WhatIfSimulator: React.FC<Props> = ({
  initialFeatures,
  observedPriority = 'High',
  observedAnomaly = 75,
  onCommitContract,
}) => {
  const [att, setAtt] = useState<number>(() => Math.round(Number(initialFeatures?.attendance_rate ?? 100)));
  const [score, setScore] = useState<number>(() => Math.round(Number(initialFeatures?.assessment_avg_score ?? 50)));
  const [overdue, setOverdue] = useState<number>(() => Math.round(Number(initialFeatures?.overdue_submissions_count ?? 0)));
  const [days, setDays] = useState<number>(() => Math.round(Number(initialFeatures?.active_study_days ?? 8)));
  const [clicks, setClicks] = useState<number>(() => Math.round(Number(initialFeatures?.total_clicks ?? 150)));

  // Reset to original
  const handleReset = () => {
    setAtt(Math.round(Number(initialFeatures?.attendance_rate ?? 100)));
    setScore(Math.round(Number(initialFeatures?.assessment_avg_score ?? 50)));
    setOverdue(Math.round(Number(initialFeatures?.overdue_submissions_count ?? 0)));
    setDays(Math.round(Number(initialFeatures?.active_study_days ?? 8)));
    setClicks(Math.round(Number(initialFeatures?.total_clicks ?? 150)));
  };

  // Evaluate simulated priority
  const attConcern = att < 70;
  const cwConcern = score < 60 || overdue > 0;
  const engConcern = days < 4 || clicks < 40;

  const concerningCount = (attConcern ? 1 : 0) + (cwConcern ? 1 : 0) + (engConcern ? 1 : 0);

  // Simulated anomaly estimation
  const penalty = (attConcern ? 25 : 0) + (cwConcern ? 35 : 0) + (engConcern ? 30 : 0);
  const simulatedAnomaly = Math.min(Math.max(penalty + Math.round((100 - score) * 0.2), 5), 98);

  let simulatedPriority = 'Routine';
  let simulatedPolicyPath = 'Path B1: Standard healthy engagement under simulated targets';
  if (concerningCount >= 2) {
    simulatedPriority = 'High';
    simulatedPolicyPath = `Path E: Multi-family concern (${concerningCount} concerning families under simulation)`;
  } else if (concerningCount === 1) {
    if (simulatedAnomaly >= 85) {
      simulatedPriority = 'High';
      simulatedPolicyPath = 'Path D: Single concern with model corroboration';
    } else {
      simulatedPriority = 'Monitor';
      simulatedPolicyPath = 'Path C: Single concern under periodic monitoring';
    }
  }

  const isImproved = (observedPriority === 'High' && simulatedPriority !== 'High') || (simulatedAnomaly < (observedAnomaly || 75));

  const handleCommit = () => {
    const text = `Target Contract: Student agreed to raise Coursework to ${score}%, maintain Attendance ≥ ${att}%, resolve all overdue tasks (${overdue} target), and log ≥ ${days} active study days (${clicks} clicks target). Projected risk status: ${simulatedPriority}.`;
    if (onCommitContract) {
      onCommitContract(text);
    }
  };

  return (
    <div className="arm-card" style={{ border: '1px solid var(--primary-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <div style={{ padding: '6px', background: 'var(--primary-subtle)', borderRadius: '6px', color: 'var(--primary)' }}>
              <Sliders size={17} />
            </div>
            <span>Counterfactual "What-If" Academic Target Simulator</span>
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Simulate realistic metric improvements to see the projected shift in policy priority and anomaly rank.
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={handleReset} style={{ fontSize: '11.5px' }}>
          <RotateCcw size={12} />
          <span>Reset to Observed</span>
        </button>
      </div>

      {/* Before vs After Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '12px',
          alignItems: 'center',
          background: 'var(--bg-muted)',
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--border-card)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current Observed Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <PriorityBadge priority={observedPriority} size="sm" />
            <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {observedAnomaly}% rank
            </span>
          </div>
        </div>

        <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={20} />
        </div>

        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Projected Simulated Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <PriorityBadge priority={simulatedPriority} size="sm" />
            <span
              style={{
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: isImproved ? '#059669' : '#e11d48',
              }}
            >
              {simulatedAnomaly}% rank ({simulatedAnomaly - (observedAnomaly || 75) > 0 ? '+' : ''}{simulatedAnomaly - (observedAnomaly || 75)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Attendance Slider */}
        <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Attendance Rate:</span>
            <strong style={{ color: att < 70 ? '#e11d48' : '#059669' }}>{att}%</strong>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={att}
            onChange={(e) => setAtt(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Threshold: ≥ 70%</div>
        </div>

        {/* Assessment Score Slider */}
        <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Assessment Score:</span>
            <strong style={{ color: score < 60 ? '#e11d48' : '#059669' }}>{score} pts</strong>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Threshold: ≥ 60 pts</div>
        </div>

        {/* Overdue Submissions Slider */}
        <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Overdue Tasks:</span>
            <strong style={{ color: overdue > 0 ? '#e11d48' : '#059669' }}>{overdue} tasks</strong>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            value={overdue}
            onChange={(e) => setOverdue(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Threshold: 0 overdue</div>
        </div>

        {/* Active Study Days Slider */}
        <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Active Study Days:</span>
            <strong style={{ color: days < 4 ? '#e11d48' : '#059669' }}>{days} days</strong>
          </div>
          <input
            type="range"
            min={0}
            max={35}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Threshold: ≥ 4 days</div>
        </div>

        {/* Total Clicks Slider */}
        <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>VLE Total Clicks:</span>
            <strong style={{ color: clicks < 40 ? '#e11d48' : '#059669' }}>{clicks} clicks</strong>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            step={25}
            value={clicks}
            onChange={(e) => setClicks(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Threshold: ≥ 40 clicks</div>
        </div>
      </div>

      {/* Commit as Contract Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid var(--border-card)',
          paddingTop: '14px',
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Simulation path: <strong style={{ color: 'var(--primary)' }}>{simulatedPolicyPath}</strong>
        </div>

        {onCommitContract && (
          <button className="btn btn-primary btn-sm" onClick={handleCommit}>
            <Sparkles size={13} />
            <span>Set Simulated Targets as Student Contract</span>
          </button>
        )}
      </div>
    </div>
  );
};
