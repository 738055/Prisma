import { useEffect, useState } from 'react';
import { X, Calendar, Lightbulb, TrendingUp, Newspaper, AlertCircle } from 'lucide-react';

interface DayDetail {
  prediction_date: string;
  demand_level: string;
  reasoning_summary?: string;
  factors: {
    factor_type: string;
    description: string;
    impact_score?: number;
  }[];
}

interface DayDetailModalProps {
  date: Date;
  cityId: string;
  onClose: () => void;
}

export default function DayDetailModal({ date, cityId, onClose }: DayDetailModalProps) {
  const [details, setDetails] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      const dateString = date.toISOString().split('T')[0];
      try {
        // --- CHAMADA À NOVA API PYTHON ---
        const response = await fetch(`http://localhost:8000/day_details/${cityId}/${dateString}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Não foi possível obter os detalhes para esta data.");
        }
        const data: DayDetail = await response.json();
        setDetails(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [date, cityId]);

  const getDemandInfo = (level?: string) => {
    switch (level) {
      case 'low': return { label: 'Baixa Demanda', color: 'bg-green-500' };
      case 'moderate': return { label: 'Demanda Moderada', color: 'bg-yellow-500' };
      case 'high': return { label: 'Alta Demanda', color: 'bg-orange-500' };
      case 'peak': return { label: 'Pico de Demanda', color: 'bg-red-500' };
      default: return { label: 'Indefinido', color: 'bg-slate-500' };
    }
  };

  const demandInfo = getDemandInfo(details?.demand_level);
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-50/80 backdrop-blur-sm p-6 flex justify-between items-center border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{formatDate(date)}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${demandInfo.color}`}></div>
              <span className="font-semibold text-slate-700">{demandInfo.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} /></button>
        </div>
        
        {loading ? ( <div className="p-12 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div> ) 
        : error ? ( <div className="p-12 text-center text-red-700"><AlertCircle className="mx-auto mb-3" size={40} /><h3 className="font-semibold">Erro ao Carregar</h3><p className="text-sm">{error}</p></div> ) 
        : details && (
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-xl p-5 border">
              <div className="flex items-start gap-3"><Lightbulb size={20} className="text-blue-600 mt-0.5" /><p className="text-slate-700"><strong className="text-slate-900">Resumo da IA:</strong> {details.reasoning_summary || "Análise em processamento."}</p></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Fatores de Demanda Identificados</h3>
              <div className="space-y-3">
                {details.factors.length > 0 ? details.factors.map((factor, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border flex items-start gap-3">
                    {factor.factor_type === 'hotel_price' && <TrendingUp className="text-orange-500 mt-1" />}
                    {factor.factor_type === 'news' && <Newspaper className="text-sky-500 mt-1" />}
                    {factor.factor_type === 'event' && <Calendar className="text-purple-500 mt-1" />}
                    <p className="text-sm text-slate-600 flex-1">{factor.description}</p>
                  </div>
                )) : <p className="text-sm text-slate-500 text-center py-4">Nenhum fator específico encontrado para esta data.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}