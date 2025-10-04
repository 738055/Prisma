// backend/src/analysisEngine.ts
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// --- CONFIGURAÇÃO ---
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cliente Supabase para o backend. Usa a SERVICE KEY para ter permissões de escrita.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);


// --- MÓDULOS DE COLETA DE DADOS (WEB SCRAPING) ---

/**
 * Busca o preço médio de hotéis para uma cidade e data, simulando a função 'get_market_prices'.
 * @param city A cidade para a pesquisa.
 * @param targetDate A data da pesquisa.
 * @returns O preço médio encontrado ou null.
 */
async function getMarketPrices(city: string, targetDate: string): Promise<number | null> {
  console.log(`[Coleta] Buscando preços de mercado para ${city} em ${targetDate}...`);
  // Para o hackathon, vamos simular esta busca para evitar bloqueios.
  // Numa aplicação real, aqui entraria o web scraping do Booking.com com Cheerio.
  const preçosSimulados = [350, 420, 380, 550, 410];
  const media = preçosSimulados.reduce((a, b) => a + b, 0) / preçosSimulados.length;
  return media;
}


// --- MÓDULOS DE ANÁLISE COM IA ---

/**
 * Usa a IA para extrair e estruturar eventos e notícias, simulando 'search_for_events_and_news'.
 * @param city A cidade para a pesquisa.
 * @param targetDate A data da pesquisa.
 * @returns Uma lista de eventos estruturados.
 */
async function structureEventsWithAI(city: string, targetDate: string): Promise<any[]> {
  console.log(`[IA] Buscando e estruturando eventos para ${city}...`);
  // Para o hackathon, vamos usar um prompt simulando uma busca no Google.
  const prompt = `
    Faça uma busca simulada por eventos, congressos e notícias para a cidade de ${city}
    próximo à data ${targetDate}. Retorne um objeto JSON com uma chave "eventos",
    que é uma lista de objetos com os campos "nome_evento" e "impacto_demanda" ('Alto', 'Médio', 'Baixo').

    Exemplo: { "eventos": [{ "nome_evento": "Congresso de Cardiologia", "impacto_demanda": "Alto" }] }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Você é um assistente especialista em encontrar eventos e retornar em JSON." },
        { role: "user", content: prompt },
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`[IA] Eventos estruturados com sucesso.`);
    return result.eventos || [];
  } catch (error) {
    console.error('[IA] Erro ao estruturar eventos:', error);
    return [];
  }
}

/**
 * Usa a IA para gerar uma justificativa humana e personalizada para a previsão de demanda.
 * @param factors Os fatores calculados, incluindo a tarifa do utilizador e a do mercado.
 * @returns Uma string com a explicação clara para o hoteleiro.
 */
async function generateReasoningWithAI(factors: Record<string, any>): Promise<string> {
  console.log('[IA] Gerando justificativa personalizada...');
  const prompt = `
    Você é um especialista em gestão de receita hoteleira.
    Gere uma justificativa curta (2-3 frases) para um hoteleiro, explicando a recomendação de tarifa.
    Use os seguintes fatores: ${JSON.stringify(factors)}.

    Se a tarifa do usuário estiver muito abaixo da recomendada, destaque a oportunidade de ganho.
    Se a tarifa já estiver boa, elogie a estratégia.
    Seja direto, profissional e foque no valor para o hoteleiro.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
    });
    const reasoning = response.choices[0].message.content || "Não foi possível gerar uma análise detalhada.";
    console.log(`[IA] Justificativa gerada: "${reasoning}"`);
    return reasoning;
  } catch (error) {
    console.error('[IA] Erro ao gerar justificativa:', error);
    return "Análise de fatores indisponível no momento.";
  }
}


// --- ORQUESTRADOR PRINCIPAL DA ANÁLISE ---

