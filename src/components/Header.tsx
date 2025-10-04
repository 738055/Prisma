// src/components/Header.tsx
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, User, LogOut, DollarSign } from 'lucide-react'; // <-- 1. Importar o ícone
import { useState } from 'react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-lg">
              <Sparkles size={24} />
            </div>
            <span className="text-xl font-bold text-slate-800">Prisma</span>
          </a>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.email}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} className="text-slate-600" />
                  <span className="text-sm text-slate-700">Meu Perfil</span>
                </a>
                
                {/* --- 2. ADICIONAR O NOVO LINK AQUI --- */}
                <a
                  href="/tariffs"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  <DollarSign size={16} className="text-slate-600" />
                  <span className="text-sm text-slate-700">Meus Tarifários</span>
                </a>
                
                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition text-left"
                >
                  <LogOut size={16} className="text-slate-600" />
                  <span className="text-sm text-slate-700">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}