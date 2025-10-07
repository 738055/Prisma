// src/pages/LoginPage.tsx (VERSÃO ATUALIZADA)
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrismaLogo from '../components/PrismaLogo';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError('Email ou senha inválidos. Tente novamente.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 overflow-hidden relative">
      <PrismaLogo />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
             <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              Destino.co
            </h1>
            <p className="text-gray-400">Inteligência de mercado para o seu hotel.</p>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="seu@email.com"/>
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-900/70 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Acessando...' : 'Entrar'}</button>
          </form>
          <div className="mt-6 text-center text-sm"><a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition">Não tem conta? Crie uma agora</a></div>
        </div>
      </div>
    </div>
  );
}