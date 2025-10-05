// supabase/functions/agent-run-on-demand/index.ts (VERSÃO FINAL COM DADOS REAIS)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';

// Cabeçalhos CORS para permitir a comunicação entre o frontend e a Edge Function.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja ao seu domínio.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicialização dos clientes Supabase e OpenAI com as chaves de ambiente.
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  // Responde à requisição "preflight" do navegador para verificar as permissões CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrai os parâmetros do corpo da requisição.
    const { cityId, startDate, endDate, userId } = await req.json();

    // Validação robusta dos parâmetros recebidos.
    if (!cityId || !startDate || !endDate || !userId) {
      return new Response(JSON.stringify({ error: "Parâmetros em falta. Todos os campos são obrigatórios." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[Agente On-Demand] Iniciando análise para a cidade ${cityId} no período de ${startDate} a ${endDate}.`);

    // 1. Buscar os detalhes da cidade (nome e estado) no banco de dados usando o cityId.
    const { data: city, error: cityError } = await supabaseAdmin
      .from('cities')
      .select('name, state')
      .eq('id', cityId)
      .single();

    if (cityError) throw new Error(`Cidade com ID ${cityId} não encontrada.`);

    const cityName = `${city.name}, ${city.state}`;

    // 2. Criar o prompt detalhado para a OpenAI.
    // Este prompt instrui a IA a agir como um analista de mercado para hotelaria.
    const analysisPrompt = `
      # Persona: Analista de Mercado Hoteleiro Sênior

      ## Tarefa:
      Realize uma pesquisa web aprofundada e gere um relatório de inteligência de mercado conciso e acionável para um gerente de hotel na cidade de **${cityName}**, cobrindo o período de **${startDate}** a **${endDate}**.

      ## Formato de Saída OBRIGATÓRIO:
      Responda APENAS com o relatório em formato Markdown. Não inclua saudações ou texto introdutório. O relatório deve ser estruturado com os seguintes tópicos:

      ### 1. Resumo Executivo
      - Um parágrafo curto resumindo os principais insights, oportunidades e riscos para o período.

      ### 2. Eventos e Feriados
      - Liste os principais eventos (congressos, shows, festivais, eventos esportivos) e feriados no período.
      - Para cada evento, estime o impacto na demanda hoteleira (Baixo, Médio, Alto).

      ### 3. Análise da Demanda Aérea
      - Com base em tendências de busca de voos (se disponíveis publicamente), descreva o padrão de demanda aérea esperado para a cidade no período.

      ### 4. Insights da Concorrência
      - Analise o comportamento de preços e disponibilidade de hotéis concorrentes na cidade, se houver dados públicos ou notícias sobre o setor.

      ### 5. Recomendações Estratégicas
      - Com base em todos os dados, forneça 2-3 recomendações claras para a estratégia de precificação do hotel.
    `;

    // 3. Chamar a API da OpenAI para gerar o relatório.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Modelo mais avançado para análises complexas
      messages: [{ role: "system", content: analysisPrompt }],
      temperature: 0.5, // Controla a criatividade da resposta
    });

    const finalReport = completion.choices[0].message.content;

    if (!finalReport) {
      throw new Error("A API da OpenAI não retornou um relatório.");
    }

    // 4. Retornar o relatório gerado no formato esperado pelo frontend.
    return new Response(JSON.stringify({ analysis: { final_report: finalReport } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Agente On-Demand] Falha crítica:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});