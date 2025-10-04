// src/components/DayDetailModal.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, DollarSign, Calendar, Lightbulb, BedDouble } from 'lucide-react';

interface DayDetailModalProps { date: Date; cityId: string; onClose: () => void; }
interface Recommendation { room_type_name: string; recommended_price: number; market_average: number; reasoning: string; }

export default function DayDetailModal({ date, cityId, onClose }: DayDetailModalProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDynamicDetails = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('dynamic-details', {
          body: { date: date.toISOString().split('T')[0], cityId, userId: user.id },
        });
        if (error) throw error;
        setRecommendations(data.recommendations);
      } catch (e: any) {
        setError("Não foi possível obter a análise em tempo real. Tente novamente.");
        console.error(e);
      }
      setLoading(false);
    };
    getDynamicDetails();
  }, [date, cityId, user]);

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800 capitalize">{formatDate(date)}</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={24} className="text-slate-600" /></button></div>
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Analisando dados em tempo real...</p></div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">{error}</div>
        ) : (
          <div className="p-6 space-y-6">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4"><BedDouble className="text-blue-600" size={24} /><h3 className="text-lg font-semibold text-slate-800">{rec.room_type_name}</h3></div>
                <div className="text-4xl font-bold text-blue-600 mb-2">R$ {rec.recommended_price.toFixed(2)}</div>
                <div className="text-sm text-slate-600 mb-4">Média do mercado: R$ {rec.market_average.toFixed(2)}</div>
                <div className="bg-white rounded-lg p-4"><div className="flex items-start gap-2"><Lightbulb size={18} className="text-blue-600 mt-0.5 flex-shrink-0" /><p className="text-sm text-slate-700">{rec.reasoning}</p></div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}