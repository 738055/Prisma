import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      try {
        // --- CHAMADA À NOVA API PYTHON ---
        const response = await fetch(`http://localhost:8000/predictions/${cityId}?start_date=${startDate}&end_date=${endDate}`);
        if (!response.ok) throw new Error("Falha ao buscar predições.");
        
        const data: DemandPrediction[] = await response.json();
        const predictionsMap = new Map<string, DemandPrediction>();
        data.forEach(pred => {
          // A data já vem no formato YYYY-MM-DD
          predictionsMap.set(pred.prediction_date, pred);
        });
        setPredictions(predictionsMap);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (cityId) {
      loadPredictionsForMonth();
    }
  }, [cityId, currentMonth]);

  const getDemandColor = (level?: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
      case 'peak': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    }
  };
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = Array(firstDay.getDay()).fill(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  const formatMonthYear = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3"><CalendarIcon className="text-blue-600" size={24} /><h2 className="text-lg font-semibold text-slate-800">Calendário Preditivo de Demanda</h2></div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronLeft size={20} className="text-slate-600" /></button>
          <span className="text-sm font-medium text-slate-700 capitalize w-32 text-center">{formatMonthYear(currentMonth)}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronRight size={20} className="text-slate-600" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">{day}</div>)}
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const dateKey = day.toISOString().split('T')[0];
          const prediction = predictions.get(dateKey);
          const isPast = day < today;
          return (
            <button key={dateKey} onClick={() => !isPast && onDateClick(day)} disabled={isPast}
              className={`aspect-square border rounded-lg p-1 text-left transition ${getDemandColor(prediction?.demand_level)} ${isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="text-sm font-semibold">{day.getDate()}</div>
            </button>
          );
        })}
      </div>
      {loading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
    </div>
  );
}