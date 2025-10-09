import httpx
from ..settings import settings

async def _call_rapidapi(host: str, url: str, params: dict) -> dict:
    api_key = settings.RAPIDAPI_KEY
    if not api_key or "SUA_CHAVE" in api_key:
        print(f"[RapidAPI] Chave não configurada para o host {host}. A pular.")
        return {"error": f"API key for {host} not configured."}
    
    headers = {"x-rapidapi-key": api_key, "x-rapidapi-host": host}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params, timeout=45)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        print(f"[RapidAPI] Erro HTTP ao chamar {host}: {e.response.status_code}")
        return {"error": f"HTTP Error {e.response.status_code}"}
    except httpx.RequestError as e:
        print(f"[RapidAPI] Erro de requisição ao chamar {host}: {e}")
        return {"error": str(e)}

async def fetch_hotels_booking_com15(params: dict):
    return await _call_rapidapi(
        host="booking-com15.p.rapidapi.com",
        url="https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels",
        params=params
    )

async def fetch_flights_sky_scrapper(params: dict):
    # O nome da API no RapidAPI Hub é "Air Scraper"
    return await _call_rapidapi(
        host="sky-scrapper.p.rapidapi.com",
        url="https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights",
        params=params
    )

async def fetch_real_time_news(params: dict):
    return await _call_rapidapi(
        host="real-time-news-data.p.rapidapi.com",
        url="https://real-time-news-data.p.rapidapi.com/search",
        params=params
    )