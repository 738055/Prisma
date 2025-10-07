// src/pages/LoginPage.tsx (VERSÃO ATUALIZADA)
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      <PrismaLogo />
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7.5L12 2L3 7.5V16.5L12 22L21 16.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 12L3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 12L21 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16.5 4.99999L7.5 9.49999" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-4xl font-bold text-white mb-2">Prisma</h1>
            <p className="text-slate-400">Inteligência de mercado para o seu hotel.</p>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-900/70 text-white pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="seu@email.com"/>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-900/70 text-white pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'A entrar...' : 'Entrar'}</button>
          </form>
          <div className="mt-6 text-center text-sm"><a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition">Não tem conta? Crie uma agora</a></div>
        </div>
      </div>
    </div>
  );
}