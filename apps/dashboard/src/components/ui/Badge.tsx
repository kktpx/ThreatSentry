import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  let colorClass = '';
  switch (variant) {
    case 'success':
      colorClass = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800';
      break;
    case 'warning':
      colorClass = 'bg-amber-950/60 text-amber-400 border border-amber-800';
      break;
    case 'danger':
      colorClass = 'bg-rose-950/60 text-rose-400 border border-rose-800';
      break;
    case 'info':
      colorClass = 'bg-blue-950/60 text-blue-400 border border-blue-800';
      break;
    default:
      colorClass = 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]';
  }

  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider inline-flex items-center gap-1.5 ${colorClass} ${className}`}>
      {children}
    </span>
  );
}
