import { LucideIcon } from 'lucide-react';

interface CoverageCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  features: string[];
}

export function CoverageCard({ title, description, icon: Icon, features }: CoverageCardProps) {
  return (
    <div className="glass-card p-6 md:p-8 flex flex-col h-full bg-[var(--surface-2)]">
      <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-[var(--text)]" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">{description}</p>}
      
      <ul className={`space-y-2.5 text-sm font-medium text-[var(--text-muted)] ${!description ? 'mt-4 flex-1' : ''}`}>
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-hover)] mt-1.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
