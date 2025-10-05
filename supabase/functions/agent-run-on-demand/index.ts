// supabase/functions/agent-run-on-demand/index.ts (VERSÃO FINAL E ROBUSTA)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');

async function scrape(engine: string, params: Record<string, string>): Promise<any> {
    const endpoint = new URL(`https://serpapi.com/search.json`);
    endpoint.searchParams.append('engine', engine);
    for (const key in params) {
        endpoint.searchParams.append(key, params[key]);
    }
    endpoint.searchParams.append('api_key', SERPAPI_API_KEY!);
    const response = await fetch(endpoint);
    if (!response.ok) {
        console.error(`[Scrape Error] Engine: ${engine}, Status: ${response.status}`);
        return { error: `API Error: ${response.status}` };
    }
    return await response.json();
}

serve(async (req) => {
    // **A CORREÇÃO CRUCIAL ESTÁ AQUI**
    // Lida com o pedido de sondagem CORS (preflight) antes de qualquer outra lógica.
    if (req.method === 'OPTIONS') {
        console.log("Handled OPTIONS request");
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Garante que só tentamos ler o corpo se o método for POST
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        const body = await req.json();
        const { cityId, startDate, endDate, userId } = body;

        if (!cityId || !startDate || !endDate || !userId) {
            throw new Error("Parâmetros ausentes no corpo do pedido.");
        }

        const { data: city } = await supabaseAdmin.from('cities').select('name, state').eq('id', cityId).single();
        if (!city) throw new Error("Cidade não encontrada.");
        const cityName = `${city.name}, ${city.state}`;

        console.log(`[Detetive] Iniciando Análise Cruzada para ${cityName}`);

        // FASE 1: RECOLHA DE SINAIS EM TEMPO REAL
        const [events_realtime, news_realtime, competitors_realtime_raw, flights_realtime_raw] = await Promise.all([
            scrape('google_events', { q: `eventos em ${cityName} de ${startDate} a ${endDate}` }),
            scrape('google', { tbm: 'nws', q: `turismo ${cityName} ${startDate}` }),
            scrape('booking', { ss: cityName, checkin_date: startDate, checkout_date: endDate }),
            scrape('google_flights', { departure_id: 'SAO', arrival_id: cityName, outbound_date: startDate, return_date: endDate })
        ]);

        const competitors_realtime = (competitors_realtime_raw.properties || [])
            .filter((p: any) => p.price)
            .map((p: any) => ({ name: p.title, price: parseFloat(String(p.price).replace(/[^0-9.]+/g, '')) }));
            
        const flights_realtime_prices = (flights_realtime_raw.best_flights || [])
            .concat(flights_realtime_raw.other_flights || [])
            .filter((f: any) => f.price)
            .map((f: any) => f.price);

        // FASE 2: RECOLHA DA LINHA DE BASE HISTÓRICA (DO VIGIA)
        const { data: competitors_baseline_raw } = await supabaseAdmin.from('competitor_data').select('hotel_name, price').eq('city_id', cityId).eq('target_date', startDate).eq('data_type', 'weekly_baseline').order('scraped_date', { ascending: false }).limit(100);
        const { data: flights_baseline_raw } = await supabaseAdmin.from('flight_data').select('avg_price').eq('city_id', cityId).eq('travel_date', startDate).eq('source', 'Google Flights Baseline').order('scraped_date', { ascending: false }).limit(20);

        // CÁLCULO DAS MÉDIAS PARA COMPARAÇÃO
        const avg_competitor_baseline = (competitors_baseline_raw || []).reduce((acc, c) => acc + c.price, 0) / (competitors_baseline_raw?.length || 1);
        const avg_flight_baseline = (flights_baseline_raw || []).reduce((acc, f) => acc + f.avg_price, 0) / (flights_baseline_raw?.length || 1);
        const avg_competitor_realtime = competitors_realtime.reduce((acc, c) => acc + c.price, 0) / (competitors_realtime.length || 1);
        const avg_flight_realtime = flights_realtime_prices.reduce((acc, p) => acc + p, 0) / (flights_realtime_prices.length || 1);

        // FASE 3: SÍNTESE E ANÁLISE CRUZADA PELA IA
        const messages: ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `Você é um Analista de Mercado Hoteleiro de elite. Sua missão é resolver o problema de pequenos hoteleiros que operam "às cegas", ligando os pontos entre diferentes sinais de mercado para prever a demanda. Você tem dados em tempo real e uma linha de base histórica. Sua tarefa é comparar os dois e gerar um insight acionável.`
            },
            {
                role: 'user',
                content: `
                **Dossiê de Mercado para ${cityName} (Data da Análise: ${startDate})**
                **1. Comparativo de Preços (Concorrência):**
                - Preço Médio da Semana Passada (Linha de Base): R$ ${avg_competitor_baseline.toFixed(2)}
                - Preço Médio Hoje (Tempo Real): R$ ${avg_competitor_realtime.toFixed(2)}
                **2. Comparativo de Preços (Voos de São Paulo):**
                - Preço Médio da Semana Passada (Linha de Base): R$ ${avg_flight_baseline.toFixed(2)}
                - Preço Médio Hoje (Tempo Real): R$ ${avg_flight_realtime.toFixed(2)}
                **3. Eventos Confirmados no Período:**
                ${JSON.stringify((events_realtime.events_results || [{title: "Nenhum evento de grande porte encontrado."}]).slice(0, 5), null, 2)}
                **4. Notícias Relevantes Recentes:**
                ${JSON.stringify((news_realtime.news_results || [{title: "Sem notícias de grande impacto."}]).slice(0, 3), null, 2)}
                **Sua Análise Cruzada e Recomendações:**
                Com base na **comparação** dos dados acima, ligue os pontos. Houve um aumento significativo nos preços dos concorrentes ou dos voos? Se sim, porquê? Existe alguma notícia ou evento que justifique essa mudança? Qual é o indicativo que estes sinais juntos estão a dar? (Ex: "Os preços dos concorrentes subiram 20% E os voos estão 15% mais caros, coincidindo com o anúncio do 'Congresso de Medicina'. Isto é um forte indicativo de alta demanda reprimida.") Termine com um **Alerta e uma Ação Recomendada** clara e direta para o pequeno hoteleiro.
                `
            }
        ];

        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, max_tokens: 2048 });
        const finalReport = response.choices[0].message.content!;

        const responseData = {
            analysis: {
                final_report: finalReport
            },
            structured_data: {
                report_markdown: finalReport,
                avg_competitor_realtime: avg_competitor_realtime,
                avg_competitor_baseline: avg_competitor_baseline,
                avg_flight_realtime: avg_flight_realtime,
                avg_flight_baseline: avg_flight_baseline,
                top_events: (events_realtime.events_results || []).slice(0, 3),
                top_news: (news_realtime.news_results || []).slice(0, 3)
            }
        };

        await supabaseAdmin.from('market_analysis_reports').insert({
            user_id: userId, city_id: cityId, start_date: startDate, end_date: endDate,
            report_markdown: finalReport,
            structured_data: responseData.structured_data
        });

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error) {
        console.error("[Detetive] Falha crítica:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});