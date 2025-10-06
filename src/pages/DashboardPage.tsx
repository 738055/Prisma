// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import CitySelector from '../components/CitySelector';
import AnalysisTrigger from '../components/AnalysisTrigger'; // <-- Novo componente
import AnalysisDisplay from '../components/AnalysisDisplay'; // <-- Novo componente

interface City { id: string; name: string; state: string; slug: string; }

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  
  // O estado que controla a análise ativa
  const [analysisTargetDate, setAnalysisTargetDate] = useState<string | null>(null);

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

  const handleAnalysisRequest = (date: string) => {
    setAnalysisTargetDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="text-center">
              <Loader2 className="animate-spin text-blue-600 h-12 w-12 mx-auto mb-4" />
              <p className="text-slate-600">Carregando sua plataforma de inteligência...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {cities.length > 0 && selectedCity ? (
            <>
                <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />
                <AnalysisTrigger city={selectedCity} onAnalysisRequest={handleAnalysisRequest} />
                {analysisTargetDate && (
                  <AnalysisDisplay 
                    key={analysisTargetDate + selectedCity.id} // Força a remontagem ao mudar a data ou cidade
                    city={selectedCity} 
                    targetDate={analysisTargetDate} 
                  />
                )}
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