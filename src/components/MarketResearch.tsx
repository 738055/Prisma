// src/components/MarketResearch.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface City { id: string; name: string; }

interface AnalysisResult {
  final_report: string;
}

// A interface de props foi atualizada para deixar claro que selectedCity pode ser nulo
interface MarketResearchProps {
  selectedCity: City | null; 
}

export const MarketResearch = ({ selectedCity }: MarketResearchProps) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: AnalysisResult } | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Validação robusta ANTES de criar o payload
    if (!user) {
        setError("Erro de autenticação: Utilizador não encontrado. Por favor, faça login novamente.");
        setLoading(false);
        return;
    }
    if (!selectedCity) {
        setError("Erro de dados: Nenhuma cidade selecionada. Por favor, selecione um destino.");
        setLoading(false);
        return;
    }

    const payload = { 
        cityId: selectedCity.id, 
        startDate, 
        endDate, 
        userId: user.id 
    };

    // PONTO CRÍTICO DE DEPURAÇÃO: Verifique o console do seu navegador para esta mensagem!
    console.log("A enviar para a Edge Function:", payload);

    // Validação final do payload para garantir que nenhum campo está vazio
    for (const [key, value] of Object.entries(payload)) {
        if (!value) {
            setError(`Erro de Validação: O parâmetro '${key}' está em falta e não pode ser enviado.`);
            setLoading(false);
            console.error("Payload inválido:", payload);
            return;
        }
    }

    try {
      // O corpo (body) da requisição precisa ser um objeto JSON stringificado
      const { data, error: funcError } = await supabase.functions.invoke('agent-run-on-demand', {
        body: JSON.stringify(payload)
      });
      
      if (funcError) throw new Error(funcError.message);

      // Tratamento de erro vindo da função
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      // Se não houver erro, mas os dados forem inesperados
      if (!data || !data.analysis) {
        throw new Error("A resposta da função foi inválida ou não contém uma análise.");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message || "Falha ao executar a análise. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
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

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertTriangle /> 
            {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
            <article className="prose prose-slate max-w-none">
                <ReactMarkdown>{result.analysis.final_report}</ReactMarkdown>
            </article>
        </div>
      )}
    </div>
  );
};