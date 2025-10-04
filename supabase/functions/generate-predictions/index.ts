import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface City {
  id: string;
  name: string;
  slug: string;
  config: any;
}

interface DemandFactor {
  type: string;
  description: string;
  impact: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("*");

    if (citiesError) throw citiesError;

    const today = new Date();
    const predictions = [];
    const priceRecommendations = [];
    const alerts = [];

    for (const city of cities as City[]) {
      for (let i = 0; i < 90; i++) {
        const predictionDate = new Date(today);
        predictionDate.setDate(today.getDate() + i);
        const dateKey = predictionDate.toISOString().split("T")[0];

        const { demandLevel, factors, confidenceScore } = await generateDemandPrediction(
          city,
          predictionDate
        );

        predictions.push({
          city_id: city.id,
          prediction_date: dateKey,
          demand_level: demandLevel,
          confidence_score: confidenceScore,
          factors: factors,
        });

        const { recommendedPrice, marketAverage, reasoning } = await generatePriceRecommendation(
          city,
          predictionDate,
          demandLevel
        );

        priceRecommendations.push({
          city_id: city.id,
          recommendation_date: dateKey,
          recommended_price: recommendedPrice,
          market_average: marketAverage,
          reasoning: reasoning,
          game_theory_data: { equilibrium_type: "cooperative" },
        });

        if (demandLevel === "peak" && i > 7 && i < 30) {
          alerts.push({
            city_id: city.id,
            alert_type: "opportunity",
            title: `Oportunidade de Pico em ${city.name}`,
            message: `A demanda para ${predictionDate.toLocaleDateString("pt-BR")} subiu para PICO. Recomendação de tarifa atualizada para R$ ${recommendedPrice.toFixed(2)}.`,
            target_date: dateKey,
            is_active: true,
          });
        }
      }
    }

    const { error: predError } = await supabase
      .from("demand_predictions")
      .insert(predictions);

    const { error: priceError } = await supabase
      .from("price_recommendations")
      .insert(priceRecommendations);

    const { error: alertError } = await supabase
      .from("alerts")
      .insert(alerts);

    if (predError) throw predError;
    if (priceError) throw priceError;
    if (alertError) console.error("Alert error:", alertError);

    return new Response(
      JSON.stringify({
        success: true,
        predictions_count: predictions.length,
        prices_count: priceRecommendations.length,
        alerts_count: alerts.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function generateDemandPrediction(
  city: City,
  date: Date
): Promise<{ demandLevel: string; factors: DemandFactor[]; confidenceScore: number }> {
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const factors: DemandFactor[] = [];
  let demandScore = 50;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    demandScore += 15;
    factors.push({
      type: "sazonal",
      description: "Fim de semana - aumento típico de demanda turística",
      impact: 6,
    });
  }

  if (city.slug === "foz-iguacu") {
    if (Math.random() > 0.7) {
      demandScore += 20;
      factors.push({
        type: "câmbio",
        description: "Desvalorização do Peso Argentino aumenta fluxo de turistas brasileiros",
        impact: 8,
      });
    }
    if (month >= 5 && month <= 8) {
      demandScore += 10;
      factors.push({
        type: "clima",
        description: "Alta temporada - inverno com clima favorável para visitação das Cataratas",
        impact: 7,
      });
    }
  }

  if (city.slug === "gramado") {
    if (month >= 5 && month <= 8) {
      demandScore += 25;
      factors.push({
        type: "evento",
        description: "Temporada de inverno - Natal Luz e festivais de chocolate",
        impact: 9,
      });
    }
    if (Math.random() > 0.6) {
      demandScore += 15;
      factors.push({
        type: "clima",
        description: "Previsão de temperaturas baixas atrai turistas em busca de experiência de frio",
        impact: 7,
      });
    }
  }

  if (city.slug === "rio-janeiro") {
    if (month === 11 || month === 0 || month === 1) {
      demandScore += 30;
      factors.push({
        type: "evento",
        description: "Alta temporada de verão - Réveillon e Carnaval",
        impact: 10,
      });
    }
    if (Math.random() > 0.8) {
      demandScore += 20;
      factors.push({
        type: "internacional",
        description: "Aumento de 85% nas buscas internacionais de voos para o Rio",
        impact: 8,
      });
    }
  }

  if (Math.random() > 0.85) {
    demandScore += 18;
    factors.push({
      type: "evento",
      description: "Show internacional confirmado no estádio local",
      impact: 9,
    });
  }

  let demandLevel = "low";
  if (demandScore >= 85) demandLevel = "peak";
  else if (demandScore >= 70) demandLevel = "high";
  else if (demandScore >= 55) demandLevel = "moderate";

  const confidenceScore = Math.min(95, 70 + Math.random() * 25);

  return { demandLevel, factors, confidenceScore };
}

async function generatePriceRecommendation(
  city: City,
  date: Date,
  demandLevel: string
): Promise<{ recommendedPrice: number; marketAverage: number; reasoning: string }> {
  const basePrices: Record<string, number> = {
    "foz-iguacu": 280,
    "gramado": 350,
    "rio-janeiro": 420,
  };

  const basePrice = basePrices[city.slug] || 300;
  let marketAverage = basePrice;
  let multiplier = 1.0;

  switch (demandLevel) {
    case "peak":
      multiplier = 1.8;
      break;
    case "high":
      multiplier = 1.4;
      break;
    case "moderate":
      multiplier = 1.15;
      break;
    case "low":
      multiplier = 0.85;
      break;
  }

  marketAverage = basePrice * multiplier;
  const recommendedPrice = marketAverage * 0.98;

  let reasoning = "";
  if (demandLevel === "peak") {
    reasoning = `Baseado na demanda de PICO, na tarifa média de R$ ${marketAverage.toFixed(
      2
    )} dos concorrentes e na nossa análise para evitar guerra de preços, esta tarifa maximiza sua receita mantendo competitividade.`;
  } else if (demandLevel === "high") {
    reasoning = `Com demanda ALTA, recomendamos tarifa levemente abaixo da média de mercado (R$ ${marketAverage.toFixed(
      2
    )}) para capturar maior volume sem iniciar competição agressiva.`;
  } else if (demandLevel === "moderate") {
    reasoning = `Demanda moderada sugere preço próximo à média de mercado com leve desconto estratégico para aumentar taxa de conversão.`;
  } else {
    reasoning = `Em período de demanda baixa, recomendamos preço promocional para manter ocupação e maximizar receita total.`;
  }

  return { recommendedPrice, marketAverage, reasoning };
}
