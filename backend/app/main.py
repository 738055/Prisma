from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from .models import AnalysisRequestBody
from .services.analysis_service import run_market_analysis

app = FastAPI(
    title="Prisma Intelligence API",
    description="O motor de análise de mercado para o Prisma.",
    version="1.0.0"
)

# Configuração do CORS
# Em produção, você deve restringir as origens para o seu domínio do frontend.
origins = [
    "http://localhost:5173", # Endereço padrão do Vite/React
    "http://127.0.0.1:5173",
    # Adicione aqui a URL do seu frontend em produção
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
def read_root():
    """Endpoint raiz para verificar se a API está online."""
    return {"status": "Prisma API is running"}

@app.post("/analyze", tags=["Analysis"])
async def analyze_market(body: AnalysisRequestBody):
    """
    Endpoint principal para executar a análise de mercado sob demanda.
    Recebe o ID da cidade, datas e ID do usuário, e retorna um dossiê completo.
    """
    try:
        # A validação do token JWT do usuário pode ser adicionada aqui para segurança.
        # Por simplicidade, estamos confiando no userId passado.
        print(f"Recebida solicitação de análise para o usuário {body.userId}")
        
        result = run_market_analysis(
            city_id=body.cityId,
            start_date=body.startDate,
            end_date=body.endDate,
            user_id=body.userId
        )
        return result
    except ValueError as e:
        # Erros esperados, como "Cidade não encontrada"
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Erros inesperados no servidor
        print(f"Erro crítico durante a análise: {e}")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao processar a sua análise.")