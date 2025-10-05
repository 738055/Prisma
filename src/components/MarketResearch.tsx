// src/components/MarketResearch.tsx (VERSÃO FINAL E COMPLETA)
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, AlertTriangle, ChevronsDown, ChevronsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface City { id: string; name: string; }
interface MarketResearchProps { selectedCity: City | null; }

export const MarketResearch = ({ selectedCity }: MarketResearchProps) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: { final_report: string } } | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  const handleSearch = async () => {
    if (!user || !selectedCity) return;
    setLoading(true); 
    setError(null); 
    setResult(null); 
    setShowFullReport(false);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('agent-run-on-demand', {
        body: JSON.stringify({ cityId: selectedCity.id, startDate, endDate, userId: user.id })
      });
      if (funcError) throw new Error(funcError.message);
      if (data && data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para extrair a seção mais acionável do relatório (o alerta ou o resumo)
  const getReportSummary = (fullReport: string) => {
    const sections = fullReport.split(/## |### /); // Divide por cabeçalhos Markdown (## ou ###)
    
    // Procura pelas seções mais importantes, em ordem de prioridade
    const priorityKeywords = ['alerta e recomendações', 'ação imediata', 'oportunidade crítica', 'análise cruzada', 'resumo executivo'];
    
    for (const keyword of priorityKeywords) {
      const alertSection = sections.find(s => s.trim().toLowerCase().startsWith(keyword));
      if (alertSection) {
        return `## ${alertSection.trim()}`;
      }
    }
    
    // Se não encontrar nenhuma seção prioritária, retorna a primeira seção significativa ou um trecho
    return sections[1] ? `## ${sections[1].trim()}` : fullReport.substring(0, 500) + '...';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Search /> Pesquisador de Mercado Sob Demanda
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-slate-50 rounded-lg border">
        <div>
          <label className="text-sm font-medium text-slate-600">Data de Início</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Data de Fim</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md"/>
        </div>
        <button onClick={handleSearch} disabled={loading || !selectedCity} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="animate-spin" /> Analisando...</> : 'Analisar Período'}
        </button>
      </div>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle />{error}</div>}
      
      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
            <article className="prose prose-slate max-w-none">
                <ReactMarkdown>{showFullReport ? result.analysis.final_report : getReportSummary(result.analysis.final_report)}</ReactMarkdown>
            </article>
            <button onClick={() => setShowFullReport(!showFullReport)} className="mt-4 text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                {showFullReport ? 'Ocultar Análise Completa' : 'Ver Análise Completa da IA'}
                {showFullReport ? <ChevronsUp className="h-4 w-4"/> : <ChevronsDown className="h-4 w-4"/>}
            </button>
        </div>
      )}
    </div>
  );
};