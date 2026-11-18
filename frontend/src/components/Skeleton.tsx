import React from 'react';

interface Props {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<Props> = ({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="arm-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton width="40%" height="16px" />
      <Skeleton width="28px" height="28px" borderRadius="8px" />
    </div>
    <Skeleton width="60%" height="32px" />
    <Skeleton width="50%" height="14px" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="30%" height="18px" />
        <Skeleton width="20%" height="18px" />
        <Skeleton width="25%" height="18px" />
        <Skeleton width="15%" height="18px" />
      </div>
    ))}
  </div>
);
