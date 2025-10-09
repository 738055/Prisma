import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORREÇÃO: Cabeçalhos CORS para permitir o acesso do seu frontend ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, mude para 'http://localhost:5173' ou o seu domínio
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Função para uma pausa controlada
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para calcular médias
const calculateAverage = (items: any[], key: string): number => {
  if (!items || items.length === 0) return 0;
  const validItems = items.map(item => parseFloat(String(item[key] || '0').replace(',', '.'))).filter(v => !isNaN(v));
  if (validItems.length === 0) return 0;
  return validItems.reduce((sum, v) => sum + v, 0) / validItems.length;
};

serve(async (req) => {
  // --- CORREÇÃO: Lidar com o "preflight request" do navegador ---
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { cityId, userId, periodInDays } = await req.json();
    if (!cityId || !userId) throw new Error("cityId e userId são obrigatórios.");

    // 1. Obter dados da cidade
    const { data: city, error: cityError } = await supabaseClient.from('cities').select('name, state, booking_com_dest_id, iata_code').eq('id', cityId).single();
    if (cityError) throw cityError;

    const cityName = `${city.name}, ${city.state}`;
    const analysisDate = new Date();
    analysisDate.setDate(analysisDate.getDate() + 1);
    const startDate = analysisDate.toISOString().split('T')[0];
    const checkoutDate = new Date(analysisDate);
    checkoutDate.setDate(analysisDate.getDate() + 1);
    const endDate = checkoutDate.toISOString().split('T')[0];
    
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY")!;
    if (!rapidApiKey) throw new Error("A chave RAPIDAPI_KEY não está configurada nos segredos da função.");

    // 2. Chamadas sequenciais e controladas
    const hotelsRes = await fetch(`https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${city.booking_com_dest_id}&checkin_date=${startDate}&checkout_date=${endDate}`, {
        headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "booking-com15.p.rapidapi.com" }
    });
    const hotelsData = await hotelsRes.json();
    await sleep(1100);

    const flightsRes = await fetch(`https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights?origin=GRU&destination=${encodeURIComponent(cityName)}&date=${startDate}`, {
        headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "sky-scrapper.p.rapidapi.com" }
    });
    const flightsData = await flightsRes.json();

    // 3. Processar dados
    const competitors_realtime = hotelsData?.data?.hotels?.map((h: any) => ({ price: h.price })).filter((p: any) => p.price) || [];
    const flights_realtime = flightsData?.data?.flights?.map((f: any) => ({ price: f.price })).filter((p: any) => p.price) || [];
    const avg_competitor_realtime = calculateAverage(competitors_realtime, 'price');
    const avg_flight_realtime = calculateAverage(flights_realtime, 'price');
    
    // 4. Estruturar a resposta
    const structured_data = {
        city: cityName,
        period: { start: startDate, end: endDate },
        avg_competitor_realtime: avg_competitor_realtime,
        avg_competitor_baseline: avg_competitor_realtime > 0 ? avg_competitor_realtime * 0.9 : 0, // Simulação
        avg_flight_realtime: avg_flight_realtime,
        avg_flight_baseline: 0,
    };
    const analysis = {
        final_report: `**Diagnóstico Geral:** A demanda para ${cityName} apresenta-se **moderada**. Os preços dos concorrentes estão em R$ ${avg_competitor_realtime.toFixed(2)} e os voos em R$ ${avg_flight_realtime.toFixed(2)}. **Recomendação:** Monitore a concorrência e ajuste as tarifas para maximizar a ocupação.`
    };

    return new Response(JSON.stringify({ structured_data, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});