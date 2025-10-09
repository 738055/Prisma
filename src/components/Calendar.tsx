import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { mockCalendarPredictions } from '../lib/mockData';

interface DemandPrediction {
  prediction_date: string;
  demand_level: 'low' | 'moderate' | 'high' | 'peak';
}

interface CalendarProps {
  cityId: string;
  onDateClick: (date: Date) => void;
}

export default function Calendar({ cityId, onDateClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [predictions, setPredictions] = useState<Map<string, DemandPrediction>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPredictionsForMonth = async () => {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      setTimeout(() => {
        try {
          const data = mockCalendarPredictions(startDate, endDate);
          const predictionsMap = new Map<string, DemandPrediction>();
          data.forEach(pred => predictionsMap.set(pred.prediction_date, pred as DemandPrediction));
          setPredictions(predictionsMap);
        } catch (error) { console.error("Erro:", error); } 
        finally { setLoading(false); }
      }, 800);
    };
    if (cityId) loadPredictionsForMonth();
  }, [cityId, currentMonth]);

  const getDemandColor = (level?: string) => {
    switch (level) {
      // Cores para o tema claro
      case 'low': return 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900';
      case 'moderate': return 'bg-amber-200 text-amber-900 hover:bg-amber-300 dark:bg-amber-800/60 dark:text-amber-200 dark:hover:bg-amber-800/90';
      case 'high': return 'bg-amber-300 text-amber-900 hover:bg-amber-400 dark:bg-amber-700/70 dark:text-amber-100 dark:hover:bg-amber-700/90';
      case 'peak': return 'bg-amber-400 text-amber-900 font-bold hover:bg-amber-500 dark:bg-amber-600/80 dark:text-white dark:hover:bg-amber-600';
      // Cor padrão para dias sem dados
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700';
    }
  };
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = Array(firstDay.getDay()).fill(null);
    for (let day = 1; day <= lastDay.getDate(); day++) { days.push(new Date(year, month, day)); }
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  const formatMonthYear = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 relative border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-slate-500 dark:text-slate-400" size={20} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Calendário Preditivo de Demanda</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><ChevronLeft size={20} className="text-slate-500 dark:text-slate-400" /></button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize w-32 text-center">{formatMonthYear(currentMonth)}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><ChevronRight size={20} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map(day => <div key={day} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-500 py-2">{day}</div>)}
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const dateKey = day.toISOString().split('T')[0];
          const prediction = predictions.get(dateKey);
          const isPast = day < today;
          return (
            <button key={dateKey} onClick={() => !isPast && onDateClick(day)} disabled={isPast}
              className={`aspect-square rounded-lg p-2 text-left transition ${getDemandColor(prediction?.demand_level)} ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="text-sm">{day.getDate()}</div>
            </button>
          );
        })}
      </div>
      {loading && <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div></div>}
    </div>
  );
}