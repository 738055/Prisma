from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from . import schemas
from .supabase_client import supabase_client
from .services import collector_service, prediction_service

app = FastAPI(title="Prisma Intelligence Engine V2")

# --- CORREÇÃO DE CORS ---
# Vamos permitir qualquer origem para facilitar o desenvolvimento,
# mas em produção, isto deve ser restrito ao seu domínio.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todos os cabeçalhos
)

@app.get("/")
def read_root():
    return {"status": "Prisma Engine V2 is running"}

# --- ENDPOINTS PARA O FRONTEND ---

@app.get("/predictions/{city_id}", response_model=list[schemas.DemandPrediction])
def get_predictions_for_city(city_id: str, start_date: str, end_date: str):
    """Retorna as predições de demanda para um período, alimentando o calendário."""
    try:
        res = supabase_client.from_('demand_predictions').select('prediction_date, demand_level').eq('city_id', city_id).gte('prediction_date', start_date).lte('prediction_date', end_date).execute()
        return res.data if res.data else []
    except Exception as e:
        print(f"Erro ao buscar predições: {e}")
        raise HTTPException(status_code=500, detail="Falha ao comunicar com a base de dados.")

@app.get("/day_details/{city_id}/{date}", response_model=schemas.DayDetail)
def get_day_details(city_id: str, date: str):
    """
    Retorna a predição e todos os fatores de demanda para um dia específico.
    *** ESTA É A FUNÇÃO CORRIGIDA E MAIS ROBUSTA ***
    """
    try:
        # Usamos .maybe_single() em vez de .single() para evitar erros se não encontrar nada.
        pred_res = supabase_client.from_('demand_predictions').select('*').eq('city_id', city_id).eq('prediction_date', date).maybe_single().execute()
        
        # Se não houver dados de predição, retornamos um 404 claro.
        if not pred_res.data:
            raise HTTPException(status_code=404, detail=f"Ainda não existem dados de predição para a data {date}.")

        # A busca por fatores continua igual.
        factors_res = supabase_client.from_('demand_factors').select('*').eq('city_id', city_id).eq('factor_date', date).execute()

        # Construímos a resposta
        day_detail = schemas.DayDetail(
            prediction_date=pred_res.data['prediction_date'],
            demand_level=pred_res.data['demand_level'],
            reasoning_summary=pred_res.data.get('reasoning_summary'), # Usamos .get() para segurança
            confidence_score=pred_res.data.get('confidence_score'),
            factors=factors_res.data if factors_res.data else []
        )
        return day_detail
        
    except HTTPException as http_exc:
        # Se já for uma exceção HTTP (como o nosso 404), apenas a repassamos.
        raise http_exc
    except Exception as e:
        # Para qualquer outro erro inesperado, logamos e retornamos um 500.
        print(f"Erro inesperado no endpoint day_details: {e}")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno no servidor ao processar os detalhes do dia.")


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