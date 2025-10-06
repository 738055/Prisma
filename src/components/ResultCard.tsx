// src/components/ResultCard.tsx
import ReactMarkdown from 'react-markdown';
import { LucideIcon } from 'lucide-react';

interface ResultCardProps { icon: LucideIcon; title: string; content: string; }

export default function ResultCard({ icon: Icon, title, content }: ResultCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-blue-500/10">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-slate-700 text-blue-400 p-2 rounded-lg"><Icon size={24}/></div>
          <h3 className="text-lg font-bold text-slate-200">{title}</h3>
        </div>
        <article className="prose prose-sm prose-invert max-w-none prose-p:text-slate-400 prose-strong:text-slate-200">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}