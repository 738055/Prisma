// Exemplo em um componente React (src/components/PrismaChat.tsx)
import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // Importe seu cliente supabase

function PrismaChat() {
  const [message, setMessage] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Esta função é chamada quando o formulário é enviado
  const handleSubmit = async (e: React.FormEvent) => {
    // 1. Previne a navegação padrão do formulário
    e.preventDefault();
    if (!message || isLoading) return;

    setIsLoading(true);
    setResponse('');

    try {
      // 2. Pega o token de autenticação do usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado.");
      }

      // 3. Faz a CHAMADA DE API em segundo plano com 'fetch'
      const apiResponse = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Envia o token para a API segura
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          threadId,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'A resposta da API falhou.');
      }

      const data = await apiResponse.json();
      
      // 4. Atualiza o estado do componente com a resposta
      setResponse(data.response);
      setThreadId(data.threadId);

    } catch (error: any) {
      setResponse(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div>
      {/* O formulário usa onSubmit para chamar a função handleSubmit */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Qual a demanda para Gramado no Natal?"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Analisando...' : 'Perguntar ao Prisma'}
        </button>
      </form>
      <div>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default PrismaChat;