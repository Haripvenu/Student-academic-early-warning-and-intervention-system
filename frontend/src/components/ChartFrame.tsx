import React, { useState } from 'react';
import { Table, BarChart2 } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  unit?: string;
  height?: number;
  tableAlternativeData?: { label: string; values: Record<string, any> }[];
  children: React.ReactNode;
}

export const ChartFrame: React.FC<Props> = ({
  title,
  subtitle,
  unit,
  height = 260,
  tableAlternativeData,
  children,
}) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="arm-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {subtitle} {unit && `(Unit: ${unit})`}
            </p>
          )}
        </div>

        {tableAlternativeData && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowTable(!showTable)}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            title="Toggle accessible tabular view"
          >
            {showTable ? <BarChart2 size={13} /> : <Table size={13} />}
            <span>{showTable ? 'View Chart' : 'View Table'}</span>
          </button>
        )}
      </div>

      <div style={{ height, position: 'relative' }}>
        {showTable && tableAlternativeData ? (
          <div style={{ maxHeight: height, overflowY: 'auto' }}>
            <table className="arm-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  {Object.keys(tableAlternativeData[0]?.values || {}).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableAlternativeData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    {Object.values(row.values).map((v, i) => (
                      <td key={i}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
