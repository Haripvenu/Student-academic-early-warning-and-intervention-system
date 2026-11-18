import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface CourseMetric {
  code: string;
  name: string;
  faculty: 'STEM' | 'Social Sciences';
  enrollments: number;
  highRiskPct: number;
  meanScore: number;
  vleClicksPerStudent: number;
  status: 'critical' | 'elevated' | 'stable';
}

const COURSES_DATA: CourseMetric[] = [
  {
    code: 'AAA',
    name: 'Intro to Humanities & Critical Thought',
    faculty: 'Social Sciences',
    enrollments: 748,
    highRiskPct: 24.2,
    meanScore: 68.4,
    vleClicksPerStudent: 940,
    status: 'stable',
  },
  {
    code: 'BBB',
    name: 'Social Science in Action & Policy',
    faculty: 'Social Sciences',
    enrollments: 2280,
    highRiskPct: 34.6,
    meanScore: 62.1,
    vleClicksPerStudent: 680,
    status: 'elevated',
  },
  {
    code: 'CCC',
    name: 'Core STEM Principles & Computation',
    faculty: 'STEM',
    enrollments: 2498,
    highRiskPct: 45.8,
    meanScore: 54.3,
    vleClicksPerStudent: 490,
    status: 'critical',
  },
  {
    code: 'DDD',
    name: 'Applied Computing & Discrete Analysis',
    faculty: 'STEM',
    enrollments: 1804,
    highRiskPct: 38.1,
    meanScore: 58.7,
    vleClicksPerStudent: 550,
    status: 'elevated',
  },
  {
    code: 'EEE',
    name: 'Engineering Systems & Technical Design',
    faculty: 'STEM',
    enrollments: 1184,
    highRiskPct: 22.0,
    meanScore: 71.2,
    vleClicksPerStudent: 890,
    status: 'stable',
  },
  {
    code: 'FFF',
    name: 'Information Technologies & Networks',
    faculty: 'STEM',
    enrollments: 2382,
    highRiskPct: 41.5,
    meanScore: 56.9,
    vleClicksPerStudent: 510,
    status: 'critical',
  },
  {
    code: 'GGG',
    name: 'Psychology, Cognitive & Behavioral Study',
    faculty: 'Social Sciences',
    enrollments: 2530,
    highRiskPct: 29.4,
    meanScore: 65.5,
    vleClicksPerStudent: 760,
    status: 'stable',
  },
];

interface Props {
  onSelectCourse?: (courseCode: string) => void;
}

export const CourseRiskMatrix: React.FC<Props> = ({ onSelectCourse }) => {
  const [facultyFilter, setFacultyFilter] = useState<'ALL' | 'STEM' | 'Social Sciences'>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'enrollment' | 'score'>('risk');

  const filtered = COURSES_DATA.filter(
    (c) => facultyFilter === 'ALL' || c.faculty === facultyFilter
  ).sort((a, b) => {
    if (sortBy === 'risk') return b.highRiskPct - a.highRiskPct;
    if (sortBy === 'enrollment') return b.enrollments - a.enrollments;
    return a.meanScore - b.meanScore; // lowest score first
  });

  const getStatusBadge = (status: CourseMetric['status'], pct: number) => {
    if (status === 'critical') {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--risk-high-bg, #fff1f2)',
            color: 'var(--risk-high-text, #e11d48)',
            border: '1px solid var(--risk-high-border, #fecdd3)',
          }}
        >
          {pct}% Critical
        </span>
      );
    }
    if (status === 'elevated') {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--risk-medium-bg, #fffbeb)',
            color: 'var(--risk-medium-text, #d97706)',
            border: '1px solid var(--risk-medium-border, #fde68a)',
          }}
        >
          {pct}% Elevated
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'var(--risk-low-bg, #ecfdf5)',
          color: 'var(--risk-low-text, #059669)',
          border: '1px solid var(--risk-low-border, #a7f3d0)',
        }}
      >
        {pct}% Stable
      </span>
    );
  };

  return (
    <div className="arm-card-elevated" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Layers size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Course Attrition Risk Matrix (7 OULAD Modules)
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
            Comparative cross-module triage mapping enrollment pressure, disengagement, and submission pass rates.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
            {(['ALL', 'STEM', 'Social Sciences'] as const).map((fac) => (
              <button
                key={fac}
                onClick={() => setFacultyFilter(fac)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: facultyFilter === fac ? 'var(--bg-card)' : 'transparent',
                  color: facultyFilter === fac ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: facultyFilter === fac ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {fac === 'Social Sciences' ? 'SocSci' : fac}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="risk">Sort: Risk % (High to Low)</option>
            <option value="enrollment">Sort: Enrollment (Largest First)</option>
            <option value="score">Sort: Mean Score (Lowest First)</option>
          </select>
        </div>
      </div>

      {/* Grid of Course Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
        {filtered.map((c) => (
          <div
            key={c.code}
            onClick={() => onSelectCourse?.(c.code)}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-card-subtle)',
              cursor: onSelectCourse ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--border-card)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Top Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Module {c.code}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: c.faculty === 'STEM' ? '#e0e7ff' : '#fef3c7',
                      color: c.faculty === 'STEM' ? '#3730a3' : '#92400e',
                    }}
                  >
                    {c.faculty}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {c.name}
                </div>
              </div>
              {getStatusBadge(c.status, c.highRiskPct)}
            </div>

            {/* Risk Gauge Bar */}
            <div style={{ margin: '12px 0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>High Risk Caseload</span>
                <span style={{ fontWeight: 700, color: c.status === 'critical' ? '#e11d48' : (c.status === 'elevated' ? '#d97706' : '#059669') }}>
                  {c.highRiskPct}%
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'var(--border-card)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${c.highRiskPct}%`,
                    height: '100%',
                    background: c.status === 'critical' ? '#e11d48' : (c.status === 'elevated' ? '#f59e0b' : '#10b981'),
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-card)', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>ENROLLMENT</span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.enrollments.toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>MEAN SCORE</span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.meanScore}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>AVG CLICKS</span>
                <strong style={{ color: 'var(--text-primary)' }}>{c.vleClicksPerStudent}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
