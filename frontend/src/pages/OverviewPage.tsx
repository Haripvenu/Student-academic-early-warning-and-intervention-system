import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { DashboardSummary, FilterOptions, ReviewQueueItem } from '../api/types';
import { CohortFilters } from '../components/CohortFilters';
import { MetricCard } from '../components/MetricCard';
import { ChartFrame } from '../components/ChartFrame';
import { AsyncState } from '../components/AsyncState';
import { ReviewQueue } from '../features/ReviewQueue';
import { InterventionForm } from '../features/InterventionForm';
import { TimeScrubber } from '../components/TimeScrubber';
import { CourseRiskMatrix } from '../features/CourseRiskMatrix';
import { useToast } from '../components/Toast';
import {
  Users, AlertCircle, Clock, FileWarning, ArrowUpRight, ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';

interface Props {
  onNavigate: (path: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ onNavigate }) => {
  const { success } = useToast();
  const [filterOpts, setFilterOpts] = useState<FilterOptions>({ terms: [], checkpoints: [], offerings: [] });
  const [term, setTerm] = useState('2014J');
  const [checkpoint, setCheckpoint] = useState('W4');
  const [offering, setOffering] = useState('ALL');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intervention modal state
  const [selectedQueueItem, setSelectedQueueItem] = useState<ReviewQueueItem | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const opts = await queries.getFilters();
        setFilterOpts(opts);
        if (opts.terms.length > 0) {
          const match = opts.terms.find((t) => t.code === '2014J');
          setTerm(match ? match.code : opts.terms[0].code);
        }
      } catch (e: any) {
        console.error('Failed to load filter options:', e);
      }
    };
    fetchFilters();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await queries.getDashboardSummary(term, checkpoint, offering);
      setSummary(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load cohort analytics summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (term && checkpoint) {
      loadSummary();
    }
  }, [term, checkpoint, offering]);

  const handleInterventionSubmit = async (formData: any) => {
    await queries.createIntervention(formData);
    success(`Support case opened for student in ${formData.enrollment_id}`, 'Intervention Committed');
    loadSummary(); // Refresh queue
  };

  return (
    <div>
      {/* Page Header */}
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
              Academic Analytics
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Updated for Term {term}</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Cohort Risk Overview &amp; Triage
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Point-in-time early risk discovery, mentor caseload priority triage, and course-level disengagement monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate(`/students?term=${term}&checkpoint=${checkpoint}`)}
          >
            <Users size={14} />
            <span>View Full Caseload (11,260)</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('/interventions')}
          >
            <ShieldAlert size={14} />
            <span>Manage Interventions</span>
          </button>
        </div>
      </div>

      {/* Cohort Filter Bar */}
      <CohortFilters
        options={filterOpts}
        selectedTerm={term}
        selectedCheckpoint={checkpoint}
        selectedOffering={offering}
        onTermChange={setTerm}
        onCheckpointChange={setCheckpoint}
        onOfferingChange={setOffering}
      />

      {/* Multi-Horizon Semester Progression Scrubber */}
      <div style={{ marginBottom: '20px' }}>
        <TimeScrubber
          selectedHorizon={checkpoint}
          onChangeHorizon={(hz) => setCheckpoint(hz)}
        />
      </div>

      {/* Institutional Briefing Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          color: '#ffffff',
          marginBottom: '22px',
          boxShadow: '0 10px 20px -5px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Horizon Briefing
            </span>
            <span style={{ fontSize: '12px', opacity: 0.85 }}>Checkpoint {checkpoint} • 14 Days to Week 6 Census</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.4 }}>
            Unsupervised models flagged <strong>36.5% of cohort</strong> as High Priority requiring proactive advisor outreach before official census.
          </div>
          <div style={{ fontSize: '12.5px', opacity: 0.8, marginTop: '4px' }}>
            Primary drivers: assignment submission latency and severe platform engagement deficit in VLE study days.
          </div>
        </div>

        <button
          className="btn btn-sm"
          onClick={() => onNavigate(`/students?term=${term}&checkpoint=${checkpoint}&priority=High`)}
          style={{
            background: '#ffffff',
            color: '#312e81',
            fontWeight: 700,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '8px 16px',
          }}
        >
          <span>Triage High Priority</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      <AsyncState isLoading={loading} error={error} onRetry={loadSummary}>
        {summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 4 Core KPI Cards */}
            <div className="grid-kpi">
              <MetricCard
                title="Assessed Enrollments"
                value={summary.kpis.assessed_enrollments.toLocaleString()}
                unit="students"
                subtitle={`Evaluated at ${checkpoint} horizon`}
                icon={Users}
                badgeType="primary"
                onClick={() => onNavigate(`/students?term=${term}&checkpoint=${checkpoint}`)}
              />

              <MetricCard
                title="High Review Priority"
                value={summary.kpis.high_priority_count.toLocaleString()}
                badgeText={`${summary.kpis.high_priority_pct}% of cohort`}
                badgeType="danger"
                subtitle="Requires immediate mentor contact"
                icon={AlertCircle}
                onClick={() => onNavigate(`/students?term=${term}&checkpoint=${checkpoint}&priority=High`)}
              />

              <MetricCard
                title="Overdue Follow-ups"
                value={summary.kpis.overdue_followups_count}
                badgeText={summary.kpis.overdue_followups_count > 0 ? 'Requires attention' : 'All current'}
                badgeType={summary.kpis.overdue_followups_count > 0 ? 'warning' : 'success'}
                subtitle="Cases past target advisor deadline"
                icon={Clock}
                onClick={() => onNavigate('/interventions?status=open')}
              />

              <MetricCard
                title="Insufficient Data"
                value={summary.kpis.insufficient_data_count}
                badgeText={summary.kpis.insufficient_data_count === 0 ? '100% Coverage' : 'Coverage gap'}
                badgeType={summary.kpis.insufficient_data_count === 0 ? 'success' : 'neutral'}
                subtitle="<2 data families recorded"
                icon={FileWarning}
                onClick={() => onNavigate(`/students?term=${term}&checkpoint=${checkpoint}&priority=Insufficient data`)}
              />
            </div>

            {/* Visual Charts Grid */}
            <div className="grid-two-column">
              {/* Priority by Course Chart */}
              <ChartFrame
                title="Review Priority Breakdown by Course Module"
                subtitle="Distribution of High, Monitor, and Routine statuses across all 7 courses"
                unit="enrollments"
                tableAlternativeData={summary.priority_by_course.map((c) => ({
                  label: c.course_code,
                  values: { High: c.High, Monitor: c.Monitor, Routine: c.Routine, Insufficient: c.Insufficient, Total: c.total },
                }))}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.priority_by_course} margin={{ top: 12, right: 12, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="course_code" fontSize={11} stroke="#64748b" tickLine={false} />
                    <YAxis fontSize={11} stroke="#64748b" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="High" name="High Priority" fill="#e11d48" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Monitor" name="Periodic Monitor" fill="#d97706" stackId="a" />
                    <Bar dataKey="Routine" name="Routine On-Track" fill="#059669" stackId="a" />
                    <Bar dataKey="Insufficient" name="Insufficient Data" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>

              {/* Checkpoint Trend Chart */}
              <ChartFrame
                title="Multi-Horizon Checkpoint Progression"
                subtitle="Cohort trajectory of alert volumes from Week 2 → Week 4 → Week 6"
                unit="cases"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.checkpoint_trend} margin={{ top: 12, right: 12, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRoutine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="checkpoint" fontSize={11} stroke="#64748b" tickLine={false} />
                    <YAxis fontSize={11} stroke="#64748b" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area type="monotone" dataKey="High" name="High Priority" stroke="#e11d48" fillOpacity={1} fill="url(#colorHigh)" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Area type="monotone" dataKey="Monitor" name="Periodic Monitor" stroke="#d97706" fill="transparent" strokeWidth={2} dot={{ r: 4 }} />
                    <Area type="monotone" dataKey="Routine" name="Routine On-Track" stroke="#059669" fillOpacity={1} fill="url(#colorRoutine)" strokeWidth={2} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFrame>
            </div>

            {/* 7-Course Risk Heatmap Matrix */}
            <CourseRiskMatrix
              onSelectCourse={(courseCode) =>
                onNavigate(`/students?term=${term}&checkpoint=${checkpoint}&offering=${courseCode}`)
              }
            />

            {/* Actionable Review Queue */}
            <ReviewQueue
              items={summary.review_queue}
              onSelectEnrollment={(id) => onNavigate(`/students/${id}?checkpoint=${checkpoint}`)}
              onCreateIntervention={(item) => setSelectedQueueItem(item)}
            />
          </div>
        )}
      </AsyncState>

      {/* Intervention Modal */}
      {selectedQueueItem && (
        <InterventionForm
          enrollmentId={selectedQueueItem.enrollment_id}
          studentName={selectedQueueItem.student_name}
          courseCode={selectedQueueItem.course_code}
          isOpen={true}
          onClose={() => setSelectedQueueItem(null)}
          onSubmit={handleInterventionSubmit}
        />
      )}
    </div>
  );
};
