import asyncio
from datetime import date, timedelta
from . import connectors
from ..supabase_client import supabase_client

async def _save_snapshot(city_id: str, source_api: str, target_date: str, collection_type: str, snapshot: dict):
    if not snapshot or snapshot.get("error"):
        print(f"---! FALHA em [{source_api}]: Nenhum dado válido recebido. Erro: {snapshot.get('error')}")
        return
    try:
        # Usando 'await' para operações assíncronas
        await supabase_client.from_('raw_data_snapshots').insert({
            "city_id": city_id, "source_api": source_api, "target_date": target_date,
            "collection_type": collection_type, "snapshot": snapshot
        }).execute()
        print(f"+++ SUCESSO em [{source_api}]: Snapshot para {target_date} salvo.")
    except Exception as e:
        print(f"---! ERRO CRÍTICO em [{source_api}]: Erro ao salvar no Supabase: {e}")

async def run_collection_for_city(city: dict, collection_type: str):
    print(f"\n--- Iniciando Coleta '{collection_type}' para a cidade: {city['name']} ---")
    today = date.today()
    days_to_scan = {'monthly_baseline': [30, 60], 'weekly_update': [7, 15, 45], 'real_time': [1, 3]}.get(collection_type, [])

    for days in days_to_scan:
        target_date = today + timedelta(days=days)
        target_date_str = target_date.strftime("%Y-%m-%d")
        print(f"\n>>> A pesquisar dados para a data futura: {target_date_str}...")
        
        if city.get('booking_com_dest_id'):
            params = {"dest_id": city['booking_com_dest_id'], "checkin_date": target_date_str, "checkout_date": (target_date + timedelta(days=1)).strftime("%Y-%m-%d")}
            data = await connectors.fetch_hotels_booking_com15(params)
            await _save_snapshot(city['id'], 'booking-com15', target_date_str, collection_type, data)
            await asyncio.sleep(1.5)
        
        if city.get('iata_code'):
            params = {"origin": "GRU", "destination": city['iata_code'], "date": target_date_str}
            data = await connectors.fetch_flights_sky_scrapper(params)
            await _save_snapshot(city['id'], 'sky-scrapper', target_date_str, collection_type, data)
            await asyncio.sleep(1.5)

    params = {"query": f"turismo \"{city['name']}\"", "country": "BR", "language": "pt"}
    data = await connectors.fetch_real_time_news(params)
    await _save_snapshot(city['id'], 'real-time-news', today.strftime("%Y-%m-%d"), collection_type, data)
    await asyncio.sleep(1.5)

    print(f"--- Coleta '{collection_type}' para {city['name']} concluída. ---")

async def trigger_collection(collection_type: str):
    print(f"\n====== INICIANDO CICLO DE COLETA GLOBAL: {collection_type.upper()} ======")
    # Usando 'await' para a chamada assíncrona
    response = await supabase_client.from_('cities').select('*').execute()
    if response.data:
        for city in response.data:
            await run_collection_for_city(city, collection_type)
    else:
        print("!!! Nenhuma cidade encontrada para iniciar a coleta.")
    print(f"====== CICLO DE COLETA GLOBAL {collection_type.upper()} FINALIZADO ======")