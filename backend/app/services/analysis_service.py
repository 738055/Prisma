import openai
from ..supabase_client import supabase_client
from ..settings import settings
from . import connectors
from ..models import StructuredData, Event, SocialBuzzSignal, NewsArticle, Period, AnalysisResponse, FinalReport
from datetime import timedelta, date

# Inicializa o cliente OpenAI
openai.api_key = settings.OPENAI_API_KEY

def calculate_average(items: list, key: str) -> float:
    if not items:
        return 0.0
    valid_items = [float(str(item.get(key, '0')).replace(',', '.')) for item in items if item.get(key) is not None]
    if not valid_items:
        return 0.0
    total = sum(valid_items)
    return total / len(valid_items)

def run_market_analysis(city_id: str, start_date: str, end_date: str, user_id: str) -> dict:
    # 1. BUSCAR DADOS DO SUPABASE (CIDADE)
    city_res = supabase_client.from_('cities').select('name, state, booking_com_dest_id').eq('id', city_id).single().execute()
    if not city_res.data:
        raise ValueError("Cidade não encontrada.")
    city = city_res.data
    city_name = f"{city['name']}, {city['state']}"

    print(f"[Análise de Mercado] Iniciando para {city_name} de {start_date} a {end_date}")

    # 2. BUSCAR DADOS EM TEMPO REAL (USANDO OS CONECTORES)
    start_date_obj = date.fromisoformat(start_date)
    
    competitors_realtime_raw = connectors.fetch_hotels_booking_com15({
        'dest_id': city.get('booking_com_dest_id'), 
        'checkin_date': start_date, 
        'checkout_date': (start_date_obj + timedelta(days=1)).strftime("%Y-%m-%d")
    })
    flights_realtime_raw = connectors.fetch_flights_sky_scrapper({
        'origin': 'GRU', 
        'destination': city_name, 
        'date': start_date
    })
    news_realtime_raw = connectors.fetch_real_time_news({'query': f"turismo {city['name']}"})
    
    social_buzz_res = supabase_client.from_('social_buzz_signals').select('content, impact_score, source').eq('city_id', city_id).gte('signal_date', start_date).lte('signal_date', end_date).execute()
    competitors_baseline_res = supabase_client.from_('competitor_data').select('price, source').eq('city_id', city_id).eq('target_date', start_date).eq('data_type', 'monthly_baseline').execute()

    # 3. PROCESSAR E ESTRUTURAR OS DADOS
    competitors_realtime = [{'price': p.get('price'), 'source': 'Booking.com'} for p in competitors_realtime_raw.get('data', {}).get('hotels', []) if p.get('price')]
    flights_realtime = [{'price': f.get('price'), 'source': 'Sky Scrapper'} for f in flights_realtime_raw.get('data', {}).get('flights', []) if f.get('price')]

    avg_competitor_realtime = calculate_average(competitors_realtime, 'price')
    avg_flight_realtime = calculate_average(flights_realtime, 'price')
    avg_competitor_baseline = calculate_average(competitors_baseline_res.data, 'price')

    structured_data = StructuredData(
        city=city_name,
        period=Period(start=start_date, end=end_date),
        avg_competitor_realtime=avg_competitor_realtime,
        avg_competitor_baseline=avg_competitor_baseline,
        avg_flight_realtime=avg_flight_realtime,
        avg_flight_baseline=0.0,
        top_events=[Event(title=s['content']) for s in social_buzz_res.data if s.get('source') == 'predicthq_event'],
        social_buzz_signals=[SocialBuzzSignal(**s) for s in social_buzz_res.data],
        top_news=[NewsArticle(title=n.get('title', ''), source=n.get('source', '')) for n in news_realtime_raw.get('data', [])[:3]]
    )

    # 4. CONSTRUIR O PROMPT E CHAMAR A IA
    prompt_content = f"""
    **Dossiê de Inteligência de Mercado**
    - **Destino:** {city_name}
    - **Período de Análise:** {start_date} a {end_date}
    - **Concorrência (Hotéis):** O preço médio hoje é **R$ {avg_competitor_realtime:.2f}**. A linha de base para este período, medida no início do mês, era de **R$ {avg_competitor_baseline:.2f}**.
    - **Demanda Aérea (Voos de SP):** O preço médio hoje é **R$ {avg_flight_realtime:.2f}**.
    - **Eventos e Buzz Social Detectados:**
    {structured_data.social_buzz_signals or [{'content': 'Nenhum sinal de buzz social de alto impacto detectado.'}]}
    - **Principais Notícias de Turismo:**
    {structured_data.top_news or [{'title': 'Nenhuma notícia de grande impacto no turismo local.'}]}

    **Sua Tarefa:**
    Com base na **combinação de todos os dados acima**, forneça uma análise concisa em Markdown.
    Comece com um **Diagnóstico Geral** (Ex: "A demanda para o período se apresenta ALTA e com tendência de AQUECIMENTO.").
    Depois, justifique em **Pontos-Chave**, conectando os sinais (Ex: "A alta de 20% nos preços dos concorrentes é sustentada pelo 'Congresso de TI' (impacto 8/10), que está gerando alto buzz nas redes.").
    Finalize com uma **Recomendação Estratégica** clara e direta para um pequeno hoteleiro.
    """

    messages = [
        {"role": "system", "content": "Você é o Prisma, um Analista de Mercado Hoteleiro de elite. Sua missão é conectar sinais de mercado óbvios (preços) com sinais de demanda latente (buzz social, eventos, notícias) para gerar uma previsão de demanda e recomendações acionáveis. Seja direto, confiante e foque em dados."},
        {"role": "user", "content": prompt_content}
    ]

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    chat_completion = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.4,
        max_tokens=2048
    )
    final_report_content = chat_completion.choices[0].message.content

    # 5. SALVAR O RELATÓRIO NO BANCO DE DADOS
    report_to_save = {
        'user_id': user_id,
        'city_id': city_id,
        'start_date': start_date,
        'end_date': end_date,
        'report_markdown': final_report_content,
        # --- CORREÇÃO AQUI ---
        'structured_data': structured_data.dict()
    }
    
    supabase_client.from_('market_analysis_reports').insert(report_to_save).execute()

    # 6. RETORNAR A RESPOSTA COMPLETA
    response = AnalysisResponse(
        analysis=FinalReport(final_report=final_report_content),
        structured_data=structured_data
    )
    
    # --- CORREÇÃO AQUI ---
    return response.dict()