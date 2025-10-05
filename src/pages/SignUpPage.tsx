// src/contexts/AuthContext.tsx (VERSÃO CORRIGIDA E SIMPLIFICADA)
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SignUpData {
  email: string;
  password: string;
  hotelName: string;
  accommodationType: string;
  starRating: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- CORREÇÃO AQUI ---
  // A função signUp foi simplificada. Agora, ela apenas cria o usuário
  // e passa os dados do perfil como metadados. O Trigger no Supabase
  // cuidará de criar o registro na tabela 'user_profiles'.
  const signUp = async ({ email, password, hotelName, accommodationType, starRating }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          hotel_name: hotelName,
          accommodation_type: accommodationType,
          star_rating: starRating,
        }
      }
    });

    // A inserção do perfil foi removida daqui, pois o Trigger faz o trabalho.
    // Isso torna o processo mais seguro e confiável.
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}