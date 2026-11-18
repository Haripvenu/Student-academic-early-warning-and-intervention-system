import React from 'react';
import { User } from 'lucide-react';

interface Props {
  name?: string;
  studentId?: string | number;
  size?: number;
  fontSize?: number;
  className?: string;
}

const PALETTES = [
  { bg: '#e0e7ff', text: '#3730a3' }, // Indigo
  { bg: '#dbeafe', text: '#1e40af' }, // Blue
  { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
  { bg: '#e0f2fe', text: '#0369a1' }, // Sky
  { bg: '#fef3c7', text: '#92400e' }, // Amber
  { bg: '#dcfce7', text: '#166534' }, // Emerald
  { bg: '#f3e8ff', text: '#6b21a8' }, // Purple
  { bg: '#ffe4e6', text: '#9f1239' }, // Rose
  { bg: '#ccfbf1', text: '#115e59' }, // Teal
];

export const StudentAvatar: React.FC<Props> = ({
  studentId,
  size = 34,
  className = '',
}) => {
  const cleanId = String(studentId || '').replace('STU-', '');

  // Deterministic color hash based on numeric student ID
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash << 5) - hash + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % PALETTES.length;
  const { bg, text } = PALETTES[colorIndex];

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        backgroundColor: bg,
        color: text,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        userSelect: 'none',
      }}
      title={`Student #${cleanId}`}
    >
      <User size={Math.round(size * 0.52)} />
    </div>
  );
};