/**
 * Executa o ciclo completo de análise para uma cidade, data e utilizador específico.
 * @param cityId O ID da cidade no Supabase.
 * @param targetDate A data para a qual a análise será executada (formato AAAA-MM-DD).
 * @param userId O ID do utilizador que solicitou a análise.
 */
export async function runFullAnalysis(cityId: string, cityName: string, targetDate: string, userId: string) {
  console.log(`--- Iniciando Análise para ${userId} em ${cityName} na data ${targetDate} ---`);

  // ETAPA 1: BUSCAR DADOS INTERNOS (TARIFA DO UTILIZADOR)
  const { data: userTariff } = await supabase
    .from('user_tariffs')
    .select('base_price')
    .eq('user_id', userId)
    .lte('start_date', targetDate)
    .gte('end_date', targetDate)
    .single();
  
  const currentUserPrice = userTariff?.base_price || null;
  console.log(`[Dados Internos] Tarifa atual do usuário: R$ ${currentUserPrice}`);

  // ETAPA 2: COLETAR E ESTRUTURAR DADOS EXTERNOS
  const [marketAveragePrice, events] = await Promise.all([
    getMarketPrices(cityName, targetDate),
    structureEventsWithAI(cityName, targetDate)
  ]);
  console.log(`[Dados Externos] Preço médio de mercado: R$ ${marketAveragePrice}`);
  console.log(`[Dados Externos] Eventos encontrados:`, events);

  // ETAPA 3: LÓGICA DE CÁLCULO (SEU MODELO DE PREVISÃO)
  let demandLevel: 'low' | 'moderate' | 'high' | 'peak' = 'moderate';
  let recommendedPrice = marketAveragePrice ? marketAveragePrice * 1.05 : 300; // Começa com 5% acima da média

  const highImpactEvent = events.find(e => e.impacto_demanda === 'Alto');
  if (highImpactEvent) {
    demandLevel = 'high';
    recommendedPrice *= 1.20; // Aumenta o preço em 20% por evento de alto impacto
  }
  // ... (aqui entraria mais lógica: feriados, tendências de voos, etc.)

  // Compila todos os fatores para a IA analisar
  const analysisFactors = {
    cidade: cityName,
    data: targetDate,
    tarifa_propria: currentUserPrice,
    media_mercado: marketAveragePrice,
    tarifa_recomendada: parseFloat(recommendedPrice.toFixed(2)),
    evento_principal: highImpactEvent?.nome_evento || "Nenhum evento de grande impacto",
    nivel_demanda_calculado: demandLevel,
  };

  // ETAPA 4: SÍNTESE DA JUSTIFICATIVA COM IA
  const justification = await generateReasoningWithAI(analysisFactors);

  // ETAPA 5: ARMAZENAMENTO DOS RESULTADOS NO SUPABASE
  console.log(`[BD] Salvando resultados da análise...`);
  const predictionPromise = supabase.from('demand_predictions').upsert({
    city_id: cityId,
    prediction_date: targetDate,
    demand_level: demandLevel,
    confidence_score: 0.85,
    factors: { events: events.map(e => e.nome_evento) },
  }, { onConflict: 'city_id,prediction_date' });

  const recommendationPromise = supabase.from('price_recommendations').upsert({
    city_id: cityId,
    recommendation_date: targetDate,
    recommended_price: parseFloat(recommendedPrice.toFixed(2)),
    market_average: marketAveragePrice,
    reasoning: justification, // A "mágica" para o usuário final!
  }, { onConflict: 'city_id,recommendation_date' });

  const [predictionResult, recommendationResult] = await Promise.all([predictionPromise, recommendationPromise]);
  if (predictionResult.error) console.error("[BD] Erro ao salvar previsão:", predictionResult.error.message);
  if (recommendationResult.error) console.error("[BD] Erro ao salvar recomendação:", recommendationResult.error.message);
  
  if (!predictionResult.error && !recommendationResult.error) {
    console.log("[BD] Análise salva com sucesso no Supabase!");
  }
  console.log(`--- Análise Finalizada ---`);
}