// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { runFullAnalysis } from './analysisEngine';

// --- CONFIGURAÇÃO ---
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const app = express();
const port = 3001;

// Cliente Supabase para verificar o token do utilizador
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---

// Rota para o frontend disparar o ciclo de análise
// Esta rota agora está obsoleta, pois a análise será automática via Edge Functions,
// mas a mantemos para fins de teste durante o desenvolvimento.
app.post('/api/run-analysis', async (req, res) => {
  try {
    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // 2. LÓGICA DA ANÁLISE
    const { cityId, targetDate } = req.body;
    if (!cityId || !targetDate) {
      return res.status(400).json({ error: '`cityId` e `targetDate` são obrigatórios.' });
    }

    const userId = user.id; // Captura o ID do utilizador autenticado

    // --- CORREÇÃO APLICADA AQUI ---
    // Busca o nome da cidade na base de dados para passar para o motor de análise.
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('name')
      .eq('id', cityId)
      .single();

    if (cityError || !cityData) {
      return res.status(404).json({ error: 'Cidade não encontrada.' });
    }
    const cityName = cityData.name;
    // --- FIM DA CORREÇÃO ---


    console.log(`Recebida solicitação de análise para ${cityName} (${cityId}) na data ${targetDate}`);

    // Dispara a análise em segundo plano e responde imediatamente ao cliente.
    // Agora chama a função com todos os parâmetros corretos.
    runFullAnalysis(cityId, cityName, targetDate, userId).catch(error => {
        console.error(`Erro crítico durante a execução da análise em segundo plano:`, error);
    });

    res.status(202).json({ message: 'A análise foi iniciada com sucesso. Os resultados aparecerão no dashboard em breve.' });

  } catch (error) {
    console.error('Erro na rota /api/run-analysis:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
});

// --- INICIA O SERVIDOR ---
app.listen(port, () => {
  console.log(`🤖 Servidor da API do Prisma (versão proativa) rodando em http://localhost:${port}`);
});