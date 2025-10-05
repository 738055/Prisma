// supabase/functions/agent-run-weekly-analysis/index.ts (VERSÃO VIGIA - CORRIGIDA)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');

// Ferramenta para raspar preços de hotéis para uma data futura
async function scrape_future_hotel_prices(city_name: string, check_in_date: string): Promise<any[]> {
    if (!SERPAPI_API_KEY) throw new Error("SERPAPI_API_KEY não configurada.");
    const check_out_date = new Date(check_in_date);
    check_out_date.setDate(check_out_date.getDate() + 1);
    const url = `https://serpapi.com/search.json?engine=google_hotels&q=hotels in ${encodeURIComponent(city_name)}&check_in_date=${check_in_date}&check_out_date=${check_out_date.toISOString().split('T')[0]}&api_key=${SERPAPI_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`[Vigia] Falha ao raspar preços de hotéis para ${check_in_date}`);
        return [];
    }
    const results = await response.json();
    return results.properties || [];
}

// Ferramenta para raspar preços de voos para uma data futura
async function scrape_future_flight_prices(arrival_city: string, outbound_date: string): Promise<any[]> {
    if (!SERPAPI_API_KEY) throw new Error("SERPAPI_API_KEY não configurada.");
    const return_date = new Date(outbound_date);
    return_date.setDate(return_date.getDate() + 5); // Uma estadia de 5 dias como referência
    const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=SAO&arrival_id=${encodeURIComponent(arrival_city)}&outbound_date=${outbound_date}&return_date=${return_date.toISOString().split('T')[0]}&api_key=${SERPAPI_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`[Vigia] Falha ao raspar preços de voos para ${outbound_date}`);
        return [];
    }
    const results = await response.json();
    return (results.best_flights || []).concat(results.other_flights || []);
}


serve(async (req) => {
    // **A CORREÇÃO CRUCIAL ESTÁ AQUI**
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("[Vigia] Iniciando ciclo de monitorização semanal de sinais futuros.");
        const { data: cities, error: citiesError } = await supabaseAdmin.from('cities').select('id, name, state');
        if (citiesError) throw citiesError;

        const today = new Date();
        const scraped_date = today.toISOString().split('T')[0];

        for (const city of cities) {
            console.log(`[Vigia] Processando cidade: ${city.name}`);
            const future_periods_in_days = [30, 60, 90]; 

            for (const days_ahead of future_periods_in_days) {
                const target_date = new Date();
                target_date.setDate(today.getDate() + days_ahead);
                const target_date_str = target_date.toISOString().split('T')[0];

                // 1. Recolher preços de concorrentes para a data futura
                const competitor_prices = await scrape_future_hotel_prices(`${city.name}, ${city.state}`, target_date_str);
                if (competitor_prices.length > 0) {
                    const competitorsToSave = competitor_prices.filter((c: any) => c.name && c.price).map((c: any) => ({
                        city_id: city.id, hotel_name: c.name,
                        price: parseFloat(String(c.price).replace(/[^0-9.]+/g, '')),
                        scraped_date: scraped_date, target_date: target_date_str,
                        data_type: 'weekly_baseline'
                    }));
                    await supabaseAdmin.from('competitor_data').insert(competitorsToSave);
                    console.log(`[Vigia] ${competitorsToSave.length} preços de concorrentes salvos para ${target_date_str}.`);
                }

                // 2. Recolher preços de voos para a data futura
                const flight_prices = await scrape_future_flight_prices(city.name, target_date_str);
                if (flight_prices.length > 0) {
                    const flightsToSave = flight_prices.filter((f: any) => f.price).map((f: any) => ({
                        city_id: city.id, scraped_date: scraped_date,
                        origin_city_name: f.departure_airport?.name || 'Origem Principal',
                        travel_date: target_date_str, avg_price: f.price,
                        source: 'Google Flights Baseline'
                    }));
                    await supabaseAdmin.from('flight_data').insert(flightsToSave);
                     console.log(`[Vigia] ${flightsToSave.length} preços de voos salvos para ${target_date_str}.`);
                }
            }
        }
        return new Response(JSON.stringify({ success: true, message: "Ciclo do Vigia concluído." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error("[Vigia] Falha crítica no ciclo:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
});