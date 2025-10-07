import requests
from ..settings import settings
from typing import Optional

def _call_rapidapi(api_key: str, host: str, url: str, params: dict) -> dict:
    """Função base reutilizável para chamar endpoints do RapidAPI."""
    if not api_key:
        print(f"[RapidAPI] Chave para o host {host} não encontrada. A pular.")
        return {"error": f"API key for {host} not configured."}
    
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": host
    }
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[RapidAPI] Erro ao chamar {host}: {e}")
        return {"error": str(e)}

# --- CONECTORES ESPECÍFICOS PARA CADA API ---

def fetch_flights_sky_scrapper(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_SKY_SCRAPPER,
        host="sky-scrapper.p.rapidapi.com",
        url="https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights",
        params=params
    )

def fetch_hotels_booking_com15(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_BOOKING_COM15,
        host="booking-com15.p.rapidapi.com",
        url="https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels",
        params=params
    )

def fetch_rentals_airbnb19(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_AIRBNB19,
        host="airbnb19.p.rapidapi.com",
        url="https://airbnb19.p.rapidapi.com/api/v1/searchProperty",
        params=params
    )

def fetch_hotels_hotels4(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_HOTELS4,
        host="hotels4.p.rapidapi.com",
        url="https://hotels4.p.rapidapi.com/locations/v3/search", # Note que este pode ser para locations, ajuste conforme necessário
        params=params
    )

def fetch_attractions_tripadvisor16(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_TRIPADVISOR16,
        host="tripadvisor16.p.rapidapi.com",
        url="https://tripadvisor16.p.rapidapi.com/api/v1/restaurant/searchRestaurants",
        params=params
    )

def fetch_hotels_booking_com18(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_BOOKING_COM18,
        host="booking-com18.p.rapidapi.com",
        url="https://booking-com18.p.rapidapi.com/stays/search",
        params=params
    )

def fetch_linkedin_data(params: dict):
    # ATENÇÃO: APIs de redes sociais podem ter uso restrito. Use com responsabilidade.
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_LINKEDIN,
        host="linkedin-data-api.p.rapidapi.com",
        url="https://linkedin-data-api.p.rapidapi.com/search-people",
        params=params
    )

def fetch_real_time_news(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_REAL_TIME_NEWS,
        host="real-time-news-data.p.rapidapi.com",
        url="https://real-time-news-data.p.rapidapi.com/search",
        params=params
    )
    
def fetch_economic_events(params: dict):
    return _call_rapidapi(
        api_key=settings.RAPIDAPI_KEY_ECONOMIC_EVENTS,
        host="economic-events-calendar.p.rapidapi.com",
        url="https://economic-events-calendar.p.rapidapi.com/events",
        params=params
    )