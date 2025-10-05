// supabase/functions/agent-run-on-demand/index.ts (FINAL - COM PESQUISA REAL COMANDADA PELO GPT)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Função que executa a pesquisa na web quando o GPT solicita
async function performSearch(query: string): Promise<string> {
  const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');
  if (!SERPAPI_API_KEY) {
    throw new Error("ERRO CRÍTICO: A chave da API de pesquisa (SERPAPI_API_KEY) não foi configurada no ambiente da Supabase Function. Adicione-a nas configurações do seu projeto.");
  }
  
  try {
    console.log(`(Etapa 2) Executando a pesquisa solicitada pelo GPT: "${query}"`);
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A API de pesquisa (SerpAPI) respondeu com status: ${response.status}`);
    
    const results = await response.json();
    const snippets = (results.organic_results || []).slice(0, 5).map((r: any) => ({ title: r.title, snippet: r.snippet, link: r.link }));
    if (snippets.length === 0) return "Nenhum resultado encontrado na web para esta consulta.";
    
    return JSON.stringify(snippets);
  } catch (error) {
    console.error("Falha na execução da pesquisa com SerpAPI:", error);
    throw new Error(`A pesquisa na web falhou: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cityId, startDate, endDate } = await req.json();
    if (!cityId || !startDate || !endDate) throw new Error("Parâmetros ausentes.");

    const { data: city } = await supabaseAdmin.from('cities').select('name, state').eq('id', cityId).single();
    if (!city) throw new Error(`Cidade com ID ${cityId} não encontrada.`);
    const cityName = `${city.name}, ${city.state}`;
    const year = new Date(startDate).getFullYear();

    const messages: ChatCompletionMessageParam[] = [{
      role: 'system',
      content: `Você é um analista de mercado hoteleiro. Sua tarefa é criar um relatório para a cidade de ${cityName} entre ${startDate} e ${endDate}. Use a ferramenta de pesquisa para encontrar eventos, feriados e tendências confirmados para o ano de ${year}. Gere um relatório final em Markdown com base nos resultados da pesquisa.`
    }];

    const tools: ChatCompletionTool[] = [{
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Realiza uma pesquisa na web para encontrar informações atualizadas e confirmadas.',
        parameters: { type: 'object', properties: { query: { type: 'string', description: `Consulta de pesquisa específica, incluindo o ano. Ex: "eventos em ${cityName} ${year}"` } }, required: ['query'] },
      },
    }];

    // --- (Etapa 1) GPT decide se precisa pesquisar ---
    console.log('(Etapa 1) Perguntando ao GPT se a pesquisa é necessária...');
    let response = await openai.chat.completions.create({ model: 'gpt-4o', messages, tools, tool_choice: 'auto' });
    let responseMessage = response.choices[0].message;

    // --- (Etapa 2) Se o GPT pedir para pesquisar, nosso código executa ---
    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'web_search') {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const searchResult = await performSearch(functionArgs.query);
          
          // --- (Etapa 3) Entregando os resultados da pesquisa de volta ao GPT ---
          console.log('(Etapa 3) Entregando os resultados da pesquisa para o GPT analisar...');
          messages.push({ tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: searchResult });
        }
      }
      const secondResponse = await openai.chat.completions.create({ model: 'gpt-4o', messages });
      responseMessage = secondResponse.choices[0].message;
    }

    const finalReport = responseMessage.content;
    if (!finalReport) throw new Error("A IA não gerou um relatório final após a pesquisa.");

    return new Response(JSON.stringify({ analysis: { final_report: finalReport } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error("[Agente On-Demand] Falha crítica:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});