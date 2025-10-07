import openai
from datetime import date, timedelta
from ..supabase_client import supabase_client
from ..settings import settings
import time # <--- ESTA É A LINHA QUE FALTAVA
import json

openai.api_key = settings.OPENAI_API_KEY

def _parse_raw_data_into_factors(raw_snapshots: list) -> list:
    """Transforma os JSONs brutos em uma lista de 'fatores de demanda' legíveis."""
    factors = []
    for snapshot in raw_snapshots:
        api_source = snapshot.get('source_api')
        snapshot_data = snapshot.get('snapshot', {})

        # Fator: Preços de Hotéis (Booking.com)
        if api_source == 'booking-com15' and snapshot_data.get('data'):
            prices = [h.get('price') for h in snapshot_data['data'].get('hotels', []) if h.get('price')]
            if prices:
                avg_price = sum(prices) / len(prices)
                factors.append(f"- Preço médio de hotéis (Booking.com): R$ {avg_price:.2f}")

        # Fator: Preços de Aluguer de Temporada (Airbnb)
        elif api_source == 'airbnb19' and snapshot_data.get('data'):
            prices = [p.get('price', {}).get('total') for p in snapshot_data['data'].get('properties', []) if p.get('price', {}).get('total')]
            if prices:
                avg_price = sum(prices) / len(prices)
                factors.append(f"- Preço médio de alugueres de temporada (Airbnb): R$ {avg_price:.2f}")
        
        # Fator: Preços de Voos (Sky Scrapper)
        elif api_source == 'sky-scrapper' and snapshot_data.get('data'):
            prices = [f.get('price') for f in snapshot_data['data'].get('flights', []) if f.get('price')]
            if prices:
                avg_price = sum(prices) / len(prices)
                factors.append(f"- Preço médio de voos (Sky Scrapper): R$ {avg_price:.2f}")

        # Fator: Notícias (Real Time News)
        elif api_source == 'real-time-news' and snapshot_data.get('data'):
            articles = [article.get('title') for article in snapshot_data.get('data', [])[:3] if article.get('title')]
            if articles:
                factors.append(f"- Principais notícias: {'; '.join(articles)}")
    
    return factors


def run_prediction_for_date(city_id: str, target_date: str):
    """
    Orquestra a predição de demanda para uma cidade e data específicas.
    """
    print(f"Iniciando predição para cidade {city_id} na data {target_date}")
    
    response = supabase_client.from_('raw_data_snapshots').select('*').eq('city_id', city_id).eq('target_date', target_date).execute()
    
    if not response.data:
        print(f"Nenhum dado encontrado para {target_date}. A pular predição.")
        return

    factors_list = _parse_raw_data_into_factors(response.data)
    
    if not factors_list:
        print(f"Nenhum fator de demanda pôde ser extraído para {target_date}. A pular predição.")
        return

    factors_text = "\n".join(factors_list)

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
        prediction_data = json.loads(result_json)

        prediction_to_save = {
            "city_id": city_id,
            "prediction_date": target_date,
            "demand_level": prediction_data.get("demand_level"),
            "reasoning_summary": prediction_data.get("reasoning_summary"),
            "confidence_score": 90 # Placeholder
        }

        supabase_client.from_('demand_predictions').upsert(prediction_to_save, on_conflict='city_id, prediction_date').execute()
        print(f"Predição para {target_date} salva com sucesso: {prediction_data.get('demand_level')}")

    except Exception as e:
        print(f"Erro ao gerar ou salvar predição para {target_date}: {e}")

def trigger_batch_predictions():
    """Dispara a geração de predições para todas as cidades e para os próximos 90 dias."""
    print("====== INICIANDO CICLO DE GERAÇÃO DE PREDIÇÕES ======")
    cities_res = supabase_client.from_('cities').select('id').execute()
    if not cities_res.data:
        print("Nenhuma cidade encontrada para iniciar a predição.")
        return
        
    today = date.today()
    for city in cities_res.data:
        for i in range(90):
            target_date = today + timedelta(days=i)
            target_date_str = target_date.strftime("%Y-%m-%d")
            run_prediction_for_date(city['id'], target_date_str)
            time.sleep(2) # Pausa para não sobrecarregar a OpenAI
    print("====== CICLO DE PREDIÇÕES FINALIZADO ======")