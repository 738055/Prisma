// supabase/functions/dynamic-details/index.ts (VERSÃO FINAL COM CORREÇÃO DE TIMEOUT)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.19.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function safeJsonParse(jsonString: string | null) {
  if (!jsonString) return null;
  try { return JSON.parse(jsonString); } 
  catch (e) { console.error("Falha ao interpretar JSON da OpenAI:", e); return null; }
}

serve(async (req) => {
  console.log("[INFO] Função 'dynamic-details' invocada.");
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error("Uma ou mais secrets (chaves de API) não estão configuradas na Edge Function.");
    }
    console.log("[INFO] Secrets carregadas.");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const { date, userId } = await req.json();
    if (!date || !userId) throw new Error("Parâmetros 'date' e 'userId' são obrigatórios.");
    console.log(`[INFO] Analisando dados para o utilizador ${userId} na data ${date}.`);
    
    const { data: profile } = await supabaseAdmin.from('user_profiles').select(`*, cities(name, region)`).eq('id', userId).single();
    if (!profile) throw new Error("Perfil do utilizador não encontrado.");
    if (!profile.cities) throw new Error("Utilizador não tem uma cidade principal configurada no perfil.");

    const { data: roomTypes } = await supabaseAdmin.from('room_types').select('id, name').eq('user_id', userId);
    if (!roomTypes || roomTypes.length === 0) throw new Error("Nenhum tipo de quarto foi cadastrado.");
    console.log(`[INFO] Perfil e ${roomTypes.length} tipos de quarto encontrados para ${profile.hotel_name}.`);

    const prompt = `
      Você é um especialista em gestão de receita hoteleira.
      Analise o mercado para a data ${date} na cidade de ${profile.cities.name}.
      O hotel é um "${profile.accommodation_type} ${profile.star_rating} estrelas".
      Os tipos de quarto são: ${roomTypes.map(rt => `"${rt.name}"`).join(', ')}.
      Sua missão é retornar um JSON com uma chave "recommendations", que é um array.
      Para cada tipo de quarto, crie um objeto no array com as chaves: "room_type_name", "recommended_price", "market_average" e "reasoning".
      Para a análise, SIMULE a busca por preços de concorrentes, eventos e tendência de voos.
      Seja criativo, realista e retorne a resposta em português. Gere o JSON e nada mais.
    `;
    console.log("[INFO] A enviar prompt para a OpenAI...");

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      // A linha 'timeout: 20000' foi removida daqui, pois causava o erro.
    });
    console.log("[INFO] Resposta recebida da OpenAI.");

    const finalData = safeJsonParse(response.choices[0].message.content);
    if (!finalData || !finalData.recommendations) throw new Error("A IA não retornou os dados no formato JSON esperado.");
    
    console.log("[INFO] Análise concluída. A enviar resposta para o frontend.");
    return new Response(JSON.stringify(finalData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("ERRO CRÍTICO NA FUNÇÃO:", { message: error.message });
    return new Response(JSON.stringify({ error: `Erro interno na função: ${error.message}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});