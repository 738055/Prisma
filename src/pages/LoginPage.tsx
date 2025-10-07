// src/pages/LoginPage.tsx (VERSÃO ATUALIZADA E REFINADA)
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrismaLogo from '../components/PrismaLogo';
import { Mail, Lock } from 'lucide-react';

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
    if (error) setError('Email ou senha inválidos');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 overflow-hidden relative">
      <PrismaLogo />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            {/* Logo SVG do Prisma */}
            <svg className="w-14 h-14 mx-auto mb-4" viewBox="0 0 4491 4491" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="2245.27" cy="2245.72" r="2245.27" fill="#E1EEE6" fillOpacity="0.1"/>
                <path d="M2056.36 3499.28L3651.6 2829.85L2056.36 1008.52M2056.36 3499.28L870.618 2829.85L2056.36 1008.52M2056.36 3499.28V1008.52" stroke="#E1EEE6" strokeWidth="199.831" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-4xl font-bold text-white mb-2">Prisma</h1>
            <p className="text-slate-400">Inteligência de mercado para o seu hotel.</p>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-slate-500" size={20}/>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900/70 text-white pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-500" placeholder="seu@email.com"/>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-500" size={20}/>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900/70 text-white pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-500" placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Não tem conta? Crie uma agora
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}