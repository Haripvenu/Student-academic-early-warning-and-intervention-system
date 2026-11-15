import React, { useState } from 'react';
import { Users, AlertCircle, MousePointerClick, GraduationCap, ArrowRight, Download, Plus, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function DashboardView({ stats, metrics, onSelectStudent, sampleStudents, onOpenLivePredict }) {
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredStudents = selectedModule === 'ALL'
    ? sampleStudents
    : sampleStudents.filter((s) => s.code_module === selectedModule);

  const highRiskStudents = filteredStudents.filter(
    (s) => s.prediction.risk_level === 'High Risk'
  );

  const globalDrivers = metrics?.global_feature_importance?.slice(0, 5) || [];
  const chartDrivers = globalDrivers.map((d) => ({
    name: d.feature.replace(/_/g, ' '),
    importance: d.importance,
  }));

  const pieData = [
    { name: 'High Risk', value: stats?.high_risk_count || 19, color: '#f43f5e' },
    { name: 'Moderate Risk', value: stats?.moderate_risk_count || 16, color: '#f59e0b' },
    { name: 'Low Risk', value: stats?.low_risk_count || 15, color: '#10b981' }
  ];

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Student_ID,Module,Presentation,Risk_Score,Risk_Level,Avg_Score,Total_Clicks,Missed_Tests"]
      .concat(filteredStudents.map(s => 
        `${s.id_student},${s.code_module},${s.code_presentation},${s.prediction.risk_percentage}%,${s.prediction.risk_level},${s.features.avg_score || 0},${s.features.total_clicks || 0},${s.features.missed_assessments || 0}`
      )).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduGuard_Cohort_${selectedModule}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const avgScore = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.features.avg_score || 0), 0) / filteredStudents.length)
    : 0;

  const avgClicks = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.features.total_clicks || 0), 0) / filteredStudents.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Professional Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Cohort Analytics
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Early academic performance monitoring &amp; dropout prevention • Horizon: Day 60
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Module Selector */}
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
            {['ALL', 'AAA', 'BBB', 'CCC', 'DDD'].map((mod) => {
              const isSelected = selectedModule === mod;
              return (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(mod)}
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
                  {mod === 'ALL' ? 'All Modules' : mod}
                </button>
              );
            })}
          </div>

          <button className="btn btn-outline btn-sm" onClick={handleExportData}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={onOpenLivePredict}>
            <Plus size={14} />
            <span>Simulate Student</span>
          </button>
        </div>
      </div>

      {/* 4 Professional Stat Cards */}
      <div className="grid-kpi" style={{ marginBottom: 0 }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Monitored Cohort</span>
            <div className="kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{filteredStudents.length}</div>
          <div className="kpi-sub">
            <span>Enrolled Students</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">At-Risk Students</span>
            <div className="kpi-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#e11d48' }}>
            {highRiskStudents.length}
          </div>
          <div className="kpi-sub">
            <span style={{ color: '#e11d48', fontWeight: 600 }}>
              {filteredStudents.length > 0 ? Math.round((highRiskStudents.length / filteredStudents.length) * 100) : 0}% of cohort
            </span>
            <span>• Requires Attention</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Avg. Portal Activity</span>
            <div className="kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <MousePointerClick size={18} />
            </div>
          </div>
          <div className="kpi-value">{avgClicks}</div>
          <div className="kpi-sub">
            <span>Clicks per student (Day 0–60)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Continuous Assessment</span>
            <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="kpi-value">{avgScore}%</div>
          <div className="kpi-sub">
            <span>Cohort average score</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="charts-grid" style={{ marginBottom: 0 }}>
        {/* Risk Breakdown Donut */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '10px' }}>
            <div>
              <h3 className="section-title">Risk Distribution</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Categorized by predictive probability threshold</p>
            </div>
          </div>

          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px' }}>
            <span style={{ color: '#e11d48', fontWeight: 600 }}>● High Risk</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>● Moderate Risk</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>● Low Risk</span>
          </div>
        </div>

        {/* Global SHAP Drivers Chart */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '10px' }}>
            <div>
              <h3 className="section-title">Key Risk Drivers</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top behavioral signals influencing model predictions (SHAP)</p>
            </div>
          </div>

          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDrivers} layout="vertical" margin={{ left: 30, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={125} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  formatter={(val) => [`${val} SHAP score`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            Computed globally using Game-Theoretic TreeSHAP
          </p>
        </div>
      </div>

      {/* Priority Action Table */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="section-title">Students Requiring Intervention</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Flagged based on early attendance, activity, and assessment scores</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Module</th>
                <th>Risk Score</th>
                <th>Primary Warning Sign</th>
                <th>Clicks</th>
                <th>Avg. Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {highRiskStudents.slice(0, 6).map((s) => (
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
                    <span className="badge badge-high">
                      {s.prediction.risk_percentage}% At Risk
                    </span>
                  </td>
                  <td style={{ color: '#9f1239', fontSize: '13px', fontWeight: 500 }}>
                    {s.prediction.top_factors[0]?.interpretation || 'Low engagement'}
                  </td>
                  <td>{s.features.total_clicks || 0}</td>
                  <td style={{ fontWeight: 600 }}>{s.features.avg_score != null ? `${s.features.avg_score}%` : 'N/A'}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onSelectStudent(s)}
                      style={{ padding: '4px 10px' }}
                    >
                      <span>Diagnose</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
