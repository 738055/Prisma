// supabase/functions/agent-run-weekly-analysis/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getDatesForNext90Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    dates.push(formatDate(nextDate));
  }
  return dates;
};

serve(async (_req) => {
  try {
    console.log("[Agente Semanal] Iniciando ciclo de análise preditiva via Web Research.");

    const { data: cities, error: citiesError } = await supabaseAdmin.from('cities').select(`id, name, state`);
    if (citiesError) throw citiesError;

    for (const city of cities) {
      console.log(`[Agente Semanal] Processando cidade: ${city.name}`);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 90);

      const allDates = getDatesForNext90Days();

      // IA FAZ A PESQUISA E GERA AS PREVISÕES DIÁRIAS DIRETAMENTE
      const extractionPrompt = `
        Usando sua capacidade de pesquisa web, encontre todos os eventos, feriados e congressos confirmados para a cidade de '${city.name}, ${city.state}' para os próximos 90 dias (de ${formatDate(startDate)} até ${formatDate(endDate)}).

        Com base na sua pesquisa, gere uma previsão de demanda diária para CADA UM dos próximos 90 dias.
        - Se encontrar um evento numa data, marque a demanda como 'high' ou 'peak' e cite o evento no 'reasoning'.
        - Para fins de semana normais, use 'moderate'.
        - Para dias de semana sem eventos, use 'low'.
        
        Responda APENAS com um objeto JSON com a chave "daily_predictions", contendo um array de 90 objetos.
        Use esta estrutura para cada objeto do array:
        { "date": "YYYY-MM-DD", "demand_level": "low"|"moderate"|"high"|"peak", "reasoning": "Motivo conciso. Ex: Fim de semana, ou, Evento: Rock in Rio." }
      `;
      const extractionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: extractionPrompt }],
        response_format: { type: "json_object" },
      });
      const { daily_predictions } = JSON.parse(extractionResponse.choices[0].message.content!);

      // AGENTE SALVA AS PREVISÕES NO BANCO DE DADOS
      if (daily_predictions && daily_predictions.length > 0) {
        const predictionsToSave = daily_predictions.map((p: any) => ({
          city_id: city.id,
          prediction_date: p.date,
          demand_level: p.demand_level,
          confidence_score: 85,
          factors: [{ type: "weekly_web_research", reason: p.reasoning }],
        }));

        const { error } = await supabaseAdmin.from('demand_predictions').upsert(predictionsToSave, {
            onConflict: 'city_id, prediction_date'
        });

        if (error) {
            console.error(`[Agente Semanal] Erro ao salvar previsões para ${city.name}:`, error);
        } else {
            console.log(`[Agente Semanal] ${predictionsToSave.length} previsões salvas/atualizadas para ${city.name}.`);
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: "Ciclo do Agente Semanal (Web Research) concluído." }));
  } catch (error) {
    console.error("[Agente Semanal] Falha crítica no ciclo:", error);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});