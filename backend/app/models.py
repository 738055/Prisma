from pydantic import BaseModel
from typing import List, Optional

class AnalysisRequestBody(BaseModel):
    cityId: str
    startDate: str
    endDate: str
    userId: str

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