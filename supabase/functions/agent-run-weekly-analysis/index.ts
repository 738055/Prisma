// supabase/functions/agent-run-weekly-analysis/index.ts (VERSÃO FINAL COM PESQUISA WEB REAL)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

// --- CONFIGURAÇÕES ---
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// --- FUNÇÃO DE PESQUISA (REUTILIZADA) ---
async function performSearch(query: string): Promise<string> {
    const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');
    if (!SERPAPI_API_KEY) {
      console.warn("SERPAPI_API_KEY não encontrada.");
      return "Pesquisa web desabilitada.";
    }
    try {
        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`SerpAPI status: ${response.status}`);
        const results = await response.json();
        const snippets = (results.organic_results || [])
            .slice(0, 5)
            .map((r: any) => ({ title: r.title, snippet: r.snippet, link: r.link }));
        if (snippets.length === 0) return "Nenhum resultado encontrado.";
        return JSON.stringify(snippets);
    } catch (error) {
        console.error("Erro na SerpAPI:", error);
        return `Erro ao pesquisar: ${error.message}`;
    }
}

serve(async (_req) => {
  try {
    console.log("[Agente Semanal] Iniciando ciclo de análise com Web Search.");
    const { data: cities, error: citiesError } = await supabaseAdmin.from('cities').select('id, name, state');
    if (citiesError) throw citiesError;

    for (const city of cities) {
      console.log(`[Agente Semanal] Processando cidade: ${city.name}, ${city.state}`);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 90);
      const year = startDate.getFullYear();

      const messages: ChatCompletionMessageParam[] = [{
        role: 'system',
        content: `Você é um analista de dados. Sua tarefa é usar a ferramenta de pesquisa para encontrar eventos, feriados e congressos para '${city.name}, ${city.state}' para os próximos 90 dias (foco no ano ${year}). Com base nos resultados da pesquisa, gere um objeto JSON contendo as chaves "events" e "alerts", formatadas para serem salvas em um banco de dados.`
      }];

      const tools: ChatCompletionTool[] = [{
        type: 'function',
        function: {
          name: 'web_search',
          description: `Pesquisa na web por eventos em ${city.name} para ${year} e anos futuros.`,
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: `Consulta de pesquisa, ex: "eventos ${city.name} ${year}"` } },
            required: ['query'],
          },
        },
      }];

      let response = await openai.chat.completions.create({
        model: 'gpt-4o', messages, tools, tool_choice: 'auto', response_format: { type: "json_object" }
      });
      let responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls) {
        messages.push(responseMessage);
        for (const toolCall of responseMessage.tool_calls) {
          const searchResult = await performSearch(JSON.parse(toolCall.function.arguments).query);
          messages.push({
            tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: searchResult
          });
        }
        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4o', messages, response_format: { type: "json_object" }
        });
        responseMessage = secondResponse.choices[0].message;
      }
      
      const { events = [], alerts = [] } = JSON.parse(responseMessage.content || '{}');
      
      // --- LÓGICA PARA CRIAR PREVISÕES DIÁRIAS (BAIXA/MODERADA/ALTA) ---
      const dates = Array.from({ length: 90 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
      const eventsMap = new Map((events || []).map((e: any) => [e.event_date, e]));
      const daily_predictions = dates.map(date => {
        const dateString = formatDate(date);
        const dayOfWeek = date.getDay();
        if (eventsMap.has(dateString)) {
          const event = eventsMap.get(dateString);
          return { date: dateString, demand_level: (event.impact_score || 8) > 7 ? 'peak' : 'high', reasoning: `Evento: ${event.title}` };
        }
        if (dayOfWeek === 5 || dayOfWeek === 6) { return { date: dateString, demand_level: 'moderate', reasoning: 'Fim de semana' }; }
        return { date: dateString, demand_level: 'low', reasoning: 'Dia de semana' };
      });
      
      // --- ARMAZENAMENTO NO BANCO DE DADOS ---
      if (daily_predictions.length > 0) {
        const predictionsToSave = daily_predictions.map((p: any) => ({ city_id: city.id, prediction_date: p.date, demand_level: p.demand_level, confidence_score: 95, factors: [{ type: "realtime_web_search", reason: p.reasoning }] }));
        await supabaseAdmin.from('demand_predictions').upsert(predictionsToSave, { onConflict: 'city_id, prediction_date' });
        console.log(`[Agente Semanal] ${predictionsToSave.length} previsões salvas para ${city.name}.`);
      }
      if (events.length > 0) {
        const eventsToSave = events.map((e: any) => ({ city_id: city.id, ...e }));
        await supabaseAdmin.from('events').upsert(eventsToSave, { onConflict: 'title, event_date' });
        console.log(`[Agente Semanal] ${events.length} eventos salvos para ${city.name}.`);
      }
      if (alerts.length > 0) {
        await supabaseAdmin.from('alerts').update({ is_active: false }).eq('city_id', city.id);
        const alertsToSave = alerts.map((a: any) => ({ city_id: city.id, ...a, is_active: true }));
        await supabaseAdmin.from('alerts').insert(alertsToSave);
        console.log(`[Agente Semanal] ${alerts.length} alertas salvos para ${city.name}.`);
      }
    }
    return new Response(JSON.stringify({ success: true, message: "Ciclo do Agente Semanal com Web Search concluído." }));
  } catch (error) {
    console.error("[Agente Semanal] Falha crítica no ciclo:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});