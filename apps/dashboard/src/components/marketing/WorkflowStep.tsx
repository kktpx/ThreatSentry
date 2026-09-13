import { ReactNode } from 'react';

interface WorkflowStepProps {
  number: string;
  title: string;
  description: string;
  visual: ReactNode;
}

export function WorkflowStep({ number, title, description, visual }: WorkflowStepProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)] mb-3">
        {number}
      </div>
      <h3 className="text-xl font-bold text-[var(--text)] mb-3">{title}</h3>
      <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
        {description}
      </p>
      
      <div className="mt-auto glass-card p-6 bg-[var(--surface-2)] flex items-center justify-center min-h-[160px]">
        {visual}
      </div>
    </div>
  );
}
