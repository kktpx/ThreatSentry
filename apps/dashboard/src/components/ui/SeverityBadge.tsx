import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  let colorClass = '';
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      colorClass = 'bg-rose-950/60 text-rose-400 border border-rose-800';
      break;
    case 'HIGH':
      colorClass = 'bg-amber-950/60 text-amber-400 border border-amber-800';
      break;
    case 'MEDIUM':
      colorClass = 'bg-amber-900/30 text-amber-300 border border-amber-800/50';
      break;
    case 'LOW':
      colorClass = 'bg-blue-950/60 text-blue-400 border border-blue-800';
      break;
    default:
      colorClass = 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]';
  }

  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${colorClass} ${className}`}>
      {severity}
    </span>
  );
}
