import React from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  centered?: boolean;
}

export function SectionHeader({ eyebrow, title, description, id, centered = false }: SectionHeaderProps) {
  return (
    <div id={id} className={`mb-12 ${centered ? 'text-center' : ''}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
        {title}
      </h2>
      {description && (
        <p className={`text-[var(--text-secondary)] text-lg max-w-2xl ${centered ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
}
