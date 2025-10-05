// src/components/PeriodSearch.tsx (NOVO COMPONENTE)
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, AlertTriangle, ChevronsDown, ChevronsUp, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface City { id: string; name: string; }

export const PeriodSearch = ({ city }: { city: City | null }) => {
  const { user } = useAuth();
  const today = new Date();
  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(today.getDate() + 6)).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: { final_report: string } } | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  const handleSearch = async () => {
    if (!user || !city) return;
    const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 7) {
        setError("O período de pesquisa não pode exceder 7 dias.");
        return;
    }
    setLoading(true); setError(null); setResult(null); setShowFullReport(false);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('agent-run-on-demand', { body: JSON.stringify({ cityId: city.id, startDate, endDate, userId: user.id }) });
      if (funcError) throw new Error(funcError.message);
      if (data && data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calendar /> Pesquisar Período Específico</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-slate-50 rounded-lg border">
        <div>
          <label className="text-sm font-medium text-slate-600">De</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Até</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
        </div>
        <button onClick={handleSearch} disabled={loading || !city} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="animate-spin" /> Analisando...</> : 'Analisar Período'}
        </button>
      </div>
      {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle />{error}</div>}
      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-slate-50 animate-fade-in">
            <article className="prose prose-slate max-w-none"><ReactMarkdown>{result.analysis.final_report}</ReactMarkdown></article>
        </div>
      )}
    </div>
  );
};