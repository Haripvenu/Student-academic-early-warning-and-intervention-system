import React, { useState, useEffect, useRef } from 'react';

interface Props {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}

export const AnimatedCounter: React.FC<Props> = ({
  value,
  duration = 600,
  formatter = (v) => v.toLocaleString(),
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = currentValRef.current;
    const targetValue = value;

    if (startValue === targetValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * easeProgress);
      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        currentValRef.current = targetValue;
        setDisplayValue(targetValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
};
