import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, DollarSign, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import ThemeSwitcher from './ThemeSwitcher'; // <-- Importar o botão

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/dashboard" className="flex items-center gap-2.5">
            <svg className="w-8 h-8" viewBox="0 0 4491 4491" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* O path agora usa a cor do texto atual para se adaptar ao tema */}
                <path d="M2056.36 3499.28L3651.6 2829.85L2056.36 1008.52M2056.36 3499.28L870.618 2829.85L2056.36 1008.52M2056.36 3499.28V1008.52" stroke="currentColor" strokeWidth="199.831" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-bold text-slate-800 dark:text-white">Destino.co</span>
          </a>
          <div className="flex items-center gap-2">
            <ThemeSwitcher /> {/* <-- Botão adicionado aqui */}
            <div className="relative">
              <button onMouseEnter={() => setMenuOpen(true)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user?.email}</span>
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                  <User size={16} className="text-slate-600 dark:text-slate-300" />
                </div>
              </button>
              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 animate-fade-in"
                >
                  <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"><LayoutDashboard size={16} className="text-slate-500 dark:text-slate-400" /><span className="text-sm text-slate-700 dark:text-slate-300">Dashboard</span></a>
                  <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"><User size={16} className="text-slate-500 dark:text-slate-400" /><span className="text-sm text-slate-700 dark:text-slate-300">Meu Perfil</span></a>
                  <a href="/tariffs" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"><DollarSign size={16} className="text-slate-500 dark:text-slate-400" /><span className="text-sm text-slate-700 dark:text-slate-300">Meus Tarifários</span></a>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                  <button onClick={() => { setMenuOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition text-left"><LogOut size={16} className="text-red-500 dark:text-red-400" /><span className="text-sm text-red-500 dark:text-red-400">Sair</span></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}