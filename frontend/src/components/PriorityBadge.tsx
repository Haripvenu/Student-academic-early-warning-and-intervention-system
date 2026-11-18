import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { PriorityLevel } from '../api/types';

interface Props {
  priority: PriorityLevel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<Props> = ({ priority, size = 'md', showIcon = true }) => {
  let cls = 'badge-priority badge-insufficient';
  let Icon = HelpCircle;

  if (priority === 'High') {
    cls = 'badge-priority badge-high';
    Icon = AlertCircle;
  } else if (priority === 'Monitor') {
    cls = 'badge-priority badge-monitor';
    Icon = AlertTriangle;
  } else if (priority === 'Routine') {
    cls = 'badge-priority badge-routine';
    Icon = CheckCircle;
  }

  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span className={cls} style={{ padding, fontSize }}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 13} />}
      <span>{priority}</span>
    </span>
  );
};
