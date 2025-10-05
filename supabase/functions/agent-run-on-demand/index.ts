// supabase/functions/agent-run-on-demand/index.ts (VERSÃO ANALISTA ESTRATÉGICO)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

// --- CONFIGURAÇÃO ---
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');

// --- ARSENAL DE FERRAMENTAS DE ANÁLISE ESTRATÉGICA ---

// Ferramenta 1: Eventos e Congressos (Google Events API)
async function find_events(query: string): Promise<any> {
    console.log(`[Tool: Events] Query: "${query}"`);
    const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return (await res.json()).events_results || [];
}

// Ferramenta 2: Notícias e Contexto Local (Google News API via Google Search)
async function search_news(query: string): Promise<any> {
    console.log(`[Tool: News] Query: "${query}"`);
    const url = `https://serpapi.com/search.json?engine=google&tbm=nws&q=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return ((await res.json()).news_results || []).map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet, source: r.source.name }));
}

// Ferramenta 3: Preços de Voos (Google Flights API)
async function find_flight_prices(arrival_city: string, outbound_date: string, return_date: string): Promise<any> {
    console.log(`[Tool: Flights] Query: Flights to ${arrival_city}`);
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=SAO&arrival_id=${arrival_city}&outbound_date=${outbound_date}&return_date=${return_date}&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    const results = await res.json();
    return results.best_flights || results.other_flights || [];
}

// Ferramenta 4: Preços da Concorrência (Booking.com Search API)
async function scrape_competitor_prices_from_booking(city: string, checkin: string, checkout: string): Promise<any> {
    console.log(`[Tool: Booking.com] Query: Prices in ${city}`);
    const url = `https://serpapi.com/search.json?engine=booking&ss=${encodeURIComponent(city)}&checkin_date=${checkin}&checkout_date=${checkout}&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return (await res.json()).properties || [];
}

// Ferramenta 5: Interesse de Pesquisa (Google Trends API)
async function get_search_interest_trends(keyword: string): Promise<any> {
    console.log(`[Tool: Trends] Query: "${keyword}"`);
    const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(keyword)}&date=today 3-m&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return (await res.json()).interest_over_time || {};
}

