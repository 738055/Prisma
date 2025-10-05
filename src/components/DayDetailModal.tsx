// src/components/DayDetailModal.tsx (VERSÃO CORRIGIDA)
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, Lightbulb, BedDouble, AlertCircle, TrendingUp, Search } from 'lucide-react';

interface PriceRecommendation {
  recommended_price: number;
  reasoning: string;
  room_types: { name: string } | null;
}
interface MarketSnapshotDay {
  date: string;
  hotel_competitors: { avg_price: number | null; competitors_found: number };
  local_events: any[];
  flight_demand: { avg_price_sao_paulo_origin: number | null };
}
interface DayDetailModalProps { date: Date; cityId: string; onClose: () => void; }

export default function DayDetailModal({ date, cityId, onClose }: DayDetailModalProps) {
  const [recommendations, setRecommendations] = useState<PriceRecommendation[]>([]);
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshotDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWeekStartDate = (d: Date) => {
    const dateCopy = new Date(d);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day;
    return new Date(dateCopy.setDate(diff));
  };

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      const dateString = date.toISOString().split('T')[0];
      const weekStartDate = getWeekStartDate(date).toISOString().split('T')[0];

      try {
        const [recsRes, marketRes] = await Promise.all([
          supabase.from('price_recommendations').select(`*, room_types ( name )`).eq('city_id', cityId).eq('recommendation_date', dateString),
          supabase.from('market_data').select('market_snapshot').eq('city_id', cityId).eq('week_start_date', weekStartDate).single()
        ]);

        if (recsRes.error) throw recsRes.error;
        setRecommendations(recsRes.data || []);
        
        // --- LÓGICA CORRIGIDA ---
        // Se marketRes.data for nulo ou tiver erro, não lançamos mais um erro fatal.
        // Apenas definimos o snapshot como nulo.
        if (marketRes.data?.market_snapshot) {
          const daySnapshot = marketRes.data.market_snapshot.find((d: any) => d.date === dateString);
          setMarketSnapshot(daySnapshot || null);
        } else {
          setMarketSnapshot(null);
        }

      } catch (e: any) {
        setError("Não foi possível obter os detalhes para esta data.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [date, cityId]);

  const formatDate = (d: Date) => d.toLocaleString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-slate-800 capitalize"><Calendar className="inline-block mr-2" />{formatDate(date)}</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            </div>
            {loading ? ( <div className="p-12 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div> ) 
            : error ? ( <div className="p-12 text-center"><AlertCircle className="text-red-500 mx-auto mb-4" size={48} /><h3 className="text-lg font-semibold">Ocorreu um Erro</h3><p className="text-slate-600">{error}</p></div> ) 
            : (
            <div className="p-6 space-y-8">
                {recommendations.length > 0 ? recommendations.map((rec, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4"><BedDouble className="text-blue-600" size={24} /><h3 className="text-xl font-semibold text-slate-800">{rec.room_types?.name}</h3></div>
                    <div className="text-4xl font-bold text-blue-600 mb-4">R$ {Number(rec.recommended_price).toFixed(2)}</div>
                    <div className="bg-white/80 rounded-lg p-4"><div className="flex items-start gap-3"><Lightbulb size={18} className="text-blue-600 mt-0.5" /><p className="text-sm text-slate-700 font-medium">{rec.reasoning}</p></div></div>
                </div>
                )) : <p className="text-center text-slate-600">Nenhuma recomendação de preço gerada para esta data.</p>}

                {/* --- LÓGICA DE EXIBIÇÃO APRIMORADA --- */}
                {marketSnapshot ? (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={20} /> "Fotografia" do Mercado</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <p><strong>Preço Médio Concorrência:</strong> {marketSnapshot.hotel_competitors.avg_price ? `R$ ${marketSnapshot.hotel_competitors.avg_price.toFixed(2)}` : 'N/A'}</p>
                            <p><strong>Preço Médio Voos (Origem SP):</strong> {marketSnapshot.flight_demand.avg_price_sao_paulo_origin ? `R$ ${marketSnapshot.flight_demand.avg_price_sao_paulo_origin.toFixed(2)}` : 'N/A'}</p>
                            <p className="col-span-2"><strong>Eventos:</strong> {marketSnapshot.local_events.length > 0 ? marketSnapshot.local_events.map(e => e.title).join(', ') : 'Nenhum evento de impacto encontrado'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-lg">
                        <Search size={32} className="text-slate-400 mx-auto mb-3" />
                        <h3 className="font-semibold text-slate-700">Análise de Mercado Não Disponível</h3>
                        <p className="text-sm text-slate-500">O dossiê para esta semana ainda não foi processado.</p>
                    </div>
                )}
            </div>
            )}
        </div>
    </div>
  );
}