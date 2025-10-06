// supabase/functions/collector-booking-api/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import { fetchHotelPricesFromBookingAPI } from '../_shared/connectors/booking.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Mapeamento de cidades do nosso sistema para o city_id da Booking.com
// Em um sistema de produção, isso viria de uma tabela no banco de dados.
const cityMapping: { [key: string]: number } = {
    'foz-iguacu': -642335,
    'rio-janeiro': -668798,
    'gramado': -644349
};

serve(async (req) => {
    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        console.log("[Coletor Booking API] Iniciando ciclo de coleta de dados de alta fidelidade.");

        const { data: cities, error } = await supabaseAdmin
            .from('cities')
            .select('id, slug');

        if (error) throw error;
        
        const snapshotsToSave = [];
        const today = new Date();
        const datesToScan = [15, 45, 75]; // Coleta para 15, 45 e 75 dias no futuro

        for (const city of cities) {
            const bookingCityId = cityMapping[city.slug];
            if (!bookingCityId) {
                console.warn(`[Coletor Booking API] Mapeamento não encontrado para a cidade: ${city.slug}`);
                continue;
            }

            for (const daysAhead of datesToScan) {
                const checkinDate = new Date();
                checkinDate.setDate(today.getDate() + daysAhead);
                const checkoutDate = new Date();
                checkoutDate.setDate(today.getDate() + daysAhead + 1);
                
                const checkinStr = checkinDate.toISOString().split('T')[0];
                const checkoutStr = checkoutDate.toISOString().split('T')[0];

                const priceData = await fetchHotelPricesFromBookingAPI(bookingCityId, checkinStr, checkoutStr);

                for (const hotel of priceData) {
                     snapshotsToSave.push({
                        city_id: city.id,
                        provider_hotel_id: hotel.hotel_id,
                        hotel_name: hotel.hotel_name,
                        source: "Booking.com Demand API",
                        target_date: checkinStr,
                        price: hotel.price,
                        currency: hotel.currency,
                        metadata: { review_score: hotel.review_score }
                    });
                }
                // Pausa para respeitar os limites da API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (snapshotsToSave.length > 0) {
            const { error: insertError } = await supabaseAdmin.from('api_data_snapshots').insert(snapshotsToSave);
            if (insertError) throw insertError;
            console.log(`[Coletor Booking API] ${snapshotsToSave.length} novos snapshots da API do Booking foram salvos.`);
        }

        return new Response(JSON.stringify({ success: true, snapshots_saved: snapshotsToSave.length }), { headers: corsHeaders });

    } catch (error) {
        console.error("[Coletor Booking API] Falha crítica no ciclo:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});