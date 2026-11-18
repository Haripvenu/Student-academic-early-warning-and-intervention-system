import React, { useState, useEffect } from 'react';
import { queries } from '../api/queries';
import { EnrollmentListItem, FilterOptions } from '../api/types';
import { CohortFilters } from '../components/CohortFilters';
import { DataTable, Column } from '../components/DataTable';
import { PriorityBadge } from '../components/PriorityBadge';
import { StudentAvatar } from '../components/StudentAvatar';
import { AsyncState } from '../components/AsyncState';
import { useToast } from '../components/Toast';
import { ArrowRight, Download, UserCheck, Copy, Check } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const StudentExplorerPage: React.FC<Props> = ({ onNavigate }) => {
  const { success } = useToast();
  const [filterOpts, setFilterOpts] = useState<FilterOptions>({ terms: [], checkpoints: [], offerings: [] });

  // Read URL query params on load if any
  const params = new URLSearchParams(window.location.search);
  const [term, setTerm] = useState(params.get('term') || '2014J');
  const [checkpoint, setCheckpoint] = useState(params.get('checkpoint') || 'W4');
  const [offering, setOffering] = useState(params.get('offering') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(params.get('priority') || 'ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const opts = await queries.getFilters();
        setFilterOpts(opts);
        if (opts.terms.length > 0 && !params.get('term')) {
          const match = opts.terms.find((t) => t.code === '2014J');
          setTerm(match ? match.code : opts.terms[0].code);
        }
      } catch (e) {
        console.error('Failed to load filter options:', e);
      }
    };
    fetchFilters();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedOffObj = filterOpts.offerings.find((o) => o.offering_id === offering);
      const courseCodeParam = selectedOffObj ? selectedOffObj.course_code : undefined;

      const res = await queries.getEnrollments({
        term_code: term,
        checkpoint,
        course_code: courseCodeParam,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setEnrollments(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch student enrollment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [term, checkpoint, offering, priorityFilter, page, debouncedSearch]);

  const copyToClipboard = (text: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(text));
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleSelectAll = () => {
    const allVisible = enrollments.map((e) => e.enrollment_id);
    const areAllSelected = allVisible.length > 0 && allVisible.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (areAllSelected) {
      allVisible.forEach((id) => next.delete(id));
    } else {
      allVisible.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAssign = () => {
    success(`Assigned ${selectedIds.size} student cases to Dr. Sarah Chen`, 'Caseload Updated');
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedRows = enrollments.filter((e) => selectedIds.has(e.enrollment_id));
    const header = ['Enrollment_ID', 'Student_ID', 'Course', 'Section', 'Priority', 'Discovered_Profile', 'Anomaly_Percentile', 'Primary_Driver'];
    const rows = selectedRows.map((e) => [
      e.enrollment_id,
      e.student_id,
      e.course_code,
      e.section,
      e.review_priority,
      `"${e.cluster_label || ''}"`,
      e.anomaly_percentile || '',
      `"${e.primary_warning || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `ARM_Selected_${selectedRows.length}_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported ${selectedRows.length} selected student records`, 'Selected CSV Downloaded');
  };

  const handleExportCSV = () => {
    const header = ['Enrollment_ID', 'Student_ID', 'Course', 'Section', 'Priority', 'Discovered_Profile', 'Anomaly_Percentile', 'Primary_Driver'];
    const rows = enrollments.map((e) => [
      e.enrollment_id,
      e.student_id,
      e.course_code,
      e.section,
      e.review_priority,
      `"${e.cluster_label || ''}"`,
      e.anomaly_percentile || '',
      `"${e.primary_warning || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `ARM_Caseload_${term}_${checkpoint}_page${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Exported ${enrollments.length} student records for Term ${term} (${checkpoint})`, 'CSV Export Downloaded');
  };

  const columns: Column<EnrollmentListItem>[] = [
    {
      key: 'selection',
      header: (
        <input
          type="checkbox"
          checked={enrollments.length > 0 && enrollments.every((e) => selectedIds.has(e.enrollment_id))}
          onChange={toggleSelectAll}
          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#4f46e5' }}
          title="Select all on this page"
        />
      ),
      width: '44px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.enrollment_id)}
          onChange={() => toggleSelectRow(row.enrollment_id)}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#4f46e5' }}
        />
      ),
    },
    {
      key: 'priority',
      header: 'Review Priority',
      width: '140px',
      render: (row) => <PriorityBadge priority={row.review_priority} size="sm" />,
    },
    {
      key: 'student',
      header: 'Student ID',
      render: (row) => {
        const cleanId = String(row.student_id).replace('STU-', '');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StudentAvatar studentId={cleanId} size={34} />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px', fontFamily: 'var(--font-mono)' }}>
                Student #{cleanId}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>student.{cleanId}@campus.edu</span>
                <button
                  onClick={(e) => copyToClipboard(cleanId, e)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: '#94a3b8' }}
                  title="Copy student ID"
                >
                  {copiedId === cleanId ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'course',
      header: 'Course Offering',
      render: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
              {row.course_code}
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>(Sec {row.section})</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{row.course_name}</div>
        </div>
      ),
    },
    {
      key: 'profile',
      header: 'Discovered Profile',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
          {row.cluster_label || '—'}
        </span>
      ),
    },
    {
      key: 'anomaly',
      header: 'Anomaly Rank',
      width: '140px',
      render: (row) => {
        if (row.anomaly_percentile == null) return <span style={{ color: '#94a3b8' }}>—</span>;
        const anom = row.anomaly_percentile;
        const color = anom >= 90 ? '#e11d48' : anom >= 70 ? '#d97706' : '#059669';
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '12px', color }}>
                {anom}%
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>percentile</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(anom, 100)}%`, height: '100%', background: color, borderRadius: '3px' }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'warning',
      header: 'Primary Observed Driver',
      render: (row) => (
        <span
          style={{
            fontSize: '12px',
            color: row.review_priority === 'High' ? '#be123c' : '#475569',
            fontWeight: row.review_priority === 'High' ? 600 : 400,
          }}
        >
          {row.primary_warning}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate(`/students/${row.enrollment_id}?checkpoint=${checkpoint}`)}
          style={{ padding: '4px 10px', fontSize: '11.5px' }}
        >
          <span>Diagnose</span>
          <ArrowRight size={12} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.7px' }}>
            Student Caseload Explorer
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px' }}>
            Comprehensive institutional registry of {total.toLocaleString()} student enrollments evaluated at checkpoint {checkpoint}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export Filtered CSV</span>
          </button>
        </div>
      </div>

      <CohortFilters
        options={filterOpts}
        selectedTerm={term}
        selectedCheckpoint={checkpoint}
        selectedOffering={offering}
        onTermChange={setTerm}
        onCheckpointChange={setCheckpoint}
        onOfferingChange={setOffering}
      />

      {/* Priority Pill Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Students' },
          { id: 'High', label: 'High Priority' },
          { id: 'Monitor', label: 'Periodic Monitor' },
          { id: 'Routine', label: 'Routine On-Track' },
          { id: 'Insufficient data', label: 'Insufficient Data' },
        ].map((p) => {
          const isSelected = priorityFilter === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setPriorityFilter(p.id);
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: isSelected ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid #4f46e5' : '1px solid var(--border-card)',
                background: isSelected ? '#4f46e5' : '#ffffff',
                color: isSelected ? '#ffffff' : '#475569',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 1px 2px rgba(79, 70, 229, 0.2)' : 'var(--shadow-xs)',
                transition: 'all 0.12s ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="arm-card">
        <AsyncState isLoading={loading} error={error} onRetry={loadEnrollments}>
          <DataTable
            columns={columns}
            data={enrollments}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            searchValue={search}
            onSearchChange={(s) => {
              setSearch(s);
              setPage(1);
            }}
            searchPlaceholder="Search student ID (e.g. 6516) or course code..."
          />
        </AsyncState>
      </div>

      {/* Floating Batch Action Triage Dock */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-card)' }} />

          <button
            onClick={handleBulkAssign}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserCheck size={14} color="#4f46e5" />
            <span>Assign to Mentor</span>
          </button>

          <button
            onClick={handleBulkExport}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export Selected ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};
