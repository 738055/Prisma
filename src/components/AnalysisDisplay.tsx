// src/components/AnalysisDisplay.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, TrendingUp, BarChart2, Lightbulb, DatabaseZap } from 'lucide-react';
import ResultCard from './ResultCard';

interface City { id: string; name: string; }
interface AnalysisDisplayProps {
  city: City;
  targetDate: string;
}
interface AnalysisSection { title: string; content: string; icon: React.ElementType; }

const loadingMessages = [
  "A consultar a nossa base de dados histórica...",
  "A buscar preços em tempo real na Booking.com...",
  "A analisar Sinais de Demanda e Buzz Social...",
  "A cruzar milhões de pontos de dados...",
  "A gerar insights com a Inteligência Artificial...",
];

// --- NOVO COMPONENTE INTERNO PARA A MENSAGEM DE 'SEM DADOS' ---
function NoDataState({ onDateChange }: { onDateChange: (days: number) => void }) {
    return (
        <div className="text-center p-8 md:p-12 bg-white rounded-2xl shadow-sm animate-fade-in border border-amber-200">
            <DatabaseZap className="text-amber-500 h-12 w-12 mx-auto" />
            <h3 className="mt-4 text-xl font-bold text-slate-800">Dados Futuros Ainda em Recolha</h3>
            <p className="mt-2 text-slate-600 max-w-lg mx-auto">
                Ainda não temos informações de preços para a data selecionada. Os nossos coletores automáticos reúnem dados para até 90 dias no futuro.
            </p>
            <p className="mt-2 text-slate-600 max-w-lg mx-auto font-medium">
                Por favor, tente uma data mais próxima ou use as nossas sugestões.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={() => onDateChange(15)} className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition">
                    Analisar próximos 15 Dias
                </button>
                 <button onClick={() => onDateChange(30)} className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition">
                    Analisar próximos 30 Dias
                </button>
            </div>
        </div>
    );
}


export default function AnalysisDisplay({ city, targetDate }: AnalysisDisplayProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isNoDataError, setIsNoDataError] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisSection[]>([]);

  const parseAnalysisReport = (report: string): AnalysisSection[] => {
    const sections = report.split(/\n(?=#{1,3} )/);
    return sections.map(section => {
      const titleMatch = section.match(/#{1,3} (.*)/);
      const title = titleMatch ? titleMatch[1].trim() : "Análise";
      const content = section.replace(/#{1,3} .*\n/, '').trim();
      let icon = Lightbulb;
      if (title.toLowerCase().includes('preço')) icon = TrendingUp;
      if (title.toLowerCase().includes('correlação') || title.toLowerCase().includes('sinais')) icon = BarChart2;
      return { title, content, icon };
    }).filter(s => s.content.length > 10);
  };

  useEffect(() => {
    const runAnalysis = async () => {
      if (!user || !city) return;
      setLoading(true); setError(null); setIsNoDataError(false); setAnalysisResult([]); setCurrentMessageIndex(0);

      try {
        const { data, error: funcError } = await supabase.functions.invoke('engine-market-analyzer', { 
          body: JSON.stringify({ cityId: city.id, targetDate: targetDate, userId: user.id }) 
        });

        const errorMessage = data?.error || funcError?.message;
        if (errorMessage) {
            // --- LÓGICA DE DETECÇÃO DE ERRO APRIMORADA ---
            if (errorMessage.includes("Não há dados de preços históricos")) {
                setIsNoDataError(true);
            } else {
                throw new Error(errorMessage);
            }
        } else if (!data?.analysis?.final_report) {
            throw new Error("A análise da IA retornou um formato inesperado.");
        } else {
            const parsedSections = parseAnalysisReport(data.analysis.final_report);
            setAnalysisResult(parsedSections);
        }

      } catch (e: any) { 
        setError(e.message); 
      } finally { 
        setLoading(false); 
      }
    };
    runAnalysis();
  }, [city, targetDate, user]);

  useEffect(() => {
    if (loading) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(intervalId);
    }
  }, [loading]);

  const handleQuickDateChange = (days: number) => {
      const newDate = new Date();
      newDate.setDate(new Date().getDate() + days);
      // Aqui, precisaríamos de uma forma de comunicar a nova data para o componente pai (DashboardPage)
      // Por enquanto, vamos apenas recarregar a página com a nova data (solução simples)
      const dateStr = newDate.toISOString().split('T')[0];
      // Idealmente, o DashboardPage passaria uma função para atualizar a data
      alert(`Por favor, selecione uma data próxima a ${dateStr} e clique em "Analisar Demanda" novamente.`);
  }

  if (loading) {
    return (
      <div className="text-center p-8 md:p-12 bg-white rounded-2xl shadow-sm animate-fade-in">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10 mx-auto" />
        <p className="mt-4 text-slate-700 font-semibold text-lg transition-all duration-500">{loadingMessages[currentMessageIndex]}</p>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%` }}></div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO CONDICIONAL ---
  if (isNoDataError) {
      return <NoDataState onDateChange={handleQuickDateChange} />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl shadow-sm flex items-center gap-3 animate-fade-in border border-red-200">
        <AlertTriangle className="h-8 w-8 shrink-0" /> 
        <div>
          <h3 className="font-semibold">Ocorreu um erro na análise</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 text-center">
        Dossiê de Inteligência para <span className="text-blue-600">{new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'})}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisResult.map((section, index) => (
          <ResultCard key={index} icon={section.icon} title={section.title} content={section.content} />
        ))}
      </div>
    </div>
  );
}