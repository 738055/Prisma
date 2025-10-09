import { useEffect, useState } from 'react';
import { X, Calendar, Lightbulb, TrendingUp, Newspaper, AlertCircle, Plane, Info } from 'lucide-react';
import { mockDayDetails } from '../lib/mockData';

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

      setTimeout(() => {
        try {
          const dynamicMock = { ...mockDayDetails, prediction_date: date.toISOString().split('T')[0] };
          setDetails(dynamicMock);
        } catch (e: any) {
          setError("Erro ao carregar detalhes simulados.");
        } finally {
          setLoading(false);
        }
      }, 1000);
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

  const getFactorIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="text-purple-500 mt-1" />;
      case 'news': return <Newspaper className="text-sky-500 mt-1" />;
      case 'flights': return <Plane className="text-blue-500 mt-1" />;
      case 'hotel_price': return <TrendingUp className="text-orange-500 mt-1" />;
      default: return <Info className="text-slate-500 mt-1" />;
    }
  };

  const demandInfo = getDemandInfo(details?.demand_level);
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-12 text-center text-red-700 dark:text-red-400">
          <AlertCircle className="mx-auto mb-3" size={40} />
          <h3 className="font-semibold">Erro ao Carregar</h3>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    if (details) {
      return (
        <div className="p-6 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white">Resumo da IA:</strong> {details.reasoning_summary || "Análise em processamento."}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Fatores de Demanda Identificados</h3>
            <div className="space-y-3">
              {details.factors.length > 0 ? (
                details.factors.map((factor, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    {getFactorIcon(factor.factor_type)}
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">{factor.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum fator específico encontrado para esta data.</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-700">
        <div className="sticky top-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">{formatDate(date)}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${demandInfo.color}`}></div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{demandInfo.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X size={24} /></button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}