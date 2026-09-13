import React from 'react';

interface SecurityScoreProps {
  score: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SecurityScore({ score, className = '', size = 'md' }: SecurityScoreProps) {
  if (score === null || score === undefined) {
    return <span className={`font-mono text-[var(--text-muted)] ${className}`}>—</span>;
  }

  let colorClass = '';
  if (score >= 80) colorClass = 'text-[var(--success)]';
  else if (score >= 50) colorClass = 'text-[var(--warning)]';
  else colorClass = 'text-[var(--danger)]';

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const suffixClasses = {
    sm: 'text-xs ml-0.5',
    md: 'text-sm ml-1',
    lg: 'text-base ml-1.5'
  };

  return (
    <div className={`font-mono font-bold ${colorClass} ${sizeClasses[size]} ${className} leading-none`}>
      {score}
      <span className={`font-sans font-normal text-[var(--text-muted)] ${suffixClasses[size]}`}>
        / 100
      </span>
    </div>
  );
}
