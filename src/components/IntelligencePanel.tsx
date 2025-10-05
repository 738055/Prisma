// src/components/IntelligencePanel.tsx (NOVO COMPONENTE)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Calendar, Loader2 } from 'lucide-react';

interface City { id: string; name: string; }
interface DemandPrediction { prediction_date: string; demand_level: string; }
interface Alert { title: string; message: string; alert_type: string }

// Cartão de KPI para exibir um único dado importante
function KpiCard({ title, value, change, changeType }: { title: string, value: string, change?: string, changeType?: 'increase' | 'decrease' }) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
            {change && (
                <div className={`mt-2 flex items-center text-xs font-semibold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    <span>{change}</span>
                </div>
            )}
        </div>
    );
}

// O painel principal
export default function IntelligencePanel({ city }: { city: City }) {
    const [loading, setLoading] = useState(true);
    const [demand, setDemand] = useState<DemandPrediction | null>(null);
    const [alert, setAlert] = useState<Alert | null>(null);
    const [competitorPriceChange, setCompetitorPriceChange] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Buscar a previsão de demanda para hoje
            const { data: demandData } = await supabase.from('demand_predictions').select('*').eq('city_id', city.id).eq('prediction_date', today).single();
            setDemand(demandData);

            // Buscar o alerta mais recente e importante
            const { data: alertData } = await supabase.from('alerts').select('*').eq('city_id', city.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
            setAlert(alertData);
            
            // Simulação de cálculo de variação de preço (idealmente viria de uma view ou RPC no Supabase)
            // Para este exemplo, vamos gerar um valor aleatório
            setCompetitorPriceChange(Math.floor(Math.random() * 20) - 5); // Variação de -5% a +15%

            setLoading(false);
        };
        fetchData();
    }, [city]);

    if (loading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Painel de Inteligência Preditiva</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card de Nível de Demanda */}
                <KpiCard 
                    title="Demanda Prevista (Próximos 7 dias)"
                    value={demand?.demand_level.toUpperCase() || 'MODERADA'}
                />
                
                {/* Card de Variação de Preço */}
                <KpiCard 
                    title="Variação de Preço (Concorrência)"
                    value={`${competitorPriceChange >= 0 ? '+' : ''}${competitorPriceChange}%`}
                    change="últimos 7 dias"
                    changeType={competitorPriceChange >= 0 ? 'increase' : 'decrease'}
                />

                {/* Card de Alerta Principal */}
                <div className="md:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600" />
                        <h3 className="text-sm font-medium text-blue-800">Alerta Estratégico</h3>
                    </div>
                    <p className="text-slate-800 font-semibold mt-3">{alert?.title || "Nenhum alerta crítico no momento."}</p>
                    <p className="text-sm text-slate-600 mt-1">{alert?.message || "O mercado parece estável. Continue a monitorizar."}</p>
                </div>
            </div>
        </div>
    );
}