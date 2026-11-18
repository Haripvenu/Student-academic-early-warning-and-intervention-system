import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { AsyncState } from '../components/AsyncState';
import { useToast } from '../components/Toast';
import { Cpu, Play, RotateCcw, Copy, Check } from 'lucide-react';

export const ModelMonitoringPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [models, setModels] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkpoint, setCheckpoint] = useState('W4');
  const [triggering, setTriggering] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelsData, jobsData, evalData] = await Promise.all([
        queries.getRegisteredModels(checkpoint),
        queries.getJobs(),
        queries.getEvaluationReport(checkpoint),
      ]);
      setModels(modelsData);
      setJobs(jobsData);
      setEvaluation(evalData);
    } catch (e: any) {
      setError(e.message || 'Failed to load model monitoring diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [checkpoint]);

  const handleTriggerTrain = async () => {
    setTriggering(true);
    try {
      const res = await queries.triggerJob({ job_type: 'train', checkpoint });
      success(`Training job queued for Checkpoint ${checkpoint} (Job ID: ${res.job_id})`, 'Worker Job Dispatched');
      loadData();
    } catch (e: any) {
      toastError(e.message || 'Trigger failed', 'Job Queue Error');
    } finally {
      setTriggering(false);
    }
  };

  const handleTriggerScore = async () => {
    setTriggering(true);
    try {
      const res = await queries.triggerJob({ job_type: 'score', term_code: '2014J', checkpoint });
      success(`Batch scoring job queued for Term 2014J (${checkpoint})`, 'Scoring Pipeline Enqueued');
      loadData();
    } catch (e: any) {
      toastError(e.message || 'Trigger failed', 'Job Queue Error');
    } finally {
      setTriggering(false);
    }
  };

  const handleActivate = async (versionId: string) => {
    try {
      const res = await queries.activateModel(versionId);
      success(res.message, 'Model Version Promoted');
      loadData();
    } catch (e: any) {
      toastError(e.message, 'Activation Failed');
    }
  };

  const handleRollback = async () => {
    try {
      const res = await queries.rollbackModel(checkpoint);
      success(res.message, 'Rollback Executed');
      loadData();
    } catch (e: any) {
      toastError(e.message, 'Rollback Blocked');
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

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
              MLOps &amp; Governance
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Unsupervised Model Registry</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Model Operations, Audit &amp; Evaluation
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Unsupervised model artifact registry, asynchronous worker job telemetry, and retrospective alert validation.
          </p>
        </div>

        {/* Checkpoint selector */}
        <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
          {['W2', 'W4', 'W6'].map((ck) => (
            <button
              key={ck}
              onClick={() => setCheckpoint(ck)}
              style={{
                border: checkpoint === ck ? '1px solid #4f46e5' : '1px solid transparent',
                background: checkpoint === ck ? '#4f46e5' : 'transparent',
                color: checkpoint === ck ? '#ffffff' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: checkpoint === ck ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {ck === 'W2' ? 'Week 2 Models' : ck === 'W4' ? 'Week 4 Models' : 'Week 6 Models'}
            </button>
          ))}
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="arm-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
            Trigger Worker Jobs ({checkpoint})
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Jobs execute transactionally through the asynchronous worker queue with lease recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleTriggerTrain}
            disabled={triggering}
          >
            <Play size={13} color="var(--primary)" />
            <span>Train Model ({checkpoint})</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleTriggerScore}
            disabled={triggering}
          >
            <Play size={13} />
            <span>Score Cohort (2014J)</span>
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={handleRollback}
          >
            <RotateCcw size={13} color="#d97706" />
            <span>Rollback Version</span>
          </button>
        </div>
      </div>

      <AsyncState isLoading={loading} error={error} onRetry={loadData}>
        {/* Retrospective Performance Report Card */}
        {evaluation && evaluation.retrospective_metrics && (
          <div className="arm-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.2px' }}>
              Retrospective Validation &amp; Alert Calibration
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>
              Comparison of {checkpoint} early flags against ground-truth student course outcomes (Pass vs Fail / Withdrawn).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-card)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.4px' }}>
                  Evaluated Cohort
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {evaluation.retrospective_metrics.evaluated_cohort_size.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>student enrollments</div>
              </div>

              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.4px' }}>
                  Precision (True Alert Rate)
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  {(evaluation.retrospective_metrics.precision * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '2px' }}>flagged students truly failed</div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#047857', letterSpacing: '0.4px' }}>
                  Recall (Catch Rate)
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {(evaluation.retrospective_metrics.recall * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>failing students discovered</div>
              </div>

              <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#92400e', letterSpacing: '0.4px' }}>
                  Model Corroboration Impact
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  +{evaluation.model_corroboration_impact?.corroborated_cases_count || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>cases elevated to High</div>
              </div>
            </div>
          </div>
        )}

        {/* Registered Model Artifacts Table */}
        <div className="arm-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.2px' }}>
            Registered Model Artifacts ({checkpoint})
          </h3>

          <div className="data-table-container">
            <table className="arm-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Status</th>
                  <th>Version ID</th>
                  <th>Algorithm Pipeline</th>
                  <th>Training Window</th>
                  <th>SHA-256 Integrity Checksum</th>
                  <th>Registered At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.version_id}>
                    <td>
                      {m.is_active ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span className="live-indicator-dot" style={{ width: '6px', height: '6px' }} />
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Candidate</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{m.version_id}</td>
                    <td>{m.algorithm_type}</td>
                    <td>{m.training_window_terms}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748b' }}>
                          {m.integrity_checksum.substring(0, 16)}...
                        </span>
                        <button
                          onClick={() => copyHash(m.integrity_checksum)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
                          title="Copy full SHA-256 checksum"
                        >
                          {copiedHash === m.integrity_checksum ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{m.created_at.split('T')[0]}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!m.is_active && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleActivate(m.version_id)}
                          style={{ padding: '3px 8px', fontSize: '11.5px' }}
                        >
                          <span>Activate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Background Worker Job Runs Table */}
        <div className="arm-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.2px' }}>
            Worker Job Queue Telemetry
          </h3>

          <div className="data-table-container">
            <table className="arm-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Worker ID</th>
                  <th>Result Summary</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No recent background jobs executed.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.job_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 700 }}>
                        {j.job_id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{j.job_type.toUpperCase()}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: j.status === 'completed' ? '#ecfdf5' : (j.status === 'claimed' ? '#eff6ff' : '#fff1f2'),
                            color: j.status === 'completed' ? '#059669' : (j.status === 'claimed' ? '#2563eb' : '#e11d48'),
                          }}
                        >
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{j.progress_pct}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{j.worker_id || '—'}</td>
                      <td style={{ fontSize: '12px', maxWidth: '300px' }}>{j.result_summary || j.error_message || '—'}</td>
                      <td style={{ fontSize: '11.5px' }}>{j.created_at.split('T')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncState>
    </div>
  );
};
