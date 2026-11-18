import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  icon?: LucideIcon;
  badgeText?: string;
  badgeType?: 'danger' | 'warning' | 'success' | 'neutral' | 'primary';
  trend?: { value: string; isPositive: boolean };
  onClick?: () => void;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  unit,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  trend,
  onClick,
}) => {
  const badgeColors = {
    danger: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', accent: '#e11d48' },
    warning: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', accent: '#d97706' },
    success: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', accent: '#059669' },
    neutral: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', accent: '#64748b' },
    primary: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe', accent: '#4f46e5' },
  };

  const b = badgeColors[badgeType] || badgeColors.neutral;

  return (
    <div
      className="arm-card-elevated"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      {/* Top accent hairline */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: b.accent,
          opacity: 0.85,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', letterSpacing: '-0.1px' }}>{title}</span>
        {Icon && (
          <div
            style={{
              padding: '7px',
              background: b.bg,
              borderRadius: '8px',
              color: b.text,
              border: `1px solid ${b.border}`,
            }}
          >
            <Icon size={17} />
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.7px', lineHeight: 1.1 }}>
            {(() => {
              if (typeof value === 'number') {
                return <AnimatedCounter value={value} />;
              }
              const cleaned = String(value).replace(/,/g, '');
              const num = Number(cleaned);
              if (!isNaN(num) && cleaned.trim() !== '') {
                return <AnimatedCounter value={num} />;
              }
              return value;
            })()}
          </span>
          {unit && <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>}
        </div>

        {(subtitle || badgeText || trend) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            {badgeText && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: b.bg,
                  color: b.text,
                  border: `1px solid ${b.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {badgeType === 'danger' && <span className="danger-indicator-dot" style={{ width: '6px', height: '6px' }} />}
                {badgeText}
              </span>
            )}
            {trend && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: trend.isPositive ? '#059669' : '#e11d48',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {trend.value}
              </span>
            )}
            {subtitle && <span style={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
