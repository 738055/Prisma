// src/pages/SignUpPage.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrismaLogo from '../components/PrismaLogo';

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
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (!accommodationType || !starRating) { setError('Por favor, preencha todos os campos do perfil.'); return; }
    setLoading(true);
    const { error } = await signUp({ email, password, hotelName, accommodationType, starRating: Number(starRating) });
    if (error) {
      if (error.message.includes('already registered')) { setError('Este email já está registado'); } 
      else { setError('Erro ao criar conta. Tente novamente.'); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      <PrismaLogo />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Crie a sua Conta</h1>
            <p className="text-slate-400">Comece a otimizar as suas tarifas hoje.</p>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input id="hotelName" type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} required className="w-full bg-slate-900/70 text-white px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Nome do Hotel"/>
            <div className="grid grid-cols-2 gap-4">
              <select id="accommodationType" value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} required className="w-full bg-slate-900/70 text-white px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="" disabled>Tipo</option><option value="Hotel">Hotel</option><option value="Pousada">Pousada</option><option value="Resort">Resort</option></select>
              <select id="starRating" value={starRating} onChange={(e) => setStarRating(Number(e.target.value))} required className="w-full bg-slate-900/70 text-white px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="" disabled>Estrelas</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>
            </div>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900/70 text-white px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="O seu melhor email"/>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-slate-900/70 text-white px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Senha (mín. 6 caracteres)"/>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{loading ? 'A criar conta...' : 'Criar Conta'}</button>
          </form>
          <div className="mt-6 text-center"><a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Já tem uma conta? Entre</a></div>
        </div>
      </div>
    </div>
  );
}