import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  asChild?: boolean;
  to?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  asChild,
  to,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus:outline-none cursor-pointer';
  
  const variantClasses = {
    primary: 'bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--text-secondary)]',
    secondary: 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-hover)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-transparent',
    danger: 'bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  const content = (
    <>
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} style={props.style}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
