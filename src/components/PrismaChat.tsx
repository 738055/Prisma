// src/components/PrismaChat.tsx (VERSÃO AJUSTADA)
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';

// Adicione cityId às props para dar contexto ao chat
interface PrismaChatProps {
  cityId: string | null;
}

function PrismaChat({ cityId }: PrismaChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || isLoading || !user) return;
    
    // Validação para garantir que uma cidade está selecionada
    if (!cityId) {
      setError("Por favor, selecione uma cidade antes de perguntar.");
      return;
    }

    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      // Chamada direta para a nova Edge Function do Supabase
      const { data, error: funcError } = await supabase.functions.invoke('prisma-chat-api', {
        body: JSON.stringify({
          userQuery: message,
          cityId: cityId, // Enviando o ID da cidade
        }),
      });

      if (funcError) throw new Error(funcError.message);
      if (data.error) throw new Error(data.error);

      setResponse(data.response);

    } catch (error: any) {
      setError(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles /> Assistente de Análise Prisma
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Qual a demanda para o Natal?"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={!cityId}
        />
        <button type="submit" disabled={isLoading || !cityId} className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Perguntar'}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {response && <div className="mt-4 p-4 border rounded-lg bg-slate-50 prose prose-slate max-w-none"><p>{response}</p></div>}
    </div>
  );
}

export default PrismaChat;