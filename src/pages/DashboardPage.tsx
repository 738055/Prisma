// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Calendar from '../components/Calendar';
import AlertsPanel from '../components/AlertsPanel';
import CitySelector from '../components/CitySelector';
import DayDetailModal from '../components/DayDetailModal';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext'; // 1. Importar o hook de autenticação

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
}

export default function DashboardPage() {
  const { user } = useAuth(); // 2. Obter o utilizador logado
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
        if (!user) return; // Espera até que o utilizador seja carregado
        setLoading(true);

        // 3. Busca os dados em paralelo para mais eficiência
        const [citiesRes, profileRes] = await Promise.all([
            supabase.from('cities').select('*').order('name'),
            supabase.from('user_profiles').select('city_id').eq('id', user.id).single()
        ]);
        
        if (citiesRes.data) {
            setCities(citiesRes.data);
            
            // 4. Lógica para definir a cidade principal
            const userCity = citiesRes.data.find(c => c.id === profileRes.data?.city_id);
            
            // Define a cidade do perfil do utilizador; se não houver, define a primeira da lista.
            setSelectedCity(userCity || citiesRes.data[0] || null);
        }
        setLoading(false);
    };
    loadInitialData();
  }, [user]); // A função agora depende do 'user' para ser executada

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">A carregar os seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCity ? (
            <>
                {/* O CitySelector continua a mostrar todas as opções, mas com a cidade correta já selecionada */}
                <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2">
                    <Calendar cityId={selectedCity.id} onDateClick={setClickedDate} />
                    </div>
                    <div className="lg:col-span-1">
                    <AlertsPanel cityId={selectedCity.id} />
                    </div>
                </div>
            </>
        ) : (
            // Mensagem para utilizadores novos que ainda não configuraram o perfil
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Bem-vindo ao Prisma!</h2>
                <p className="text-slate-600 mb-6">Parece que ainda não selecionou uma cidade principal.</p>
                <a href="/profile" className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
                    Configurar meu perfil
                </a>
            </div>
        )}
      </div>
      {clickedDate && selectedCity && (
        <DayDetailModal date={clickedDate} cityId={selectedCity.id} onClose={() => setClickedDate(null)} />
      )}
    </div>
  );
}