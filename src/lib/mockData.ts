// src/lib/mockData.ts

// Simula a resposta da análise estratégica que viria da Edge Function ou do backend
export const mockStrategicAnalysis = {
  analysis: {
    final_report: `
### Diagnóstico Geral
Observa-se um **aumento moderado** na demanda para a próxima semana, impulsionado principalmente pelo feriado prolongado e pela alta nos preços de voos, que indica uma procura elevada para Foz do Iguaçu. A tarifa média da concorrência subiu **14.3%** em comparação com a base mensal, sinalizando uma oportunidade para ajuste de preço.

### Recomendação Estratégica
Recomenda-se um **aumento de 8% a 12%** nas suas tarifas para os próximos 7 dias para capitalizar sobre a alta demanda. Monitore a ocupação e esteja preparado para oferecer pacotes de "última hora" caso a ocupação não atinja 95% até dois dias antes do check-in.
    `
  },
  structured_data: {
    city: "Foz do Iguaçu, PR",
    avg_competitor_realtime: 475.50,
    avg_competitor_baseline: 415.80,
    avg_flight_realtime: 890.00,
  }
};

// Simula as predições de demanda para o calendário
export const mockCalendarPredictions = (startDate: Date, endDate: Date) => {
  const predictions = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    let demand_level: 'low' | 'moderate' | 'high' | 'peak' = 'moderate';
    const dayOfWeek = currentDate.getDay();
    const dayOfMonth = currentDate.getDate();

    // Lógica para criar uma demanda variada e realista
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Fim de semana
      demand_level = 'high';
    }
    if (dayOfMonth >= 12 && dayOfMonth <= 15) { // Simula um evento ou feriado
        demand_level = 'peak';
    }
     if (dayOfMonth >= 20 && dayOfMonth <= 22) {
      demand_level = 'high';
    }

    predictions.push({
      prediction_date: dateString,
      demand_level: demand_level,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return predictions;
};


// Simula os detalhes para um dia específico ao clicar no calendário
export const mockDayDetails = {
  prediction_date: new Date().toISOString().split('T')[0],
  demand_level: 'peak',
  reasoning_summary: "Pico de demanda devido ao início do Festival de Gastronomia das 3 Fronteiras e ao aumento na procura por voos.",
  factors: [
    {
      factor_type: 'event',
      description: 'Festival de Gastronomia das 3 Fronteiras confirmado com alta procura de bilhetes.',
      impact_score: 9,
    },
    {
      factor_type: 'flights',
      description: 'Preço médio de voos de SP para IGU subiu 18% para R$ 1020,00, indicando alta procura.',
      impact_score: 8,
    },
    {
      factor_type: 'news',
      description: 'Anunciado novo voo direto de Santiago para Foz do Iguaçu, aumentando a expectativa de turistas chilenos.',
      impact_score: 7,
    },
  ]
};