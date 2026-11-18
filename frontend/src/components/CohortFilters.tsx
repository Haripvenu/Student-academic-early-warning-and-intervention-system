import React from 'react';
import { Calendar, BookOpen, Clock } from 'lucide-react';
import { FilterOptions } from '../api/types';

interface Props {
  options: FilterOptions;
  selectedTerm: string;
  selectedCheckpoint: string;
  selectedOffering: string;
  onTermChange: (t: string) => void;
  onCheckpointChange: (c: string) => void;
  onOfferingChange: (o: string) => void;
}

export const CohortFilters: React.FC<Props> = ({
  options,
  selectedTerm,
  selectedCheckpoint,
  selectedOffering,
  onTermChange,
  onCheckpointChange,
  onOfferingChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: '#ffffff',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px',
      }}
    >
      {/* Term Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={15} color="var(--text-muted)" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Term:
        </span>
        <select
          value={selectedTerm}
          onChange={(e) => onTermChange(e.target.value)}
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            background: '#ffffff',
            fontWeight: 600,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          {options.terms.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: '1px', height: '22px', background: 'var(--border-card)' }} />

      {/* Checkpoint Week Pill Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={15} color="var(--text-muted)" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Checkpoint:
        </span>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-muted)', padding: '3px', borderRadius: '8px' }}>
          {(options.checkpoints || ['W2', 'W4', 'W6']).map((ck) => {
            const isSelected = selectedCheckpoint === ck;
            return (
              <button
                key={ck}
                onClick={() => onCheckpointChange(ck)}
                style={{
                  border: isSelected ? '1px solid #4f46e5' : '1px solid transparent',
                  background: isSelected ? '#4f46e5' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {ck === 'W2' ? 'Week 2' : ck === 'W4' ? 'Week 4' : 'Week 6'}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: '1px', height: '22px', background: 'var(--border-card)' }} />

      {/* Course Offering Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={15} color="var(--text-muted)" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Offering:
        </span>
        <select
          value={selectedOffering}
          onChange={(e) => onOfferingChange(e.target.value)}
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            background: '#ffffff',
            fontWeight: 600,
            color: 'var(--text-primary)',
            outline: 'none',
            maxWidth: '220px',
          }}
        >
          <option value="ALL">All Course Offerings</option>
          {options.offerings
            .filter((o) => o.term_code === selectedTerm)
            .map((o) => (
              <option key={o.offering_id} value={o.offering_id}>
                {o.course_code} (Sec {o.section})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
