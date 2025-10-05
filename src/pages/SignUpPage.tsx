// frontend/src/pages/SignUpPage.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

// --- CORREÇÃO AQUI ---
// Remova a palavra 'default' da linha abaixo
export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [starRating, setStarRating] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (!accommodationType || !starRating) {
      setError('Por favor, preencha todos os campos do perfil.');
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      hotelName,
      accommodationType,
      starRating: Number(starRating),
    });

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    }
    // Se não houver erro, a lógica do AuthContext irá redirecionar o utilizador
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 rounded-xl">
              <UserPlus size={32} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Crie sua conta
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Comece a otimizar suas tarifas hoje
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="hotelName" className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Hotel
              </label>
              <input id="hotelName" type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Hotel Exemplo"/>
            </div>

            {/* --- NOVO CAMPO --- */}
            <div>
              <label htmlFor="accommodationType" className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Acomodação
              </label>
              <select id="accommodationType" value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                <option value="" disabled>Selecione o tipo</option>
                <option value="Hotel">Hotel</option>
                <option value="Pousada">Pousada</option>
                <option value="Resort">Resort</option>
                <option value="Hostel">Hostel</option>
                <option value="Apart-Hotel">Apart-Hotel</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* --- NOVO CAMPO --- */}
            <div>
              <label htmlFor="starRating" className="block text-sm font-medium text-slate-700 mb-2">
                Classificação (Estrelas)
              </label>
              <select id="starRating" value={starRating} onChange={(e) => setStarRating(Number(e.target.value))} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                <option value="" disabled>Selecione a classificação</option>
                <option value="1">1 Estrela</option>
                <option value="2">2 Estrelas</option>
                <option value="3">3 Estrelas</option>
                <option value="4">4 Estrelas</option>
                <option value="5">5 Estrelas</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="seu@email.com"/>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="••••••••"/>
              <p className="mt-1 text-xs text-slate-500">Mínimo de 6 caracteres</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Já tem uma conta? Entre
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}