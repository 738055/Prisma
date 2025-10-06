// supabase/functions/collector-daily-prices/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@^2';
import { scrape } from '../_shared/connectors/serpapi.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function fetchHotelPrice(hotelName: string, checkinDate: string, cityName: string): Promise<{price: number | null, source: string}> {
    try {
        const checkoutDate = new Date(new Date(checkinDate).getTime() + 86400000).toISOString().split('T')[0];
        const googleResult = await scrape({
            engine: 'google_hotels',
            q: `${hotelName}, ${cityName}`,
            check_in_date: checkinDate,
            check_out_date: checkoutDate
        });
        if (googleResult.properties && googleResult.properties[0] && googleResult.properties[0].price) {
            const price = parseFloat(String(googleResult.properties[0].price).replace(/[^0-9.]+/g, ''));
            return { price, source: 'SerpApi - Google Hotels' };
        }
    } catch(e) { console.error(`Erro ao buscar no Google Hotels para ${hotelName}:`, e.message); }
    return { price: null, source: 'failed' };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

    try {
        console.log("[Coletor Diário] Iniciando varredura de preços via SerpApi.");
        
        const { data: competitors, error: compError } = await supabaseAdmin
            .from('tracked_competitors')
            .select(`*, cities (name)`)
            .eq('is_active', true);

        if (compError) throw compError;
        if (!competitors || competitors.length === 0) {
            return new Response(JSON.stringify({ message: "Nenhum concorrente ativo para monitorar." }), { headers: corsHeaders });
        }

        console.log(`[Coletor Diário] ${competitors.length} hotéis para monitorar.`);
        const snapshotsToSave = [];
        const today = new Date();
        const datesToScan = [7, 15, 30, 60, 90];

        for (const competitor of competitors) {
            for (const daysAhead of datesToScan) {
                const targetDate = new Date();
                targetDate.setDate(today.getDate() + daysAhead);
                const targetDateStr = targetDate.toISOString().split('T')[0];
                const result = await fetchHotelPrice(competitor.hotel_name, targetDateStr, competitor.cities!.name);
                if (result.price !== null) {
                    snapshotsToSave.push({
                        city_id: competitor.city_id,
                        entity_name: competitor.hotel_name,
                        entity_type: 'hotel',
                        source: result.source,
                        target_date: targetDateStr,
                        price: result.price,
                        metadata: { star_rating: competitor.star_rating }
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 2000)); 
            }
        }
        
        if (snapshotsToSave.length > 0) {
            const { error } = await supabaseAdmin.from('price_snapshots').insert(snapshotsToSave);
            if (error) throw error;
            console.log(`[Coletor Diário] ${snapshotsToSave.length} novos snapshots de preços (SerpApi) salvos.`);
        }

        return new Response(JSON.stringify({ success: true, snapshots_saved: snapshotsToSave.length }), { headers: corsHeaders });

    } catch (error) {
        console.error("[Coletor Diário] Falha crítica:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});