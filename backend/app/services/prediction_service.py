import openai
from datetime import date, timedelta
from ..supabase_client import supabase_client
from ..settings import settings

openai.api_key = settings.OPENAI_API_KEY

def _parse_raw_data_into_factors(raw_snapshots: list) -> list:
    """Transforma os JSONs brutos em uma lista de 'fatores de demanda' legíveis."""
    # Esta função é um placeholder e precisa ser implementada com a lógica
    # para extrair os dados relevantes de CADA resposta de API.
    # Exemplo simples:
    factors = []
    for snapshot in raw_snapshots:
        if snapshot['source_api'] == 'booking-com15' and snapshot['snapshot'].get('data'):
            prices = [h['price'] for h in snapshot['snapshot']['data']['hotels']]
            if prices:
                avg_price = sum(prices) / len(prices)
                factors.append(f"- Preço médio de hotéis (Booking.com): R$ {avg_price:.2f}")
        
        if snapshot['source_api'] == 'real-time-news' and snapshot['snapshot'].get('data'):
            articles = [article['title'] for article in snapshot['snapshot']['data'][:3]]
            if articles:
                factors.append(f"- Principais notícias: {'; '.join(articles)}")

    return factors


def run_prediction_for_date(city_id: str, target_date: str):
    """
    Orquestra a predição de demanda para uma cidade e data específicas.
    """
    print(f"Iniciando predição para cidade {city_id} na data {target_date}")
    
    # 1. Buscar todos os dados brutos relevantes para esta data
    response = supabase_client.from_('raw_data_snapshots').select('*').eq('city_id', city_id).eq('target_date', target_date).execute()
    
    if not response.data:
        print(f"Nenhum dado encontrado para {target_date}. A pular predição.")
        return

    # 2. Processar dados brutos em fatores legíveis (simplificado)
    factors_list = _parse_raw_data_into_factors(response.data)
    
    if not factors_list:
        print(f"Nenhum fator de demanda pôde ser extraído para {target_date}. A pular predição.")
        return

    factors_text = "\n".join(factors_list)

    # 3. Construir o prompt e chamar a OpenAI
    prompt = f"""
    Com base nos seguintes fatores de mercado para a data {target_date}, classifique o nível de demanda esperado.

    Fatores de Mercado:
    {factors_text}

    Sua Tarefa:
    Responda em um formato JSON estrito.
    1.  No campo "demand_level", classifique a demanda como "low", "moderate", "high", ou "peak".
    2.  No campo "reasoning_summary", escreva uma frase curta (máx 20 palavras) explicando o motivo principal da sua classificação.

    Exemplo de Resposta:
    {{
      "demand_level": "high",
      "reasoning_summary": "A alta nos preços dos hotéis é sustentada por um grande congresso na cidade."
    }}

    Sua Resposta:
    """
    
    try:
        chat_completion = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Você é um analista de dados especialista em turismo."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        result_json = chat_completion.choices[0].message.content
        import json
        prediction_data = json.loads(result_json)

        # 4. Salvar a predição na base de dados
        prediction_to_save = {
            "city_id": city_id,
            "prediction_date": target_date,
            "demand_level": prediction_data.get("demand_level"),
            "reasoning_summary": prediction_data.get("reasoning_summary"),
            "confidence_score": 90 # Pode ser melhorado no futuro
        }

        # Usando 'upsert' para criar ou atualizar a predição para o dia
        supabase_client.from_('demand_predictions').upsert(prediction_to_save, on_conflict='city_id, prediction_date').execute()
        print(f"Predição para {target_date} salva com sucesso: {prediction_data.get('demand_level')}")

    except Exception as e:
        print(f"Erro ao gerar ou salvar predição para {target_date}: {e}")

def trigger_batch_predictions():
    """Dispara a geração de predições para todas as cidades e para os próximos 90 dias."""
    print("====== INICIANDO CICLO DE GERAÇÃO DE PREDIÇÕES ======")
    cities_res = supabase_client.from_('cities').select('id').execute()
    if not cities_res.data:
        return
        
    today = date.today()
    for city in cities_res.data:
        for i in range(90): # Para os próximos 90 dias
            target_date = today + timedelta(days=i)
            target_date_str = target_date.strftime("%Y-%m-%d")
            run_prediction_for_date(city['id'], target_date_str)
            time.sleep(2) # Pausa para não sobrecarregar a OpenAI
    print("====== CICLO DE PREDIÇÕES FINALIZADO ======")