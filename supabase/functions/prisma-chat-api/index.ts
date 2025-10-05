// supabase/functions/prisma-chat-api/index.ts (NOVA FUNÇÃO)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userQuery, cityId } = await req.json();
    if (!userQuery || !cityId) throw new Error("A pergunta do usuário e a cidade são obrigatórias.");

    // --- ETAPA 1: BUSCAR DADOS RELEVANTES NO SEU BANCO DE DADOS ---
    console.log(`Buscando dados para a cidade ${cityId} com base na pergunta: "${userQuery}"`);

    const [eventsRes, alertsRes, demandRes] = await Promise.all([
      supabaseAdmin.from('events').select('title, event_date, impact_score').eq('city_id', cityId).limit(20),
      supabaseAdmin.from('alerts').select('title, message, target_date').eq('city_id', cityId).eq('is_active', true).limit(10),
      supabaseAdmin.from('demand_predictions').select('prediction_date, demand_level, reasoning').eq('city_id', cityId).limit(90)
    ]);

    const contextData = {
      events: eventsRes.data || [],
      alerts: alertsRes.data || [],
      demand_predictions: demandRes.data || [],
    };

    // --- ETAPA 2: GERAR O INSIGHT COM A IA USANDO OS DADOS COMO CONTEXTO ---
    const systemPrompt = `
      Você é o Prisma, um assistente especialista em inteligência de mercado para hotelaria.
      Sua tarefa é responder à pergunta do usuário de forma concisa e direta, baseando-se EXCLUSIVAMENTE nos dados de contexto fornecidos abaixo.
      Não use conhecimento prévio. Analise os dados de eventos, alertas e previsões para formular sua resposta.
      Se os dados não forem suficientes para responder, diga que não encontrou informações relevantes sobre o tópico.

      ## DADOS DE CONTEXTO OBTIDOS DO BANCO DE DADOS:
      ${JSON.stringify(contextData, null, 2)}
    `;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,
    });

    const insight = response.choices[0].message.content;

    return new Response(JSON.stringify({ response: insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função Prisma Chat:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});