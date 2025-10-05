// src/components/StrategicDashboard.tsx (VERSÃO FINAL ROBUSTA E COMPLETA)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Plane, Building2, Ticket, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface City { id: string; name: string; }
interface StrategicDashboardProps { city: City | null; periodInDays: number; }

interface StrategicAnalysis {
    report_markdown: string;
    avg_competitor_realtime: number;
    avg_competitor_baseline: number;
    avg_flight_realtime: number;
    avg_flight_baseline: number;
    top_events: { title: string; date?: { start_date: string } }[];
}

function InfoCard({ icon, title, value, change, changeType }: { icon: React.ReactNode, title: string, value: string, change: string | null, changeType: 'increase' | 'decrease' | 'neutral' }) {
    const changeColor = changeType === 'increase' ? 'text-red-500' : 'text-green-500';
    const ChangeIcon = changeType === 'increase' ? TrendingUp : TrendingDown;
    return (
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:scale-105">
            <div>
                <div className="flex items-center gap-3"><div className="bg-slate-100 p-2 rounded-lg">{icon}</div><h3 className="font-semibold text-slate-700">{title}</h3></div>
                <p className="text-4xl font-bold text-slate-800 mt-4">{value}</p>
            </div>
            {change && changeType !== 'neutral' && <div className={`mt-3 flex items-center text-sm font-semibold ${changeColor}`}><ChangeIcon className="h-5 w-5 mr-1" /><span>{change}</span></div>}
        </div>
    );
}

export const StrategicDashboard = ({ city, periodInDays }: StrategicDashboardProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<StrategicAnalysis | null>(null);

    useEffect(() => {
        const runAnalysis = async () => {
            if (!user || !city) return;
            setLoading(true); setError(null); setAnalysis(null);
            
            const today = new Date();
            const analysisStartDate = new Date(today);
            analysisStartDate.setDate(today.getDate() + periodInDays);
            const analysisEndDate = new Date(analysisStartDate);
            analysisEndDate.setDate(analysisStartDate.getDate() + 6);
            const startDateForAPI = analysisStartDate.toISOString().split('T')[0];
            const endDateForAPI = analysisEndDate.toISOString().split('T')[0];

            try {
                const { data, error: funcError } = await supabase.functions.invoke('agent-run-on-demand', { body: JSON.stringify({ cityId: city.id, startDate: startDateForAPI, endDate: endDateForAPI, userId: user.id }) });
                if (funcError) throw new Error(funcError.message);
                if (data && data.error) throw new Error(data.error);
                setAnalysis(data.structured_data);
            } catch (e: any) { setError(e.message); } finally { setLoading(false); }
        };
        runAnalysis();
    }, [city, periodInDays, user]);

    if (loading) { return <div className="text-center p-10"><Loader2 className="animate-spin text-blue-600 h-10 w-10 mx-auto" /><p className="mt-4 text-slate-600">Cruzando sinais de mercado para o período...</p></div>; }
    if (error) { return <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle />{error}</div>; }
    if (!analysis) { return <div className="p-6 text-center"><p>Não foi possível obter a análise de mercado.</p></div> }

    const competitorChange = analysis.avg_competitor_realtime - analysis.avg_competitor_baseline;
    const competitorChangePercent = analysis.avg_competitor_baseline > 0 ? (competitorChange / analysis.avg_competitor_baseline) * 100 : 0;
    const flightChange = analysis.avg_flight_realtime - analysis.avg_flight_baseline;
    const flightChangePercent = analysis.avg_flight_baseline > 0 ? (flightChange / analysis.avg_flight_baseline) * 100 : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard 
                    icon={<Building2 className="text-blue-600"/>} 
                    title="Concorrência" 
                    value={analysis.avg_competitor_realtime > 0 ? `R$ ${analysis.avg_competitor_realtime.toFixed(2)}` : '--'} 
                    change={competitorChangePercent !== 0 ? `${competitorChangePercent.toFixed(1)}% vs. semana passada` : 'Estável'} 
                    changeType={competitorChange > 0 ? 'increase' : (competitorChange < 0 ? 'decrease' : 'neutral')}
                />
                <InfoCard 
                    icon={<Plane className="text-blue-600"/>} 
                    title="Voos" 
                    value={analysis.avg_flight_realtime > 0 ? `R$ ${analysis.avg_flight_realtime.toFixed(2)}` : '--'} 
                    change={flightChangePercent !== 0 ? `${flightChangePercent.toFixed(1)}% vs. semana passada` : 'Estável'}
                    changeType={flightChange > 0 ? 'increase' : (flightChange < 0 ? 'decrease' : 'neutral')}
                />
                <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-1 lg:col-span-2 transition-all hover:shadow-lg">
                     <div className="flex items-center gap-3"><Ticket className="text-blue-600"/><h3 className="font-semibold text-slate-700">Principais Eventos no Radar</h3></div>
                    <ul className="mt-3 space-y-2 text-sm">{(analysis.top_events && analysis.top_events.length > 0) ? analysis.top_events.map(event => (<li key={event.title} className="font-medium text-slate-600 truncate">{event.title}</li>)) : <li className="text-slate-500">Nenhum evento de alto impacto detetado.</li>}</ul>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-lg">
                <h3 className="font-semibold text-slate-700 mb-3">Fontes Analisadas para esta Predição</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-green-700">
                    <span className="flex items-center gap-1"><CheckCircle size={16}/> Preços da Concorrência</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16}/> Preços de Voos (Origem SP)</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16}/> Calendário de Eventos</span>
                    <span className="flex items-center gap-1"><CheckCircle size={16}/> Notícias Locais de Turismo</span>
                </div>
            </div>
            <div className="prose prose-slate max-w-none"><ReactMarkdown>{analysis.report_markdown}</ReactMarkdown></div>
        </div>
    );
};