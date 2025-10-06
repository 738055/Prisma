// supabase/functions/agent-analyze-social-buzz/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// --- Simulação de uma API externa de eventos (Ex: PredictHQ) ---
async function fetchHighImpactEvents(cityName: string, apiKey: string | undefined) {
    console.log(`[Vigia Social] Buscando eventos de alto impacto para ${cityName}...`);
    // Em um cenário real, esta função faria uma chamada a uma API como a PredictHQ.
    // Para este exemplo, retornamos dados fictícios de alto impacto.
    if (cityName.toLowerCase().includes('rio de janeiro')) {
        return [{
            title: "Show Internacional da Artista Pop",
            impact_score: 9,
            keywords: ["show", "internacional", "música"],
            date: new Date(new Date().setDate(new Date().getDate() + 50)).toISOString().split('T')[0]
        }];
    }
    if (cityName.toLowerCase().includes('foz do iguaçu')) {
         return [{
            title: "Congresso Latino-Americano de Turismo",
            impact_score: 8,
            keywords: ["congresso", "turismo", "negócios"],
            date: new Date(new Date().setDate(new Date().getDate() + 35)).toISOString().split('T')[0]
        }];
    }
    return [];
}

// --- Simulação de uma API externa de Social Listening (Ex: Brand24) ---
async function fetchSocialBuzz(cityName: string, apiKey: string | undefined) {
    console.log(`[Vigia Social] Monitorando buzz social para ${cityName}...`);
     if (cityName.toLowerCase().includes('gramado')) {
        return [{
            content: "A procura por 'ingressos natal luz gramado' disparou no Twitter essa semana!",
            source: "twitter",
            volume: 1200, // Número de menções
            keywords: ["natal luz", "gramado", "ingressos"],
            date: new Date(new Date().setDate(new Date().getDate() + 80)).toISOString().split('T')[0]
        }];
    }
    return [];
}


serve(async (req) => {
    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        console.log("[Vigia Social] Iniciando ciclo de monitorização de buzz social.");
        const { data: cities, error: citiesError } = await supabaseAdmin.from('cities').select('id, name');
        if (citiesError) throw citiesError;

        const PREDICTHQ_API_KEY = Deno.env.get('PREDICTHQ_API_KEY');
        const SOCIAL_LISTENING_API_KEY = Deno.env.get('SOCIAL_LISTENING_API_KEY');

        for (const city of cities) {
            const highImpactEvents = await fetchHighImpactEvents(city.name, PREDICTHQ_API_KEY);
            const socialBuzzMentions = await fetchSocialBuzz(city.name, SOCIAL_LISTENING_API_KEY);
            const signalsToSave = [];

            for (const event of highImpactEvents) {
                signalsToSave.push({
                    city_id: city.id, signal_date: event.date,
                    source: 'predicthq_event', content: event.title,
                    impact_score: event.impact_score, related_keywords: event.keywords
                });
            }

            for (const buzz of socialBuzzMentions) {
                 signalsToSave.push({
                    city_id: city.id, signal_date: buzz.date,
                    source: buzz.source, content: buzz.content,
                    impact_score: Math.min(10, Math.ceil(buzz.volume / 150)), // Normaliza o impacto
                    related_keywords: buzz.keywords
                });
            }

            if (signalsToSave.length > 0) {
                 // Usando 'upsert' para não duplicar sinais idênticos
                 const { error } = await supabaseAdmin.from('social_buzz_signals').upsert(signalsToSave, { onConflict: 'city_id,signal_date,content' });
                 if (error) console.error(`[Vigia Social] Erro ao salvar sinais para ${city.name}:`, error.message);
                 else console.log(`[Vigia Social] ${signalsToSave.length} novos sinais de buzz salvos para ${city.name}.`);
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Ciclo do Vigia Social concluído." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error("[Vigia Social] Falha crítica no ciclo:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
});