// Ferramenta 6: Buzz em Vídeo (YouTube Search API)
async function search_youtube_for_buzz(query: string): Promise<any> {
    console.log(`[Tool: YouTube] Query: "${query}"`);
    const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${SERPAPI_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return ((await res.json()).video_results || []).map((v: any) => ({ title: v.title, link: v.link, snippet: v.snippet, published_date: v.published_date }));
}

// Ferramenta 7: Pontos de Interesse Locais (Google Maps API)
async function find_local_points_of_interest(query: string, city: string): Promise<any> {
    console.log(`[Tool: Maps] Query: "${query}" in ${city}`);
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&ll=@-25.5428, -54.5824,15z&type=search&api_key=${SERPAPI_API_KEY}`; // Coordenadas de Foz como exemplo
    const res = await fetch(url);
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return ((await res.json()).local_results || []).map((p: any) => ({ name: p.title, address: p.address, rating: p.rating, type: p.type }));
}

// Função de Sumarização (essencial para o funcionamento)
async function summarize_data(data: any, topic: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: `Summarize the key findings from the following data about ${topic}. Focus on names, dates, prices, and key takeaways.` },
            { role: 'user', content: JSON.stringify(data).substring(0, 30000) }
        ],
        temperature: 0.1,
    });
    return response.choices[0].message.content!;
}


// --- LÓGICA PRINCIPAL DO AGENTE ANALISTA ESTRATÉGICO ---
serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { cityId, startDate, endDate, userId } = await req.json();
        const { data: city } = await supabaseAdmin.from('cities').select('name, state').eq('id', cityId).single();
        if (!city) throw new Error("Cidade não encontrada.");
        const cityName = `${city.name}, ${city.state}`;

        const tools: ChatCompletionTool[] = [
            { type: 'function', function: { name: 'find_events', description: 'Busca eventos, feiras e congressos.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
            { type: 'function', function: { name: 'search_news', description: 'Busca notícias recentes sobre um tópico.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
            { type: 'function', function: { name: 'find_flight_prices', description: 'Busca preços de voos para um destino.', parameters: { type: 'object', properties: { arrival_city: { type: 'string' }, outbound_date: { type: 'string' }, return_date: { type: 'string' } }, required: ['arrival_city', 'outbound_date', 'return_date'] } } },
            { type: 'function', function: { name: 'scrape_competitor_prices_from_booking', description: 'Raspa preços de hotéis do Booking.com.', parameters: { type: 'object', properties: { city: { type: 'string' }, checkin: { type: 'string' }, checkout: { type: 'string' } }, required: ['city', 'checkin', 'checkout'] } } },
            { type: 'function', function: { name: 'get_search_interest_trends', description: 'Obtém dados do Google Trends para uma palavra-chave.', parameters: { type: 'object', properties: { keyword: { type: 'string' } }, required: ['keyword'] } } },
            { type: 'function', function: { name: 'search_youtube_for_buzz', description: 'Busca vídeos no YouTube sobre um tópico.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
            { type: 'function', function: { name: 'find_local_points_of_interest', description: 'Encontra locais de interesse (restaurantes, atrações) no Google Maps.', parameters: { type: 'object', properties: { query: { type: 'string' }, city: { type: 'string' } }, required: ['query', 'city'] } } },
        ];

        const messages: ChatCompletionMessageParam[] = [{
            role: 'system',
            content: `Você é um Analista de Mercado Estratégico para o setor hoteleiro. Sua missão é construir um dossiê preditivo sobre ${cityName} para o período de ${startDate} a ${endDate}.
            Siga um processo de 3 fases:
            1. **Varredura Inicial:** Comece com uma análise ampla. Use as ferramentas para encontrar os principais eventos, notícias e a tendência geral de pesquisa para "hotéis em ${cityName}".
            2. **Aprofundamento:** Com base nos achados da Fase 1, aprofunde a investigação. Se encontrar um grande congresso, pesquise por ele no YouTube e no Google News para avaliar o "buzz". Verifique os preços de voos e concorrentes para as datas do evento. Use o Google Maps para encontrar restaurantes ou atrações próximas.
            3. **Síntese:** Após recolher todos os dados, aguarde a minha instrução final para sintetizar tudo num relatório acionável.`
        }];
        
        // Loop de Execução e Resumo
        let loopCount = 0;
        let response = await openai.chat.completions.create({ model: 'gpt-4o', messages, tools, tool_choice: 'auto' });

        while (response.choices[0].message.tool_calls && loopCount < 15) {
            loopCount++;
            const toolCalls = response.choices[0].message.tool_calls;
            messages.push(response.choices[0].message);
            
            for (const toolCall of toolCalls) {
                const args = JSON.parse(toolCall.function.arguments);
                let result: any;
                
                switch (toolCall.function.name) {
                    case 'find_events': result = await find_events(args.query); break;
                    case 'search_news': result = await search_news(args.query); break;
                    case 'find_flight_prices': result = await find_flight_prices(args.arrival_city, args.outbound_date, args.return_date); break;
                    case 'scrape_competitor_prices_from_booking': result = await scrape_competitor_prices_from_booking(args.city, args.checkin, args.checkout); break;
                    case 'get_search_interest_trends': result = await get_search_interest_trends(args.keyword); break;
                    case 'search_youtube_for_buzz': result = await search_youtube_for_buzz(args.query); break;
                    case 'find_local_points_of_interest': result = await find_local_points_of_interest(args.query, args.city); break;
                    default: result = { error: "Ferramenta desconhecida." };
                }

                const summary = await summarize_data(result, toolCall.function.name);
                messages.push({ tool_call_id: toolCall.id, role: 'tool', name: toolCall.function.name, content: summary });
                console.log(`[Strategic Analyst] Summary for ${toolCall.function.name}: ${summary}`);
            }
            response = await openai.chat.completions.create({ model: 'gpt-4o', messages, tools, tool_choice: 'auto' });
        }
        messages.push(response.choices[0].message);
        
        // Geração do Relatório Final
        const finalAnalysisPrompt = `
            Excelente trabalho de investigação. Agora, conecte todos os pontos dos resumos que você coletou.
            Crie um relatório em Markdown que seja um verdadeiro briefing estratégico para um hoteleiro.
            Identifique as maiores oportunidades e riscos. Seja preditivo. Exemplo de insight:
            "**Oportunidade Crítica - Congresso de Cardiologia (15-18 de Out):** Nossas ferramentas confirmam este evento (encontrado na busca de eventos) e a busca no YouTube mostra vídeos de edições passadas com alta participação. O Google Trends revela um aumento de 60% nas buscas por "restaurantes perto do Centro de Convenções" (encontrado via Google Maps). Os voos de São Paulo para essas datas já estão 35% mais caros. **Ação Imediata:** Aumente a tarifa da sua suíte em 25% e crie um pacote "Congresso" com um guia de restaurantes locais."
        `;
        messages.push({ role: 'user', content: finalAnalysisPrompt });
        
        const finalResponse = await openai.chat.completions.create({ model: 'gpt-4o', messages, max_tokens: 3000 });
        const finalReport = finalResponse.choices[0].message.content!;

        // Persistência no Banco de Dados (simplificada para o relatório final)
        await supabaseAdmin.from('market_analysis_reports').insert({ user_id: userId, city_id: cityId, start_date: startDate, end_date: endDate, report_markdown: finalReport, structured_data: { summarized_history: messages } });

        return new Response(JSON.stringify({ analysis: { final_report: finalReport } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error) {
        console.error("[Strategic Analyst] Falha crítica:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});