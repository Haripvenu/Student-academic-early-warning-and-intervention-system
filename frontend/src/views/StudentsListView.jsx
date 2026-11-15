import React, { useState } from 'react';
import { Search, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Download } from 'lucide-react';

export default function StudentsListView({ students, onSelectStudent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filtered = students.filter((s) => {
    const matchesSearch = s.id_student.toString().includes(searchTerm) ||
                          s.code_module.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (riskFilter === 'HIGH' && s.prediction.risk_level !== 'High Risk') return false;
    if (riskFilter === 'MODERATE' && s.prediction.risk_level !== 'Moderate Risk') return false;
    if (riskFilter === 'LOW' && s.prediction.risk_level !== 'Low Risk') return false;

    if (moduleFilter !== 'ALL' && s.code_module !== moduleFilter) return false;

    return true;
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Student_ID,Module,Presentation,Risk_Score,Risk_Level,Avg_Score,Total_Clicks,Missed_Tests"]
      .concat(filtered.map(s => 
        `${s.id_student},${s.code_module},${s.code_presentation},${s.prediction.risk_percentage}%,${s.prediction.risk_level},${s.features.avg_score || 0},${s.features.total_clicks || 0},${s.features.missed_assessments || 0}`
      )).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduGuard_Students_Filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="section-title">Student Cohort Roster</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>{filtered.length}</strong> students evaluated at Day 60 checkpoint
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Module Filter Dropdown */}
          <select
            className="form-input"
            style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="ALL">All Modules</option>
            <option value="AAA">Module AAA</option>
            <option value="BBB">Module BBB</option>
            <option value="CCC">Module CCC</option>
            <option value="DDD">Module DDD</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '180px', paddingLeft: '32px', fontSize: '13px', padding: '6px 10px 6px 32px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f1f5f9',
              padding: '4px 6px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            {[
              { id: 'ALL', label: 'All' },
              { id: 'HIGH', label: 'High Risk' },
              { id: 'MODERATE', label: 'Moderate' },
              { id: 'LOW', label: 'Low Risk' }
            ].map((f) => {
              const isSelected = riskFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setRiskFilter(f.id)}
                  style={{
                    border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    background: isSelected ? '#2563eb' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    padding: '6px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 1px 3px rgba(37, 99, 235, 0.25)'
                      : '0 1px 2px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Module</th>
              <th>Status</th>
              <th>Risk Score</th>
              <th>Total Clicks</th>
              <th>Avg. Score</th>
              <th>Missed Tests</th>
              <th>Primary Driver</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const level = s.prediction.risk_level;
              let badgeClass = 'badge-low';
              let Icon = CheckCircle2;
              if (level === 'High Risk') {
                badgeClass = 'badge-high';
                Icon = AlertTriangle;
              } else if (level === 'Moderate Risk') {
                badgeClass = 'badge-moderate';
                Icon = AlertCircle;
              }

              return (
                <tr key={s.id_student}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                    #{s.id_student}
                  </td>
                  <td>
                    <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      {s.code_module}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${badgeClass}`}>
                      <Icon size={12} />
                      {level}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.prediction.risk_percentage}%
                  </td>
                  <td>{s.features.total_clicks || 0}</td>
                  <td>{s.features.avg_score != null ? `${s.features.avg_score}%` : 'N/A'}</td>
                  <td>
                    {s.features.missed_assessments > 0 ? (
                      <span style={{ color: '#e11d48', fontWeight: 800 }}>
                        {s.features.missed_assessments}
                      </span>
                    ) : (
                      <span style={{ color: '#059669' }}>0</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                    {s.prediction.top_factors[0]?.interpretation || 'Normal interaction pattern'}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onSelectStudent(s)}
                    >
                      <span>Diagnose</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
