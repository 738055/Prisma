// src/components/AnalysisTrigger.tsx
import { useState } from 'react';
import { Search } from 'lucide-react';

interface City { id: string; name: string; }
interface AnalysisTriggerProps { city: City | null; onAnalysisRequest: (date: string) => void; }

export default function AnalysisTrigger({ city, onAnalysisRequest }: AnalysisTriggerProps) {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const [targetDate, setTargetDate] = useState(today.toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (city) onAnalysisRequest(targetDate);
    };

    return (
        <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 md:p-6 animate-fade-in">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:flex-1">
                    <label htmlFor="targetDate" className="block text-sm font-medium text-slate-400 mb-2">Analisar a demanda para a data:</label>
                    <input id="targetDate" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <button type="submit" disabled={!city} className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 sm:mt-0 sm:self-end h-[50px]"><Search size={20} /><span>Analisar Demanda</span></button>
            </form>
        </div>
    );
}