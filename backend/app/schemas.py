from pydantic import BaseModel
from typing import List, Optional

class DemandPrediction(BaseModel):
    prediction_date: str
    demand_level: str

class DemandFactor(BaseModel):
    factor_date: str
    source_api: str
    factor_type: str
    description: str
    value: Optional[float] = None
    impact_score: Optional[int] = None

class DayDetail(BaseModel):
    prediction_date: str
    demand_level: str
    reasoning_summary: Optional[str] = None
    confidence_score: Optional[float] = None
    factors: List[DemandFactor]

class Period(BaseModel):
    start: str
    end: str

class Event(BaseModel):
    title: str

class SocialBuzzSignal(BaseModel):
    content: str
    impact_score: Optional[float] = None
    source: str

class NewsArticle(BaseModel):
    title: str
    source: str

class StructuredData(BaseModel):
    city: str
    period: Period
    avg_competitor_realtime: float
    avg_competitor_baseline: float
    avg_flight_realtime: float
    avg_flight_baseline: float
    top_events: List[Event]
    social_buzz_signals: List[SocialBuzzSignal]
    top_news: List[NewsArticle]

class FinalReport(BaseModel):
    final_report: str

class AnalysisResponse(BaseModel):
    analysis: FinalReport
    structured_data: StructuredData