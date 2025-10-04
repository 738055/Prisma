// supabase/functions/baseline-analysis/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: cities, error } = await supabaseAdmin.from('cities').select('id, name');
    if (error) throw error;

    const predictionsToInsert = [];
    const today = new Date();

    for (const city of cities) {
      for (let i = 0; i < 90; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateString = targetDate.toISOString().split('T')[0];

        // Lógica simplificada para demanda base (ex: fins de semana são mais altos)
        const dayOfWeek = targetDate.getDay();
        let demandLevel = (dayOfWeek === 5 || dayOfWeek === 6) ? 'high' : 'moderate';
        // Adicionar lógica para feriados ou grandes eventos conhecidos...

        predictionsToInsert.push({
          city_id: city.id,
          prediction_date: dateString,
          demand_level: demandLevel,
          confidence_score: 75, // Confiança base
        });
      }
    }

    // Apaga previsões antigas e insere as novas
    await supabaseAdmin.from('demand_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('demand_predictions').upsert(predictionsToInsert, { onConflict: 'city_id,prediction_date' });

    return new Response(JSON.stringify({ message: `Análise base concluída para ${cities.length} cidades.` }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(String(error?.message ?? error), { status: 500 });
  }
});