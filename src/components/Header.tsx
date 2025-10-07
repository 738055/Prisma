// src/components/Header.tsx (VERSÃO ATUALIZADA)
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, DollarSign, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-bold text-white tracking-tight">Destino.co</span>
          </a>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition">
              <span className="text-sm font-medium text-gray-300 hidden sm:block">{user?.email}</span>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-600"><User size={16} className="text-gray-300" /></div>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 animate-fade-in"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition" onClick={() => setMenuOpen(false)}><LayoutDashboard size={16} className="text-gray-400" /><span className="text-sm text-gray-300">Dashboard</span></a>
                <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition" onClick={() => setMenuOpen(false)}><User size={16} className="text-gray-400" /><span className="text-sm text-gray-300">Meu Perfil</span></a>
                <a href="/tariffs" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition" onClick={() => setMenuOpen(false)}><DollarSign size={16} className="text-gray-400" /><span className="text-sm text-gray-300">Meus Tarifários</span></a>
                <div className="border-t border-gray-700 my-1"></div>
                <button onClick={() => { setMenuOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50 transition text-left"><LogOut size={16} className="text-red-400" /><span className="text-sm text-red-400">Sair</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}