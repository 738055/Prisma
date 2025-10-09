import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, TrendingUp, Plane, Building2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { mockStrategicAnalysis } from '../lib/mockData';

interface City { id: string; name: string; }
interface StrategicDashboardProps { city: City | null; periodInDays: number; }

interface StrategicAnalysis {
    report_markdown: string;
    avg_competitor_realtime: number;
    avg_competitor_baseline: number;
    avg_flight_realtime: number;
}

function KpiCard({ icon, title, value, change, changeType }: { icon: React.ReactNode, title: string, value: string, change: string, changeType: 'increase' | 'decrease' | 'neutral' }) {
    const changeColor = changeType === 'increase' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex items-center gap-6 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-500">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
                {changeType !== 'neutral' && (
                    <div className={`mt-1 flex items-center text-sm font-semibold ${changeColor}`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>{change}</span>
                    </div>
                )}
            </div>
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
            
            setTimeout(() => {
                try {
                    const data = mockStrategicAnalysis;
                    setAnalysis({
                        ...data.structured_data,
                        report_markdown: data.analysis.final_report
                    });
                } catch (e: any) { setError("Erro ao carregar dados simulados."); } 
                finally { setLoading(false); }
            }, 1500);
        };
        runAnalysis();
    }, [city, periodInDays, user]);

    if (loading) return <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"><Loader2 className="animate-spin text-blue-600 dark:text-blue-500 h-10 w-10 mx-auto" /><p className="mt-4 text-slate-500 dark:text-slate-400">Analisando o mercado...</p></div>;
    if (error) return <div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-500/20"><AlertTriangle />{error}</div>;
    if (!analysis) return <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl text-center border border-slate-200 dark:border-slate-700"><p>Não foi possível obter a análise.</p></div>

    const competitorChange = analysis.avg_competitor_realtime - analysis.avg_competitor_baseline;
    const competitorChangePercent = analysis.avg_competitor_baseline > 0 ? (competitorChange / analysis.avg_competitor_baseline) * 100 : 0;
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard 
                    icon={<Building2 size={32}/>} 
                    title="Preço Médio (Concorrência)" 
                    value={`R$ ${analysis.avg_competitor_realtime.toFixed(2)}`}
                    change={`${competitorChangePercent.toFixed(1)}% vs. base mensal`}
                    changeType={competitorChange > 0 ? 'increase' : 'decrease'}
                />
                <KpiCard 
                    icon={<Plane size={32}/>} 
                    title="Preço Médio (Voos SP)" 
                    value={`R$ ${analysis.avg_flight_realtime.toFixed(2)}`}
                    change="dados em tempo real"
                    changeType={'neutral'}
                />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg">Análise e Recomendação da IA</h3>
                <article className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-strong:text-slate-900 dark:prose-strong:text-white">
                    <ReactMarkdown>{analysis.report_markdown}</ReactMarkdown>
                </article>
            </div>
        </div>
    );
};