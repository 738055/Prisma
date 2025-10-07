from supabase import create_client, Client
from .settings import settings

try:
    supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Erro ao inicializar o cliente Supabase: {e}")
    # Em uma aplicação real, você poderia ter um fallback ou um sistema de log mais robusto.
    supabase_client = None