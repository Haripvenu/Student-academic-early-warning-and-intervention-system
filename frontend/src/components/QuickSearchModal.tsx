import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, UserCheck, BookOpen, AlertCircle } from 'lucide-react';
import { queries } from '../api/queries';
import { PriorityBadge } from './PriorityBadge';
import { StudentAvatar } from './StudentAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const QuickSearchModal: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await queries.getEnrollments({
          term_code: '2014J',
          checkpoint: 'W4',
          search: searchTerm.trim(),
          page: 1,
          page_size: 8,
        });
        setResults(res.items);
      } catch (e) {
        console.error('Quick search error:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            gap: '12px',
            background: '#ffffff',
          }}
        >
          <Search size={18} color="#64748b" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student ID, full name, or course code..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontFamily: 'var(--font-sans)',
              color: '#0f172a',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
              Searching student caseload...
            </div>
          )}

          {!loading && searchTerm.trim() && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>No students found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                No active enrollment matched "{searchTerm}". Try searching by ID (e.g. 6516) or name.
              </div>
            </div>
          )}

          {!loading && !searchTerm.trim() && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
              Type a student name (e.g., <em>Frank Walker</em>), ID number, or course code (e.g., <em>AAA</em>) to jump to their dossier.
            </div>
          )}

          {!loading &&
            results.map((r) => {
              const cleanId = String(r.student_id).replace('STU-', '');
              return (
                <div
                  key={r.enrollment_id}
                  onClick={() => {
                    onNavigate(`/students/${r.enrollment_id}?checkpoint=W4`);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                    borderBottom: '1px solid #f8fafc',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StudentAvatar studentId={cleanId} size={36} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          Student #{cleanId}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.course_code}</span>
                        <span>• Sec {r.section}</span>
                        {r.cluster_label && <span>• {r.cluster_label}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PriorityBadge priority={r.review_priority} size="sm" />
                    <ArrowRight size={14} color="#94a3b8" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11.5px',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Use search to quickly review students across all 7 courses</span>
          <span>Term: <strong>2014J</strong></span>
        </div>
      </div>
    </div>
  );
};
