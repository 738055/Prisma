import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { User, Building2, Save } from 'lucide-react';

interface City {
  id: string;
  name: string;
  state: string;
}

// Interface atualizada para incluir os novos campos
interface UserProfile {
  hotel_name: string;
  city_id: string | null;
  accommodation_type?: string | null;
  star_rating?: number | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ hotel_name: '', city_id: null, accommodation_type: null, star_rating: null });
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);

      const [citiesResult, profileResult] = await Promise.all([
        supabase.from('cities').select('id, name, state').order('name'),
        supabase.from('user_profiles').select('*').eq('id', user.id).single()
      ]);

      if (citiesResult.data) setCities(citiesResult.data);
      if (profileResult.data) setProfile(profileResult.data);

      setLoading(false);
    };
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        hotel_name: profile.hotel_name,
        city_id: profile.city_id,
        accommodation_type: profile.accommodation_type,
        star_rating: profile.star_rating,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      setMessage('Erro ao salvar perfil');
    } else {
      setMessage('Perfil atualizado com sucesso!');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // --- CORREÇÃO AQUI ---
  // Substituímos o comentário por um componente de loading real.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
              <p className="text-slate-600">Gerencie suas informações</p>
            </div>
          </div>

          {/* --- CORREÇÃO AQUI --- */}
          {/* Substituímos o comentário por um componente de mensagem real. */}
          {message && (
            <div className={`px-4 py-3 rounded-lg mb-6 ${
              message.includes('sucesso')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"/>
            </div>

            <div>
              <label htmlFor="hotelName" className="block text-sm font-medium text-slate-700 mb-2">
                <Building2 size={16} className="inline mr-1" />
                Nome do Hotel
              </label>
              <input id="hotelName" type="text" value={profile.hotel_name} onChange={(e) => setProfile({ ...profile, hotel_name: e.target.value })} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"/>
            </div>
            
            <div>
              <label htmlFor="accommodationType" className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Acomodação
              </label>
              <select id="accommodationType" value={profile.accommodation_type || ''} onChange={(e) => setProfile({ ...profile, accommodation_type: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="" disabled>Selecione o tipo</option>
                <option value="Hotel">Hotel</option>
                <option value="Pousada">Pousada</option>
                <option value="Resort">Resort</option>
                <option value="Hostel">Hostel</option>
                <option value="Apart-Hotel">Apart-Hotel</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="starRating" className="block text-sm font-medium text-slate-700 mb-2">
                Classificação (Estrelas)
              </label>
              <select id="starRating" value={profile.star_rating || ''} onChange={(e) => setProfile({ ...profile, star_rating: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="" disabled>Selecione a classificação</option>
                <option value="1">1 Estrela</option>
                <option value="2">2 Estrelas</option>
                <option value="3">3 Estrelas</option>
                <option value="4">4 Estrelas</option>
                <option value="5">5 Estrelas</option>
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                Cidade Principal
              </label>
              <select id="city" value={profile.city_id || ''} onChange={(e) => setProfile({ ...profile, city_id: e.target.value || null })} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                <option value="">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}