# A única mudança é de onde importamos o BaseSettings.
# Em vez de 'from pydantic_settings...', agora é 'from pydantic...'
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # A lógica interna para carregar do .env já existe no BaseSettings da Pydantic v1
    # mas precisamos de definir explicitamente cada variável.
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    OPENAI_API_KEY: str
    RAPIDAPI_KEY_SKY_SCRAPPER: str
    RAPIDAPI_KEY_BOOKING_COM15: str
    RAPIDAPI_KEY_AIRBNB19: str
    RAPIDAPI_KEY_HOTELS4: str
    RAPIDAPI_KEY_TRIPADVISOR16: str
    RAPIDAPI_KEY_BOOKING_COM18: str
    RAPIDAPI_KEY_LINKEDIN: str
    RAPIDAPI_KEY_REAL_TIME_NEWS: str
    RAPIDAPI_KEY_ECONOMIC_EVENTS: str

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

settings = Settings()