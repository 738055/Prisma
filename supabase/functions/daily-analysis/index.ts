// supabase/functions/daily-analysis/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.19.0';

// A lógica de análise, agora dentro da Edge Function
async function runAnalysisForUser(supabase, openai, user) {
  console.log(`Iniciando análise para: ${user.email}`);

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
        city_id,
        star_rating,
        accommodation_type,
        cities ( name, region )
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.city_id) {
    console.log(`Utilizador ${user.email} sem perfil completo. A ignorar.`);
    return;
  }

  // 1. Buscar os tipos de quarto do utilizador
  const { data: roomTypes } = await supabase.from('room_types').select('id, name').eq('user_id', user.id);
  if (!roomTypes || roomTypes.length === 0) {
      console.log(`Utilizador ${user.email} sem tipos de quarto cadastrados. A ignorar.`);
      return;
  }
  
  // 2. Analisar os próximos 30 dias
  for (let i = 0; i < 30; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dateString = targetDate.toISOString().split('T')[0];

    // Para cada tipo de quarto, faremos uma análise
    for (const roomType of roomTypes) {
        // --- A LÓGICA DO ANALYSIS ENGINE ENTRA AQUI ---
        // a. Buscar a tarifa interna do usuário para esta data e tipo de quarto
        // b. Usar a IA para fazer scraping de concorrentes com perfil similar
        // c. Buscar eventos na região do hotel
        // d. Calcular a demanda e o preço recomendado para ESTE tipo de quarto
        // e. Gerar uma justificativa com a IA
        // f. Salvar os resultados detalhados no Supabase (em `price_recommendations`, talvez com uma coluna `room_type_id`)
        console.log(`Analisando ${dateString} para ${profile.cities.name}, quarto: ${roomType.name}`);
    }
  }
}

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

    const { data: users, error } = await supabaseAdmin.from('users').select(`id, email`);
    if (error) throw error;

    await Promise.all(users.map(user => runAnalysisForUser(supabaseAdmin, openai, user)));

    return new Response(JSON.stringify({ message: `Análise concluída para ${users.length} utilizadores.` }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(String(error?.message ?? error), { status: 500 });
  }
});