// supabase/functions/agent-run-on-demand/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';
import { scrape } from '../_shared/connectors/serpapi.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Função auxiliar para calcular média de um array de objetos
const calculateAverage = (items: any[], key: string) => {
    if (!items || items.length === 0) return 0;
    const total = items.reduce((acc, item) => acc + (item[key] || 0), 0);
    return total / items.length;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        const { cityId, startDate, endDate, userId } = await req.json();
        if (!cityId || !startDate || !endDate || !userId) { throw new Error("Parâmetros ausentes no corpo do pedido."); }

        const { data: city } = await supabaseAdmin.from('cities').select('name, state').eq('id', cityId).single();
        if (!city) throw new Error("Cidade não encontrada.");
        const cityName = `${city.name}, ${city.state}`;

        console.log(`[Detetive V2] Iniciando Análise Aprofundada para ${cityName} de ${startDate} a ${endDate}`);

        // 1. BUSCAR DADOS EM TEMPO REAL
        const [competitors_realtime_raw, flights_realtime_raw, social_buzz_signals, news_realtime] = await Promise.all([
            scrape({ engine: 'booking', ss: cityName, checkin_date: startDate, checkout_date: endDate }),
            scrape({ engine: 'google_flights', departure_id: 'SAO', arrival_id: cityName, outbound_date: startDate }),
            supabaseAdmin.from('social_buzz_signals').select('content, impact_score, source').eq('city_id', cityId).gte('signal_date', startDate).lte('signal_date', endDate),
            scrape({ engine: 'google', tbm: 'nws', q: `turismo ${cityName}` })
        ]);

        // 2. BUSCAR DADOS DE LINHA DE BASE (DO INÍCIO DO MÊS)
        const { data: competitors_baseline_raw } = await supabaseAdmin.from('competitor_data').select('price, source').eq('city_id', cityId).eq('target_date', startDate).eq('data_type', 'monthly_baseline');

        // 3. PROCESSAR E ESTRUTURAR OS DADOS
        const competitors_realtime = (competitors_realtime_raw.properties || []).map((p: any) => ({ price: parseFloat(String(p.price).replace(/[^0-9.]+/g, '')), source: 'Booking.com' }));
        const flights_realtime = (flights_realtime_raw.best_flights || []).concat(flights_realtime_raw.other_flights || []).map((f: any) => ({ price: f.price, source: 'Google Flights' }));

        const avg_competitor_realtime = calculateAverage(competitors_realtime, 'price');
        const avg_flight_realtime = calculateAverage(flights_realtime, 'price');
        const avg_competitor_baseline = calculateAverage(competitors_baseline_raw, 'price');
        
        const structured_data = {
            city: cityName,
            period: { start: startDate, end: endDate },
            avg_competitor_realtime,
            avg_competitor_baseline,
            avg_flight_realtime,
            avg_flight_baseline: 0, // Linha de base de voos pode ser adicionada no futuro
            top_events: (social_buzz_signals.data || []).filter(s => s.source === 'predicthq_event').map(e => ({ title: e.content })),
            social_buzz_signals: social_buzz_signals.data || [],
            top_news: (news_realtime.news_results || []).slice(0, 3).map((n: any) => ({ title: n.title, source: n.source })),
        };

        // 4. CONSTRUIR O PROMPT PARA A IA
        const messages: ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `Você é o Prisma, um Analista de Mercado Hoteleiro de elite. Sua missão é conectar sinais de mercado óbvios (preços) com sinais de demanda latente (buzz social, eventos, notícias) para gerar uma previsão de demanda e recomendações acionáveis. Seja direto, confiante e foque em dados.`
            },
            {
                role: 'user',
                content: `
                **Dossiê de Inteligência de Mercado**
                - **Destino:** ${cityName}
                - **Período de Análise:** ${startDate} a ${endDate}

                **1. Análise de Preços (Sinais de Mercado):**
                - **Concorrência (Hotéis):** O preço médio hoje é **R$ ${avg_competitor_realtime.toFixed(2)}**. A linha de base para este período, medida no início do mês, era de **R$ ${avg_competitor_baseline.toFixed(2)}**.
                - **Demanda Aérea (Voos de SP):** O preço médio hoje é **R$ ${avg_flight_realtime.toFixed(2)}**.

                **2. Análise de Demanda (Sinais Latentes):**
                - **Eventos e Buzz Social Detectados:**
                ${JSON.stringify(structured_data.social_buzz_signals.length > 0 ? structured_data.social_buzz_signals : [{content: "Nenhum sinal de buzz social de alto impacto detectado."}], null, 2)}
                - **Principais Notícias de Turismo:**
                ${JSON.stringify(structured_data.top_news.length > 0 ? structured_data.top_news : [{title: "Nenhuma notícia de grande impacto no turismo local."}], null, 2)}

                **Sua Tarefa:**
                Com base na **combinação de todos os dados acima**, forneça uma análise concisa em Markdown.
                Comece com um **Diagnóstico Geral** (Ex: "A demanda para o período se apresenta ALTA e com tendência de AQUECIMENTO.").
                Depois, justifique em **Pontos-Chave**, conectando os sinais (Ex: "A alta de 20% nos preços dos concorrentes é sustentada pelo 'Congresso de TI' (impacto 8/10), que está gerando alto buzz nas redes.").
                Finalize com uma **Recomendação Estratégica** clara e direta para um pequeno hoteleiro.
                `
            }
        ];

        // 5. CHAMAR A IA E SALVAR O RELATÓRIO
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, temperature: 0.4, max_tokens: 2048 });
        const finalReport = response.choices[0].message.content!;

        await supabaseAdmin.from('market_analysis_reports').insert({
            user_id: userId, city_id: cityId, start_date: startDate, end_date: endDate,
            report_markdown: finalReport,
            structured_data: structured_data
        });

        return new Response(JSON.stringify({ analysis: { final_report: finalReport }, structured_data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error) {
        console.error("[Detetive V2] Falha crítica na análise:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});