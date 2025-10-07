// src/pages/SignUpPage.tsx (VERSÃO ATUALIZADA)
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrismaLogo from '../components/PrismaLogo';
import { Mail, Lock, Building2, Star, BedDouble } from 'lucide-react';

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
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (!accommodationType || !starRating) { setError('Por favor, preencha todos os campos do perfil.'); return; }
    setLoading(true);
    const { error } = await signUp({ email, password, hotelName, accommodationType, starRating: Number(starRating) });
    if (error) {
      if (error.message.includes('already registered')) { setError('Este email já está registrado.'); }
      else { setError('Erro ao criar conta. Verifique os dados e tente novamente.'); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 overflow-hidden relative">
      <PrismaLogo />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Crie a sua Conta</h1>
            <p className="text-gray-400">Comece a otimizar suas tarifas hoje.</p>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
              <input id="hotelName" type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} required className="w-full bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Nome do Hotel"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="relative">
                 <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                 <select id="accommodationType" value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} required className="w-full appearance-none bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="" disabled>Tipo</option><option value="Hotel">Hotel</option><option value="Pousada">Pousada</option><option value="Resort">Resort</option></select>
              </div>
              <div className="relative">
                 <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                 <select id="starRating" value={starRating} onChange={(e) => setStarRating(Number(e.target.value))} required className="w-full appearance-none bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="" disabled>Estrelas</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Seu melhor email"/>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Senha (mín. 6 caracteres)"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Criando conta...' : 'Criar Conta'}</button>
          </form>
          <div className="mt-6 text-center text-sm"><a href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">Já tem uma conta? Entre</a></div>
        </div>
      </div>
    </div>
  );
}