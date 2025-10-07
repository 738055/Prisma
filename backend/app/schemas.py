from pydantic import BaseModel
from typing import List, Optional, Any

# Esquema para os dados de uma cidade retornados pela API
class City(BaseModel):
    id: str
    name: str
    state: str
    booking_com_dest_id: Optional[str] = None
    tripadvisor_location_id: Optional[str] = None

# Esquema para as predições de demanda que alimentam o calendário
class DemandPrediction(BaseModel):
    prediction_date: str
    demand_level: str # low, moderate, high, peak

# Esquema para os fatores de demanda (os "porquês")
class DemandFactor(BaseModel):
    factor_date: str
    source_api: str
    factor_type: str
    description: str
    value: Optional[float] = None
    impact_score: Optional[int] = None

# Esquema para a resposta completa do detalhe do dia
class DayDetail(BaseModel):
    prediction_date: str
    demand_level: str
    reasoning_summary: Optional[str] = None
    confidence_score: Optional[float] = None
    factors: List[DemandFactor]