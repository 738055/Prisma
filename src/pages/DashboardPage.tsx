// src/pages/DashboardPage.tsx (VERSÃO FINAL E COMPLETA)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CitySelector from '../components/CitySelector';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { StrategicDashboard } from '../components/StrategicDashboard';
import { PeriodSearch } from '../components/PeriodSearch';
import { Loader2 } from 'lucide-react';

interface City { id: string; name: string; state: string; slug: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'7days' | '30days'>('7days');

  useEffect(() => {
    const loadInitialData = async () => {
        if (!user) return; 
        setLoading(true);
        const [citiesRes, profileRes] = await Promise.all([
            supabase.from('cities').select('*').order('name'),
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="animate-spin text-blue-600 h-12 w-12 mx-auto mb-4" />
            <p className="text-slate-600">A carregar a sua plataforma de inteligência...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {cities.length > 0 && selectedCity ? (
            <>
                <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />
                
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="border-b border-slate-200 mb-6">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('7days')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === '7days' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Próximos 7 Dias
                            </button>
                            <button onClick={() => setActiveTab('30days')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === '30days' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Próximo Mês
                            </button>
                        </nav>
                    </div>
                    {activeTab === '7days' && <StrategicDashboard city={selectedCity} periodInDays={7} key={`7days-${selectedCity.id}`} />}
                    {activeTab === '30days' && <StrategicDashboard city={selectedCity} periodInDays={30} key={`30days-${selectedCity.id}`} />}
                </div>

                <PeriodSearch city={selectedCity} />
            </>
        ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Bem-vindo ao Prisma!</h2>
                <p className="text-slate-600 mb-6">Comece por configurar o seu perfil para obter a sua primeira análise.</p>
                <a href="/profile" className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                  Configurar Meu Perfil
                </a>
            </div>
        )}
      </main>
    </div>
  );
}