import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DemandPrediction {
  prediction_date: string;
  demand_level: 'low' | 'moderate' | 'high' | 'peak';
  confidence_score: number;
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
    loadPredictions();
  }, [cityId]);

  const loadPredictions = async () => {
    setLoading(true);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90);

    const { data, error } = await supabase
      .from('demand_predictions')
      .select('*')
      .eq('city_id', cityId)
      .gte('prediction_date', today.toISOString().split('T')[0])
      .lte('prediction_date', endDate.toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (!error && data) {
      const predictionsMap = new Map<string, DemandPrediction>();
      data.forEach((pred) => {
        const dateKey = pred.prediction_date;
        if (!predictionsMap.has(dateKey)) {
          predictionsMap.set(dateKey, pred);
        }
      });
      setPredictions(predictionsMap);
    }
    setLoading(false);
  };

  const getDemandColor = (level: string | undefined) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'peak':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getDemandLabel = (level: string | undefined) => {
    switch (level) {
      case 'low':
        return 'Baixa';
      case 'moderate':
        return 'Moderada';
      case 'high':
        return 'Alta';
      case 'peak':
        return 'Pico';
      default:
        return '-';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold text-slate-800">Calendário Preditivo</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div className="px-4 py-2 bg-slate-50 rounded-lg min-w-[200px] text-center">
            <span className="text-sm font-medium text-slate-700 capitalize">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
          <span className="text-slate-600">Baixa</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
          <span className="text-slate-600">Moderada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div>
          <span className="text-slate-600">Alta</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
          <span className="text-slate-600">Pico</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = day.toISOString().split('T')[0];
          const prediction = predictions.get(dateKey);
          const isPast = day < today;
          const isToday = day.getTime() === today.getTime();

          return (
            <button
              key={dateKey}
              onClick={() => !isPast && onDateClick(day)}
              disabled={isPast}
              className={`aspect-square border-2 rounded-lg p-2 transition ${
                isPast
                  ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50'
                  : getDemandColor(prediction?.demand_level)
              } ${
                isToday ? 'ring-2 ring-blue-400' : ''
              } ${
                !isPast ? 'hover:scale-105 cursor-pointer' : ''
              }`}
            >
              <div className="text-sm font-semibold">{day.getDate()}</div>
              {prediction && !isPast && (
                <div className="text-xs mt-1 truncate">
                  {getDemandLabel(prediction.demand_level)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
