import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { useToast } from '../components/Toast';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Download, ShieldCheck, Database, FileSpreadsheet } from 'lucide-react';
import { AsyncState } from '../components/AsyncState';

export const ImportsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entityType, setEntityType] = useState('attendance');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await queries.getImportBatches();
      setBatches(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load import batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const res = await queries.uploadCsv(entityType, selectedFile);
      setUploadResult(res);
      setSelectedFile(null);
      success(`Imported ${res.imported_rows} rows (${res.error_rows} errors)`, 'CSV Processing Complete');
      loadBatches();
    } catch (err: any) {
      toastError(err.message || 'CSV Import failed', 'Import Error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = (type: string) => {
    let headers = '';
    let sample = '';
    if (type === 'attendance') {
      headers = 'session_id,enrollment_id,session_date,present_flag,event_timestamp_utc,available_at_utc';
      sample = 'SESS-001,ENR-6516-AAA-2014J,2014-10-15,1,2014-10-15T09:00:00Z,2014-10-15T18:00:00Z';
    } else if (type === 'submissions') {
      headers = 'submission_id,assessment_id,enrollment_id,score,submission_timestamp_utc,available_at_utc';
      sample = 'SUB-001,ASM-AAA-TMA1,ENR-6516-AAA-2014J,78.5,2014-10-20T14:30:00Z,2014-10-21T08:00:00Z';
    } else if (type === 'students') {
      headers = 'student_id,first_name,last_name,email,cohort_year,high_school_gpa';
      sample = '6516,Frank,Walker,frank.walker@campus.edu,2014,3.4';
    } else {
      headers = 'offering_id,term_code,course_code,course_name,credits,section';
      sample = 'OFF-AAA-2014J,2014J,AAA,Discovering Arts and Humanities,30,001';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, sample].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `template_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Downloaded official CSV template for ${type}`, 'Template Ready');
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
              Institutional Data Operations
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Dual-Timestamp Contract Ingestion</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Institutional Data Feeds &amp; Validation
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Automated CSV ingest pipeline with foreign-key validation, temporal leakage prevention, and row-level error audit trails.
          </p>
        </div>
      </div>

      <div className="grid-two-column" style={{ marginBottom: '24px' }}>
        {/* Upload Form */}
        <div className="arm-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <div style={{ padding: '6px', background: '#eef2ff', borderRadius: '6px', color: 'var(--primary)' }}>
              <UploadCloud size={17} />
            </div>
            <span>Upload Academic CSV Data Feed</span>
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Target Entity Contract:
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-card)',
                  outline: 'none',
                  background: '#ffffff',
                }}
              >
                <option value="attendance">attendance.csv (Sessions &amp; presence status)</option>
                <option value="submissions">submissions.csv (Assignment TMA/CMA scores &amp; dates)</option>
                <option value="students">students.csv (Core student roster entries)</option>
                <option value="engagement_events">engagement_events.csv (LMS VLE interaction logs)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Select Validated CSV File:
              </label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <FileSpreadsheet size={28} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {selectedFile ? selectedFile.name : 'Click to choose or drag CSV here'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'UTF-8 encoded .csv up to 50MB'}
                </div>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !selectedFile}
              style={{ padding: '10px' }}
            >
              <span>{uploading ? 'Validating & Ingesting Feed...' : 'Validate & Ingest CSV Feed'}</span>
            </button>
          </form>

          {/* Upload Result Feedback */}
          {uploadResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: '8px',
                background: uploadResult.status === 'completed' ? '#ecfdf5' : '#fff1f2',
                border: `1px solid ${uploadResult.status === 'completed' ? '#a7f3d0' : '#fecdd3'}`,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13.5px', color: uploadResult.status === 'completed' ? '#065f46' : '#9f1239' }}>
                Batch Result: {uploadResult.status.toUpperCase()} ({uploadResult.imported_rows} imported, {uploadResult.error_rows} errors)
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <ul style={{ marginTop: '8px', paddingLeft: '18px', fontSize: '11.5px', color: '#be123c', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {uploadResult.errors.slice(0, 5).map((err: any, i: number) => (
                    <li key={i}>Row {err.row}: {err.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Data Schema & Contract Summary */}
        <div className="arm-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.2px' }}>
            Data Contracts &amp; Temporal Isolation
          </h3>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
            To mathematically eliminate <strong>look-ahead bias</strong> and data leakage, all institutional feeds enforce dual timestamps:
            <strong> event_timestamp_utc</strong> (when the student action took place) and <strong>available_at_utc</strong> (when the data became available in campus feeds).
          </p>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '12px', marginBottom: '14px' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>Download Clean CSV Templates:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownloadTemplate('attendance')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                <Download size={12} />
                <span>attendance.csv</span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownloadTemplate('submissions')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                <Download size={12} />
                <span>submissions.csv</span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownloadTemplate('students')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                <Download size={12} />
                <span>students.csv</span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleDownloadTemplate('course_offerings')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                <Download size={12} />
                <span>course_offerings.csv</span>
              </button>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            Institutional feeds are validated automatically by the asynchronous worker queue.
          </div>
        </div>
      </div>

      {/* Batch Execution History */}
      <div className="arm-card">
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.2px' }}>
          Recent Import Batch Executions
        </h3>

        <AsyncState isLoading={loading} error={error} onRetry={loadBatches}>
          <div className="data-table-container">
            <table className="arm-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Entity Type</th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Total Rows</th>
                  <th>Imported</th>
                  <th>Errors</th>
                  <th>Execution Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No recent import batches recorded. Upload a CSV above to test.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.batch_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 700 }}>
                        {b.batch_id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{b.entity_type}</td>
                      <td>{b.file_name}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: b.status === 'completed' ? '#ecfdf5' : '#fff1f2',
                            color: b.status === 'completed' ? '#047857' : '#be123c',
                          }}
                        >
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{b.total_rows}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>{b.imported_rows}</td>
                      <td style={{ color: b.error_rows > 0 ? '#e11d48' : '#64748b', fontWeight: 600 }}>
                        {b.error_rows}
                      </td>
                      <td style={{ fontSize: '12px' }}>{b.created_at.split('T')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </div>
  );
};
