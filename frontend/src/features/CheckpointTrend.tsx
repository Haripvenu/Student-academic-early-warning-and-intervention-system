import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  historicalCheckpoints: any[];
}

export const CheckpointTrend: React.FC<Props> = ({ historicalCheckpoints }) => {
  const chartData = historicalCheckpoints.map((h) => ({
    checkpoint: h.checkpoint === 'W2' ? 'Week 2' : (h.checkpoint === 'W4' ? 'Week 4' : 'Week 6'),
    anomalyPercentile: h.anomaly_percentile || 0,
    priority: h.priority,
  }));

  return (
    <div className="arm-card">
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Checkpoint Trajectory (Week 2 → Week 4 → Week 6)
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Progression of student anomaly rank and priority across early assessment horizons.
      </p>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="checkpoint" fontSize={11} stroke="#94a3b8" />
            <YAxis domain={[0, 100]} fontSize={11} stroke="#94a3b8" unit="%" />
            <Tooltip
              contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              formatter={(val: any) => [`${val}% Anomaly Rank`, 'Model Signal']}
            />
            <Line
              type="monotone"
              dataKey="anomalyPercentile"
              stroke="#4f46e5"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#4f46e5' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
