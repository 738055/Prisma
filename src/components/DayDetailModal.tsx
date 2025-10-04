import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, TrendingUp, DollarSign, Calendar, Lightbulb } from 'lucide-react';

interface DayDetailModalProps {
  date: Date;
  cityId: string;
  onClose: () => void;
}

interface DemandPrediction {
  demand_level: 'low' | 'moderate' | 'high' | 'peak';
  confidence_score: number;
  factors: Array<{ type: string; description: string; impact: number }>;
}

interface PriceRecommendation {
  recommended_price: number;
  market_average: number;
  reasoning: string;
}

interface Event {
  title: string;
  event_type: string;
  impact_score: number;
}

export default function DayDetailModal({ date, cityId, onClose }: DayDetailModalProps) {
  const [prediction, setPrediction] = useState<DemandPrediction | null>(null);
  const [price, setPrice] = useState<PriceRecommendation | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [date, cityId]);

  const loadData = async () => {
    setLoading(true);
    const dateKey = date.toISOString().split('T')[0];

    const [predResult, priceResult, eventsResult] = await Promise.all([
      supabase
        .from('demand_predictions')
        .select('*')
        .eq('city_id', cityId)
        .eq('prediction_date', dateKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('price_recommendations')
        .select('*')
        .eq('city_id', cityId)
        .eq('recommendation_date', dateKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('events')
        .select('*')
        .eq('city_id', cityId)
        .eq('event_date', dateKey)
    ]);

    if (predResult.data) setPrediction(predResult.data);
    if (priceResult.data) setPrice(priceResult.data);
    if (eventsResult.data) setEvents(eventsResult.data);

    setLoading(false);
  };

  const getDemandLabel = (level: string) => {
    const labels = {
      low: 'Baixa',
      moderate: 'Moderada',
      high: 'Alta',
      peak: 'Pico'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getDemandColor = (level: string) => {
    const colors = {
      low: 'text-green-700 bg-green-100',
      moderate: 'text-yellow-700 bg-yellow-100',
      high: 'text-orange-700 bg-orange-100',
      peak: 'text-red-700 bg-red-100'
    };
    return colors[level as keyof typeof colors] || 'text-slate-700 bg-slate-100';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-800 capitalize">
                {formatDate(date)}
              </h2>
            </div>
            {prediction && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getDemandColor(prediction.demand_level)}`}>
                Demanda: {getDemandLabel(prediction.demand_level)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {price && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="text-blue-600" size={24} />
                  <h3 className="text-lg font-semibold text-slate-800">Tarifa Recomendada</h3>
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  R$ {price.recommended_price.toFixed(2)}
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  Média do mercado: R$ {price.market_average.toFixed(2)}
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{price.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {prediction && prediction.factors && prediction.factors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-slate-600" size={20} />
                  <h3 className="text-lg font-semibold text-slate-800">Fatores de Demanda</h3>
                </div>
                <div className="space-y-3">
                  {prediction.factors.map((factor, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800 capitalize">
                          {factor.type}
                        </span>
                        <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">
                          Impacto: {factor.impact}/10
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Eventos do Dia</h3>
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{event.title}</div>
                          <div className="text-sm text-slate-600 capitalize">{event.event_type}</div>
                        </div>
                        <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded">
                          {event.impact_score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!prediction && !price && events.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600">Ainda não há dados disponíveis para esta data.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
