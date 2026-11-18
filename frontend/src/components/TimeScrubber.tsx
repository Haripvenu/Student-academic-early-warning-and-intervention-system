import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface HorizonStep {
  id: string;
  label: string;
  week: string;
  leadTime: string;
  focus: string;
  confidence: string;
}

const HORIZONS: HorizonStep[] = [
  {
    id: 'W2',
    label: 'Registration & Onboarding',
    week: 'Week 2',
    leadTime: 'Day 14 of Term',
    focus: 'LMS clicks, orientation logins, initial assessment registration',
    confidence: '71.2% ROC-AUC',
  },
  {
    id: 'W4',
    label: 'Early Submission Checkpoint',
    week: 'Week 4',
    leadTime: 'Day 28 of Term',
    focus: 'First TMA submission latency, early quiz performance, study intensity',
    confidence: '84.6% ROC-AUC',
  },
  {
    id: 'W6',
    label: 'Census & Midterm Projection',
    week: 'Week 6',
    leadTime: 'Day 42 of Term',
    focus: 'Official census enrollment lock, weighted assessment grades, course trajectory',
    confidence: '89.1% ROC-AUC',
  },
];

interface Props {
  selectedHorizon: string;
  onChangeHorizon: (horizon: string) => void;
}

export const TimeScrubber: React.FC<Props> = ({ selectedHorizon, onChangeHorizon }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      const currentIndex = HORIZONS.findIndex((h) => h.id === selectedHorizon);
      const nextIndex = (currentIndex + 1) % HORIZONS.length;
      onChangeHorizon(HORIZONS[nextIndex].id);
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying, selectedHorizon, onChangeHorizon]);

  const activeIndex = Math.max(0, HORIZONS.findIndex((h) => h.id === selectedHorizon));
  const activeHorizon = HORIZONS[activeIndex] || HORIZONS[1];

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Semester Progression Horizon Player
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 8px',
              borderRadius: '10px',
              background: '#e0e7ff',
              color: '#3730a3',
              fontWeight: 700,
            }}
          >
            {activeHorizon.week} Active
          </span>
        </div>

        {/* Play / Pause Scrubber Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '4px 10px',
              background: isPlaying ? '#eef2ff' : 'var(--bg-card)',
              borderColor: isPlaying ? 'var(--primary)' : 'var(--border-card)',
              color: isPlaying ? 'var(--primary)' : 'var(--text-primary)',
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause Scrubber' : 'Auto-Play Term'}</span>
          </button>
        </div>
      </div>

      {/* Scrubber Timeline track */}
      <div style={{ position: 'relative', margin: '8px 0 4px' }}>
        {/* Connecting track line */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '5%',
            right: '5%',
            height: '4px',
            background: 'var(--border-card)',
            borderRadius: '2px',
            zIndex: 1,
          }}
        >
          {/* Active filled line */}
          <div
            style={{
              height: '100%',
              width: `${(activeIndex / (HORIZONS.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          {HORIZONS.map((h, idx) => {
            const isPassed = idx <= activeIndex;
            const isCurrent = h.id === selectedHorizon;
            return (
              <div
                key={h.id}
                onClick={() => onChangeHorizon(h.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  width: '180px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary)' : (isPassed ? '#4f46e5' : 'var(--bg-card)'),
                    border: `2px solid ${isPassed ? '#4f46e5' : 'var(--border-card)'}`,
                    color: isPassed ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {h.id}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {h.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {h.leadTime}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Horizon Detail Footer */}
      <div
        style={{
          background: 'var(--bg-app)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          border: '1px solid var(--border-card)',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Horizon Focus: <strong>{activeHorizon.focus}</strong>
        </span>
        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Model Confidence: {activeHorizon.confidence}
        </span>
      </div>
    </div>
  );
};
