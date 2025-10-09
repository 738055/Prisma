import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from . import schemas, models
from .services import analysis_service, collector_service, prediction_service
from .supabase_client import supabase_client
from datetime import date, timedelta

app = FastAPI(title="Prisma Intelligence Engine")

origins = [
    "http://localhost:5173",
    "https://prismaht.netlify.app", # Substitua pelo seu domínio de produção
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Endpoint raiz para verificar se o servidor está a funcionar."""
    return {"status": "Prisma Intelligence Engine is running"}

@app.post("/analyze")
async def analyze_market(body: models.AnalysisRequestBody):
    """
    Endpoint principal para o Dashboard Estratégico.
    Lê os dados pré-processados do banco de dados e usa o Assistente de IA para gerar uma análise comparativa.
    """
    try:
        result = await analysis_service.run_analysis_with_assistant(
            city_id=body.cityId,
            user_id=body.userId
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/{city_id}", response_model=list[schemas.DemandPrediction])
def get_predictions_for_city(city_id: str, start_date: str, end_date: str):
    """
    Endpoint para alimentar o Calendário Preditivo no frontend.
    Busca as predições de nível de demanda para um determinado período.
    """
    try:
        res = supabase_client.from_('demand_predictions').select('prediction_date, demand_level').eq('city_id', city_id).gte('prediction_date', start_date).lte('prediction_date', end_date).execute()
        return res.data if res and res.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Falha ao comunicar com a base de dados.")

@app.get("/day_details/{city_id}/{date}", response_model=schemas.DayDetail)
def get_day_details(city_id: str, date: str):
    """
    Endpoint para o modal de detalhes do dia.
    Busca a predição e todos os fatores de mercado que a influenciaram.
    """
    try:
        pred_res = supabase_client.from_('demand_predictions').select('*').eq('city_id', city_id).eq('prediction_date', date).maybe_single().execute()
        
        if not pred_res or not pred_res.data:
            return schemas.DayDetail(prediction_date=date, demand_level="unknown", factors=[])
        
        factors_res = supabase_client.from_('demand_factors').select('*').eq('city_id', city_id).eq('factor_date', date).execute()

        day_detail = schemas.DayDetail(
            prediction_date=pred_res.data['prediction_date'],
            demand_level=pred_res.data['demand_level'],
            reasoning_summary=pred_res.data.get('reasoning_summary'),
            confidence_score=pred_res.data.get('confidence_score'),
            factors=factors_res.data if factors_res and factors_res.data else []
        )
        return day_detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {e}")

# --- ENDPOINTS DE GATILHO PARA GERIR O FLUXO DE DADOS ---

@app.post("/trigger/populate_presentation_data")
def populate_presentation_data():
    """
    LIMPA e POPULA o banco de dados com dados de demonstração realistas para uma apresentação.
    Este é o "interruptor mágico".
    """
    try:
        print("--- MODO APRESENTAÇÃO: Limpando tabelas antigas... ---")
        supabase_client.rpc('truncate_market_data').execute()

        print("--- MODO APRESENTAÇÃO: Inserindo dados de demonstração... ---")
        foz_city_id = '8a29a278-6547-497d-9372-52026887532f'
        today = date.today()

        competitor_data = [
            {'city_id': foz_city_id, 'target_date': (today - timedelta(days=30)).isoformat(), 'price': 420.50, 'source': 'Booking.com', 'data_type': 'monthly_baseline'},
            {'city_id': foz_city_id, 'target_date': today.isoformat(), 'price': 495.70, 'source': 'Booking.com', 'data_type': 'real_time'},
            {'city_id': foz_city_id, 'target_date': today.isoformat(), 'price': 510.00, 'source': 'Decolar.com', 'data_type': 'real_time'}
        ]
        supabase_client.from_('competitor_data').insert(competitor_data).execute()

        demand_factors = [
            {'city_id': foz_city_id, 'factor_date': (today + timedelta(days=1)).isoformat(), 'source_api': 'real-time-news', 'factor_type': 'news', 'description': 'Anunciado novo voo direto de Santiago para Foz do Iguaçu, aumentando a expectativa de turistas chilenos.', 'impact_score': 7},
            {'city_id': foz_city_id, 'factor_date': (today + timedelta(days=1)).isoformat(), 'source_api': 'sky-scrapper', 'factor_type': 'flights', 'description': 'Preço médio de voos de SP para IGU subiu 18% para R$ 1020,00, indicando alta procura.', 'impact_score': 8},
            {'city_id': foz_city_id, 'factor_date': (today + timedelta(days=3)).isoformat(), 'source_api': 'sympla-events', 'factor_type': 'event', 'description': 'Festival de Gastronomia das 3 Fronteiras confirmado com alta procura de bilhetes.', 'impact_score': 9},
        ]
        supabase_client.from_('demand_factors').insert(demand_factors).execute()

        predictions = []
        for i in range(-7, 31):
            d = today + timedelta(days=i)
            level = 'moderate'
            if d.weekday() in [4, 5]: level = 'high'
            if 3 <= i <= 5: level = 'peak'
            predictions.append({
                'city_id': foz_city_id,
                'prediction_date': d.isoformat(),
                'demand_level': level,
                'reasoning_summary': f'Demanda {level} devido a eventos e fluxo de fim de semana.',
                'confidence_score': 95
            })
        supabase_client.from_('demand_predictions').insert(predictions).execute()
        
        print("--- MODO APRESENTAÇÃO: Banco de dados populado com sucesso! ---")
        return {"status": "success", "message": "Banco de dados populado com dados de apresentação."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao popular dados: {e}")

@app.post("/trigger/collect/{collection_type}")
def trigger_collect_task(collection_type: str, background_tasks: BackgroundTasks):
    """Aciona a coleta de dados brutos de todas as APIs em segundo plano."""
    if collection_type not in ['monthly_baseline', 'weekly_update', 'real_time']:
        raise HTTPException(status_code=400, detail="Tipo de coleta inválido.")
    background_tasks.add_task(asyncio.run, collector_service.trigger_collection(collection_type))
    return {"message": f"Coleta '{collection_type}' iniciada em segundo plano."}

@app.post("/trigger/process_and_predict")
def trigger_process_task(background_tasks: BackgroundTasks):
    """Aciona o processamento dos dados brutos e a geração de predições com IA."""
    background_tasks.add_task(prediction_service.trigger_batch_predictions)
    return {"message": "Processamento e predição iniciados em segundo plano."}