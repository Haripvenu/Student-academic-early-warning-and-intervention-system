import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';

interface Props {
  features: Record<string, any>;
  priority?: string;
}

export const StudentRadarChart: React.FC<Props> = ({ features, priority = 'Routine' }) => {
  const attRate = Math.min(Math.max(Number(features?.attendance_rate || 100), 0), 100);
  const cwScore = Math.min(Math.max(Number(features?.assessment_avg_score || 70), 0), 100);
  const activeDays = Math.min((Number(features?.active_study_days || 10) / 35) * 100, 100);
  const clicksNorm = Math.min((Number(features?.total_clicks || 200) / 800) * 100, 100);
  const gpaNorm = Math.min((Number(features?.high_school_gpa || 3.0) / 4.0) * 100, 100);

  const data = [
    { subject: 'Attendance', student: Math.round(attRate), cohortMedian: 85, benchmark: 70 },
    { subject: 'Coursework', student: Math.round(cwScore), cohortMedian: 68, benchmark: 60 },
    { subject: 'Study Days', student: Math.round(activeDays), cohortMedian: 60, benchmark: 50 },
    { subject: 'LMS Clicks', student: Math.round(clicksNorm), cohortMedian: 55, benchmark: 45 },
    { subject: 'Entry Qual', student: Math.round(gpaNorm), cohortMedian: 65, benchmark: 50 },
  ];

  const studentColor = priority === 'High' ? '#e11d48' : priority === 'Monitor' ? '#d97706' : '#4f46e5';

  return (
    <div className="arm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            5-Axis Academic Radar Comparison
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Observed student performance against checkpoint cohort median and benchmark target.
          </p>
        </div>
      </div>

      <div style={{ height: 260, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="var(--border-card)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-light)', fontSize: 9 }} />
            <Radar
              name="This Student"
              dataKey="student"
              stroke={studentColor}
              fill={studentColor}
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Radar
              name="Cohort Median"
              dataKey="cohortMedian"
              stroke="#64748b"
              fill="#64748b"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              formatter={(val: any) => [`${val}/100`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
