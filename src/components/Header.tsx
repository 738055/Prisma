// src/components/Header.tsx (VERSÃO ATUALIZADA)
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, DollarSign, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/dashboard" className="flex items-center gap-2.5">
             <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7.5L12 2L3 7.5V16.5L12 22L21 16.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 12L3 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 12L21 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-bold text-white">Prisma</span>
          </a>
          <div className="relative">
            <button onMouseEnter={() => setMenuOpen(true)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
              <span className="text-sm font-medium text-slate-300 hidden sm:block">{user?.email}</span>
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600"><User size={16} className="text-slate-300" /></div>
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 animate-fade-in"
              >
                <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition" onClick={() => setMenuOpen(false)}><LayoutDashboard size={16} className="text-slate-400" /><span className="text-sm text-slate-300">Dashboard</span></a>
                <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition" onClick={() => setMenuOpen(false)}><User size={16} className="text-slate-400" /><span className="text-sm text-slate-300">Meu Perfil</span></a>
                <a href="/tariffs" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition" onClick={() => setMenuOpen(false)}><DollarSign size={16} className="text-slate-400" /><span className="text-sm text-slate-300">Meus Tarifários</span></a>
                <div className="border-t border-slate-700 my-1"></div>
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition text-left"><LogOut size={16} className="text-red-400" /><span className="text-sm text-red-400">Sair</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}