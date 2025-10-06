// supabase/functions/engine-market-analyzer/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import OpenAI from 'https://esm.sh/openai@4.19.0';
import type { ChatCompletionMessageParam } from 'https://esm.sh/openai@4.19.0/resources/chat/completions';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
    // --- BLOCO TRY/CATCH GLOBAL ---
    // Este bloco agora engloba TUDO, incluindo a inicialização dos clientes.
    // Isso garante que QUALQUER erro, mesmo de inicialização, seja capturado e retornado como um JSON.
    try {
        if (req.method === 'OPTIONS') { 
            return new Response('ok', { headers: corsHeaders }); 
        }

        // --- VERIFICAÇÃO ROBUSTA DAS VARIÁVEIS DE AMBIENTE ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
            throw new Error("Configuração incompleta no servidor: Uma ou mais variáveis de ambiente (Supabase URL, Service Key, OpenAI Key) não foram definidas.");
        }
        
        // Inicialização segura dos clientes DENTRO do bloco try
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const { cityId, targetDate, userId } = await req.json();
        if (!cityId || !targetDate || !userId) { 
            throw new Error("Parâmetros ausentes: cityId, targetDate e userId são obrigatórios."); 
        }

        const { data: city } = await supabaseAdmin.from('cities').select('name').eq('id', cityId).single();
        if (!city) throw new Error("Cidade não encontrada.");

        console.log(`[Motor de Análise] Orquestrando dossiê para ${city.name} na data ${targetDate}`);

        const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
        const dateRangeStart = new Date(new Date(targetDate).setDate(new Date(targetDate).getDate() - 5)).toISOString();
        const dateRangeEnd = new Date(new Date(targetDate).setDate(new Date(targetDate).getDate() + 5)).toISOString();

        const [priceHistoryScraped, priceHistoryAPI, socialSignals] = await Promise.all([
            supabaseAdmin.from('price_snapshots').select('entity_name, price, scraped_at, source').eq('city_id', cityId).eq('target_date', targetDate).gte('scraped_at', sevenDaysAgo),
            supabaseAdmin.from('api_data_snapshots').select('hotel_name, price, scraped_at, source, metadata').eq('city_id', cityId).eq('target_date', targetDate).gte('scraped_at', sevenDaysAgo),
            supabaseAdmin.from('social_buzz_signals').select('content, impact_score, source').eq('city_id', cityId).gte('signal_date', dateRangeStart).lte('signal_date', dateRangeEnd)
        ]);
        
        if (priceHistoryScraped.error || priceHistoryAPI.error || socialSignals.error) {
            throw new Error(`Falha ao consultar dados de inteligência: ${priceHistoryScraped.error?.message || priceHistoryAPI.error?.message || socialSignals.error?.message}`);
        }

        if ((priceHistoryScraped.data?.length || 0) === 0 && (priceHistoryAPI.data?.length || 0) === 0) {
            throw new Error("Não há dados de preços históricos suficientes para esta data. Os coletores automáticos podem ainda não ter dados para um futuro tão distante. Tente uma data mais próxima.");
        }

        const promptData = {
            city: city.name,
            targetDate: targetDate,
            scrapedPriceEvolution: priceHistoryScraped.data || [],
            apiPriceEvolution: priceHistoryAPI.data || [],
            socialSignals: socialSignals.data || []
        };
        
        const messages: ChatCompletionMessageParam[] = [
             {
                role: 'system',
                content: `Você é o Prisma, um sistema de inteligência de mercado. Sua função é receber múltiplos conjuntos de dados brutos, cruzá-los e sintetizá-los em um relatório analítico para um gestor de hotel. Você deve agir como um analista de dados sênior, focando em correlações e insights acionáveis.`
            },
            {
                role: 'user',
                content: `
                **Dossiê de Mercado para ${promptData.city} - Foco em ${promptData.targetDate}**
                **Conjunto de Dados 1: Varredura de Mercado (SerpApi - Radar Amplo)**
                *Dados de preços para a diária de ${promptData.targetDate}, coletados via scraping nos últimos 7 dias.*
                \`\`\`json
                ${JSON.stringify(promptData.scrapedPriceEvolution, null, 2)}
                \`\`\`
                **Conjunto de Dados 2: Dados de Parceiros (APIs Diretas - Precisão)**
                *Dados de preços para a diária de ${promptData.targetDate}, coletados via APIs de parceiros nos últimos 7 dias.*
                \`\`\`json
                ${JSON.stringify(promptData.apiPriceEvolution, null, 2)}
                \`\`\`
                **Conjunto de Dados 3: Sinais de Demanda Latente**
                *Eventos, notícias e buzz social detectados próximos à data alvo.*
                \`\`\`json
                ${JSON.stringify(promptData.socialSignals, null, 2)}
                \`\`\`
                **Sua Análise:**
                Execute uma análise cruzada completa dos três conjuntos de dados.
                1.  **Síntese da Evolução dos Preços:** Combine os dados do "Radar Amplo" e da "Precisão" para descrever o comportamento do mercado. Quem está liderando os aumentos? Há divergência entre as fontes?
                2.  **Análise de Causa e Efeito:** Correlacione a evolução dos preços com os "Sinais de Demanda". O aumento dos preços é justificado por algum evento de alto impacto? O buzz social antecipou a subida de preços?
                3.  **Diagnóstico e Nível de Confiança:** Forneça um diagnóstico claro (Ex: "Cenário de Alta Demanda com Forte Pressão de Compra") e um nível de confiança na sua análise (Baixo, Médio, Alto), baseado na consistência entre os conjuntos de dados.
                4.  **Recomendação Estratégica:** Crie uma recomendação final, detalhada e acionável para o hoteleiro.
                Formate sua resposta em Markdown.
                `
            }
        ];
        
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, temperature: 0.3, max_tokens: 3072 });
        const finalReport = response.choices[0].message.content;

        if (!finalReport || finalReport.trim().length < 20) {
            throw new Error("A IA não conseguiu gerar uma análise conclusiva com os dados disponíveis.");
        }

        const { error: saveError } = await supabaseAdmin.from('market_analysis_reports').insert({
            user_id: userId, city_id: cityId, start_date: targetDate, end_date: targetDate,
            report_markdown: finalReport, structured_data: promptData
        });

        if (saveError) {
            console.error("[Motor de Análise] Erro ao salvar o relatório:", saveError);
        } else {
            console.log(`[Motor de Análise] Relatório para ${city.name} em ${targetDate} salvo.`);
        }

        return new Response(JSON.stringify({ analysis: { final_report: finalReport }, structured_data: promptData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error) {
        // Este bloco 'catch' agora captura TUDO, incluindo erros de inicialização.
        console.error("[Motor de Análise] Falha crítica:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});