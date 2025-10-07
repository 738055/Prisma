from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from . import schemas
from .supabase_client import supabase_client
from .services import collector_service, prediction_service

app = FastAPI(title="Prisma Intelligence Engine V2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # URL do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Prisma Engine V2 is running"}

# --- ENDPOINTS PARA O FRONTEND ---

@app.get("/predictions/{city_id}", response_model=list[schemas.DemandPrediction])
def get_predictions_for_city(city_id: str, start_date: str, end_date: str):
    """Retorna as predições de demanda para um período, alimentando o calendário."""
    res = supabase_client.from_('demand_predictions').select('prediction_date, demand_level').eq('city_id', city_id).gte('prediction_date', start_date).lte('prediction_date', end_date).execute()
    if res.data:
        return res.data
    return []

@app.get("/day_details/{city_id}/{date}", response_model=schemas.DayDetail)
def get_day_details(city_id: str, date: str):
    """Retorna a predição e todos os fatores de demanda para um dia específico."""
    pred_res = supabase_client.from_('demand_predictions').select('*').eq('city_id', city_id).eq('prediction_date', date).single().execute()
    factors_res = supabase_client.from_('demand_factors').select('*').eq('city_id', city_id).eq('factor_date', date).execute()

    if not pred_res.data:
        raise HTTPException(status_code=404, detail="Predição não encontrada para esta data.")
    
    day_detail = schemas.DayDetail(
        prediction_date=pred_res.data['prediction_date'],
        demand_level=pred_res.data['demand_level'],
        reasoning_summary=pred_res.data['reasoning_summary'],
        confidence_score=pred_res.data['confidence_score'],
        factors=factors_res.data if factors_res.data else []
    )
    return day_detail

# --- ENDPOINTS DE GATILHO (Para desenvolvimento/teste) ---

@app.post("/trigger/collect/{collection_type}")
def trigger_collect(collection_type: str, background_tasks: BackgroundTasks):
    if collection_type not in ['monthly_baseline', 'weekly_update']:
        raise HTTPException(status_code=400, detail="Tipo de coleta inválido.")
    
    background_tasks.add_task(collector_service.trigger_collection, collection_type)
    return {"message": f"Coleta do tipo '{collection_type}' iniciada em segundo plano."}

@app.post("/trigger/predict")
def trigger_predict(background_tasks: BackgroundTasks):
    background_tasks.add_task(prediction_service.trigger_batch_predictions)
    return {"message": "Geração de predições em lote iniciada em segundo plano."}