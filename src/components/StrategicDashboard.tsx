// src/components/StrategicDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Plane, Building2, Ticket, CheckCircle, Flame, Newspaper } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface City { id: string; name: string; }
interface StrategicDashboardProps { city: City | null; periodInDays: number; }

// Interface atualizada para receber a nova estrutura de dados
interface StrategicAnalysis {
    report_markdown: string;
    avg_competitor_realtime: number;
    avg_competitor_baseline: number;
    avg_flight_realtime: number;
    avg_flight_baseline: number;
    top_events: { title: string }[];
    social_buzz_signals: { content: string; source: string; impact_score: number }[];
    top_news: { title: string; source: string }[];
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
            analysisStartDate.setDate(today.getDate() + (periodInDays === 7 ? 1 : 7)); // Ajuste para começar amanhã ou na próxima semana
            const analysisEndDate = new Date(analysisStartDate);
            analysisEndDate.setDate(analysisStartDate.getDate() + 6);

            try {
                // Chamamos a mesma função de backend, que agora é muito mais poderosa
                const { data, error: funcError } = await supabase.functions.invoke('agent-run-on-demand', { 
                    body: JSON.stringify({ 
                        cityId: city.id, 
                        startDate: analysisStartDate.toISOString().split('T')[0], 
                        endDate: analysisEndDate.toISOString().split('T')[0], 
                        userId: user.id 
                    }) 
                });
                if (funcError) throw new Error(funcError.message);
                if (data && data.error) throw new Error(data.error);
                setAnalysis(data.structured_data);
            } catch (e: any) { setError(e.message); } finally { setLoading(false); }
        };
        runAnalysis();
    }, [city, periodInDays, user]);

    if (loading) { return <div className="text-center p-10"><Loader2 className="animate-spin text-blue-600 h-10 w-10 mx-auto" /><p className="mt-4 text-slate-600">Cruzando sinais de mercado para o período...</p></div>; }
    if (error) { return <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle />{error}</div>; }
    if (!analysis) { return <div className="p-6 text-center"><p>Não foi possível obter a análise de mercado para este período.</p></div> }

    const competitorChange = analysis.avg_competitor_realtime - analysis.avg_competitor_baseline;
    const competitorChangePercent = analysis.avg_competitor_baseline > 0 ? (competitorChange / analysis.avg_competitor_baseline) * 100 : 0;
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <InfoCard 
                    icon={<Building2 className="text-blue-600"/>} 
                    title="Preço Médio (Concorrência)" 
                    value={analysis.avg_competitor_realtime > 0 ? `R$ ${analysis.avg_competitor_realtime.toFixed(2)}` : 'N/D'} 
                    change={competitorChangePercent !== 0 ? `${competitorChangePercent.toFixed(1)}% vs. base mensal` : 'Estável'} 
                    changeType={competitorChange > 0 ? 'increase' : (competitorChange < 0 ? 'decrease' : 'neutral')}
                />
                <InfoCard 
                    icon={<Plane className="text-blue-600"/>} 
                    title="Preço Médio (Voos SP)" 
                    value={analysis.avg_flight_realtime > 0 ? `R$ ${analysis.avg_flight_realtime.toFixed(2)}` : 'N/D'} 
                    change={null}
                    changeType={'neutral'}
                />
            </div>
             <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-lg">
                 <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Flame className="text-orange-500" /> Sinais de Demanda e Buzz Social</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-slate-600 mb-2 flex items-center gap-1.5"><Ticket size={16}/>Eventos e Buzz</h4>
                        <ul className="space-y-2 text-sm">
                            {(analysis.social_buzz_signals && analysis.social_buzz_signals.length > 0) 
                                ? analysis.social_buzz_signals.map((signal, i) => (<li key={i} className="flex items-start gap-2"><CheckCircle className="text-green-500 h-4 w-4 mt-0.5 shrink-0" /><span className="text-slate-700">{signal.content}</span></li>)) 
                                : <li className="text-slate-500 italic">Nenhum sinal de alto impacto detectado.</li>
                            }
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-medium text-slate-600 mb-2 flex items-center gap-1.5"><Newspaper size={16}/>Notícias Relevantes</h4>
                        <ul className="space-y-2 text-sm">
                            {(analysis.top_news && analysis.top_news.length > 0) 
                                ? analysis.top_news.map((news, i) => (<li key={i} className="flex items-start gap-2"><CheckCircle className="text-green-500 h-4 w-4 mt-0.5 shrink-0" /><span className="text-slate-700">{news.title}</span></li>)) 
                                : <li className="text-slate-500 italic">Nenhuma notícia de impacto recente.</li>
                            }
                        </ul>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-lg">
                <h3 className="font-semibold text-slate-800 mb-3">Análise e Recomendação da IA</h3>
                <article className="prose prose-slate max-w-none prose-h3:font-semibold prose-h3:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900">
                    <ReactMarkdown>{analysis.report_markdown}</ReactMarkdown>
                </article>
            </div>
        </div>
    );
};