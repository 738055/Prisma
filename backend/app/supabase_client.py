from supabase import create_client, Client
from .settings import settings

try:
    supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    print("Cliente Supabase inicializado com sucesso.")
except Exception as e:
    print(f"Erro fatal ao inicializar o cliente Supabase: {e}")
    supabase_client = None