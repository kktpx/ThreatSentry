import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  return (
    <div className="glass-card p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">{label}</span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1">
        {value}
      </div>
      {sublabel && (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {sublabel}
        </p>
      )}
    </div>
  );
}
