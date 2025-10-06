// src/components/ResultCard.tsx
import ReactMarkdown from 'react-markdown';
import { LucideIcon } from 'lucide-react';

interface ResultCardProps {
  icon: LucideIcon;
  title: string;
  content: string;
}

export default function ResultCard({ icon: Icon, title, content }: ResultCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <Icon size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <article className="prose prose-slate prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}