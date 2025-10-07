import time
from datetime import date, timedelta
from . import connectors
from ..supabase_client import supabase_client

def _save_snapshot(city_id: str, source_api: str, target_date: str, collection_type: str, snapshot: dict):
    """Função auxiliar para salvar um snapshot de dados brutos."""
    if not snapshot or snapshot.get("error"):
        print(f"---! FALHA em [{source_api}]: Nenhum dado válido recebido. Causa provável: Chave de API inválida ou parâmetros incorretos. Erro: {snapshot.get('error')}")
        return

    try:
        supabase_client.from_('raw_data_snapshots').insert({
            "city_id": city_id,
            "source_api": source_api,
            "target_date": target_date,
            "collection_type": collection_type,
            "snapshot": snapshot
        }).execute()
        print(f"+++ SUCESSO em [{source_api}]: Snapshot para {target_date} salvo.")
    except Exception as e:
        print(f"---! ERRO CRÍTICO em [{source_api}]: Erro ao salvar no Supabase: {e}")

def run_collection_for_city(city: dict, collection_type: str):
    """
    Executa a coleta de dados de todas as APIs para uma cidade específica.
    """
    print(f"\n--- Iniciando Coleta '{collection_type}' para a cidade: {city['name']} ---")
    today = date.today()
    days_ahead_map = {
        'monthly_baseline': [30, 60, 90],
        'weekly_update': [7, 15, 30, 45, 60],
        'real_time': [1, 2, 3]
    }
    days_to_scan = days_ahead_map.get(collection_type, [])

    for days in days_to_scan:
        target_date = today + timedelta(days=days)
        target_date_str = target_date.strftime("%Y-%m-%d")
        print(f"\n>>> A pesquisar dados para a data futura: {target_date_str}...")
        
        # 1. Booking.com15 (Hotéis)
        if city.get('booking_com_dest_id'):
            booking_params = {"dest_id": city['booking_com_dest_id'], "checkin_date": target_date_str, "checkout_date": (target_date + timedelta(days=1)).strftime("%Y-%m-%d")}
            print(f"[*] A chamar [booking-com15] com parâmetros: {booking_params}")
            booking_data = connectors.fetch_hotels_booking_com15(booking_params)
            _save_snapshot(city['id'], 'booking-com15', target_date_str, collection_type, booking_data)
            time.sleep(2)
        else:
            print("[!] A pular [booking-com15]: booking_com_dest_id não definido para esta cidade.")

        # 2. Real Time News (Notícias) - *** CORREÇÃO AQUI ***
        # Simplificamos os parâmetros, enviando apenas a query.
        news_params = {"query": f"turismo \"{city['name']}\""}
        print(f"[*] A chamar [real-time-news] com parâmetros: {news_params}")
        news_data = connectors.fetch_real_time_news(news_params)
        _save_snapshot(city['id'], 'real-time-news', today.strftime("%Y-%m-%d"), collection_type, news_data)
        time.sleep(2)
        
    print(f"--- Coleta '{collection_type}' para {city['name']} concluída. ---")

def trigger_collection(collection_type: str):
    """Função principal que busca todas as cidades e dispara a coleta para cada uma."""
    print(f"\n====== INICIANDO CICLO DE COLETA GLOBAL: {collection_type.upper()} ======")
    response = supabase_client.from_('cities').select('*').execute()
    if response.data:
        for city in response.data:
            run_collection_for_city(city, collection_type)
    else:
        print("!!! Nenhuma cidade encontrada na base de dados para iniciar a coleta.")
    print(f"====== CICLO DE COLETA GLOBAL {collection_type.upper()} FINALIZADO ======")