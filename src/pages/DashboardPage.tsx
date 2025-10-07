import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import CitySelector from '../components/CitySelector';
import Calendar from '../components/Calendar';
import DayDetailModal from '../components/DayDetailModal';
import { StrategicDashboard } from '../components/StrategicDashboard'; // Importa o novo dashboard

interface City { id: string; name: string; state: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [periodInDays, setPeriodInDays] = useState<7 | 30>(7); // Estado para controlar o período

  useEffect(() => {
    const loadInitialData = async () => {
        if (!user) return;
        setLoading(true);
        const [citiesRes, profileRes] = await Promise.all([
            supabase.from('cities').select('id, name, state').order('name'),
            supabase.from('user_profiles').select('city_id').eq('id', user.id).single()
        ]);
        if (citiesRes.data) {
            setCities(citiesRes.data);
            const userCity = citiesRes.data.find(c => c.id === profileRes.data?.city_id);
            setSelectedCity(userCity || citiesRes.data[0] || null);
        }
        setLoading(false);
    };
    loadInitialData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {cities.length > 0 && selectedCity ? (
          <>
            <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />
            
            {/* --- NOVO PAINEL DE ANÁLISE ESTRATÉGICA --- */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-blue-600" size={24} />
                        <h2 className="text-lg font-semibold text-slate-800">Dashboard Estratégico</h2>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
                        <button onClick={() => setPeriodInDays(7)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${periodInDays === 7 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}>Próximos 7 dias</button>
                        <button onClick={() => setPeriodInDays(30)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${periodInDays === 30 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}>Próximos 30 dias</button>
                    </div>
                </div>
                <StrategicDashboard city={selectedCity} periodInDays={periodInDays} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Calendar cityId={selectedCity.id} onDateClick={setSelectedDate} />
            </div>
          </>
        ) : (
             <div className="text-center py-20 bg-white border rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Bem-vindo ao Prisma!</h2>
                <p className="text-slate-600 mb-6">Comece por configurar a sua cidade no perfil para obter a sua primeira análise.</p>
                <a href="/profile" className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                  Configurar Meu Perfil
                </a>
            </div>
        )}
      </main>

      {selectedDate && selectedCity && (
        <DayDetailModal 
            date={selectedDate} 
            cityId={selectedCity.id} 
            onClose={() => setSelectedDate(null)} 
        />
      )}
    </div>
  );
}