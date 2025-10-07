import requests
from ..settings import settings

def scrape_serpapi(params: dict) -> dict:
    """
    Função para fazer scraping de dados usando a SerpApi.
    """
    if not settings.SERPAPI_API_KEY:
        print("[SerpApi Connector] Chave da API (SERPAPI_API_KEY) não encontrada.")
        return {"error": "API key for SerpApi is not configured."}

    base_url = "https://serpapi.com/search.json"
    params['api_key'] = settings.SERPAPI_API_KEY
    
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Lança um erro para status HTTP 4xx/5xx
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[SerpApi Connector] Error fetching from engine: {params.get('engine')}. Error: {e}")
        return {"error": f"API Error: {e}"}