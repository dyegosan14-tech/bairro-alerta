import React from 'react';
import { SearchX } from 'lucide-react';

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <SearchX className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
    <h3 className="mt-3 text-sm font-bold text-slate-800">{title}</h3>
    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
