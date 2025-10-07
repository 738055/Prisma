// src/pages/DashboardPage.tsx (VERSÃO ATUALIZADA)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, TrendingUp } from 'lucide-react';
import CitySelector from '../components/CitySelector';
import Calendar from '../components/Calendar';
import DayDetailModal from '../components/DayDetailModal';
import { StrategicDashboard } from '../components/StrategicDashboard';
import PrismaChat from '../components/PrismaChat'; // Importando o PrismaChat

interface City { id: string; name: string; state: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [periodInDays, setPeriodInDays] = useState<7 | 30>(7);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {cities.length > 0 && selectedCity ? (
          <>
            <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />

            {/* --- PAINEL DE ANÁLISE ESTRATÉGICA --- */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Dashboard Estratégico</h2>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg self-start sm:self-center">
                        <button onClick={() => setPeriodInDays(7)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${periodInDays === 7 ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}>Próximos 7 dias</button>
                        <button onClick={() => setPeriodInDays(30)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${periodInDays === 30 ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}>Próximos 30 dias</button>
                    </div>
                </div>
                <StrategicDashboard city={selectedCity} periodInDays={periodInDays} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Calendar cityId={selectedCity.id} onDateClick={setSelectedDate} />
                </div>
                <div className="lg:col-span-1">
                    <PrismaChat cityId={selectedCity.id} />
                </div>
            </div>
          </>
        ) : (
             <div className="text-center py-20 bg-white border rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Bem-vindo ao Destino.co!</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Para começar, configure a sua cidade principal no perfil e receba sua primeira análise de mercado.</p>
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