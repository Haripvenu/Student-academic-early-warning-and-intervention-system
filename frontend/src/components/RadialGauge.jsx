import React from 'react';

export default function RadialGauge({ percentage, level, size = 180 }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#059669'; // Low Risk
  let textColor = '#059669';

  if (percentage >= 60) {
    strokeColor = '#e11d48'; // High Risk
    textColor = '#e11d48';
  } else if (percentage >= 35) {
    strokeColor = '#d97706'; // Moderate Risk
    textColor = '#d97706';
  }

  return (
    <div className="radial-gauge-wrapper" style={{ width: size, height: size }}>
      <svg className="radial-gauge-svg" width={size} height={size} viewBox="0 0 180 180">
        {/* Background track */}
        <circle
          className="radial-gauge-bg"
          cx="90"
          cy="90"
          r={radius}
        />

        {/* Progress meter */}
        <circle
          className="radial-gauge-meter"
          cx="90"
          cy="90"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      <div className="radial-gauge-center">
        <div className="radial-gauge-pct" style={{ color: textColor }}>
          {percentage}%
        </div>
        <div className="radial-gauge-label">
          {level || 'Risk Score'}
        </div>
      </div>
    </div>
  );
}
