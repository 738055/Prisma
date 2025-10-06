// supabase/functions/agent-create-monthly-baseline/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import { scrape } from '../_shared/connectors/serpapi.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        console.log("[Baseline Engine] Iniciando criação de linha de base mensal de preços.");
        const { data: cities, error: citiesError } = await supabaseAdmin.from('cities').select('id, name, state');
        if (citiesError) throw citiesError;

        const today = new Date();
        const scraped_date = today.toISOString().split('T')[0];
        const future_periods_in_days = [30, 60, 90]; // Analisa 1, 2 e 3 meses no futuro

        for (const city of cities) {
            console.log(`[Baseline Engine] Processando cidade: ${city.name}`);

            for (const days_ahead of future_periods_in_days) {
                const target_date = new Date();
                target_date.setDate(today.getDate() + days_ahead);
                const target_date_str = target_date.toISOString().split('T')[0];
                const checkout_date = new Date(target_date);
                checkout_date.setDate(target_date.getDate() + 1);
                const checkout_date_str = checkout_date.toISOString().split('T')[0];

                // --- Coleta de Preços de Hotéis (simulando múltiplas fontes) ---
                // Em um cenário real, cada um seria uma chamada a um conector diferente.
                const bookingData = await scrape({ engine: 'booking', ss: `${city.name}, ${city.state}`, checkin_date: target_date_str, checkout_date: checkout_date_str });
                const googleHotelsData = await scrape({ engine: 'google_hotels', q: `hotels in ${city.name}`, check_in_date: target_date_str, check_out_date: checkout_date_str });

                const competitorsToSave = [];

                if (bookingData.properties) {
                    bookingData.properties.filter((p: any) => p.title && p.price).forEach((p: any) => {
                        competitorsToSave.push({
                            city_id: city.id, hotel_name: p.title,
                            price: parseFloat(String(p.price).replace(/[^0-9.]+/g, '')),
                            scraped_date, target_date: target_date_str,
                            data_type: 'monthly_baseline', source: 'Booking.com'
                        });
                    });
                }
                if (googleHotelsData.properties) {
                     googleHotelsData.properties.filter((p: any) => p.name && p.price).forEach((p: any) => {
                        competitorsToSave.push({
                            city_id: city.id, hotel_name: p.name,
                            price: parseFloat(String(p.price).replace(/[^0-9.]+/g, '')),
                            scraped_date, target_date: target_date_str,
                            data_type: 'monthly_baseline', source: 'Google Hotels'
                        });
                    });
                }

                if(competitorsToSave.length > 0) {
                    await supabaseAdmin.from('competitor_data').insert(competitorsToSave);
                    console.log(`[Baseline Engine] ${competitorsToSave.length} preços de concorrentes salvos para ${city.name} em ${target_date_str}.`);
                }

                // --- Coleta de Preços de Voos ---
                 const flightData = await scrape({ engine: 'google_flights', departure_id: 'SAO', arrival_id: city.name, outbound_date: target_date_str });
                 if (flightData.best_flights || flightData.other_flights) {
                     const allFlights = (flightData.best_flights || []).concat(flightData.other_flights || []);
                     const flightsToSave = allFlights.filter((f: any) => f.price).map((f: any) => ({
                        city_id: city.id, scraped_date,
                        origin_city_name: f.departure_airport?.name || 'São Paulo',
                        travel_date: target_date_str, price: f.price,
                        source: 'Google Flights', data_type: 'monthly_baseline'
                     }));
                     
                     if(flightsToSave.length > 0) {
                        await supabaseAdmin.from('flight_data').insert(flightsToSave);
                        console.log(`[Baseline Engine] ${flightsToSave.length} preços de voos salvos para ${city.name} em ${target_date_str}.`);
                     }
                 }
            }
        }
        return new Response(JSON.stringify({ success: true, message: "Criação de linha de base mensal concluída." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error("[Baseline Engine] Falha crítica no ciclo:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
});