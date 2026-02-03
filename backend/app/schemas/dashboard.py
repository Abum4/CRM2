from typing import Optional, List
from pydantic import BaseModel
from datetime import date


class DashboardStats(BaseModel):
    active_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    sent_declarations: Optional[int] = None
    active_certificates: int = 0
    completed_certificates: int = 0
    overdue_certificates: int = 0


class GrowthDataPoint(BaseModel):
    date: str
    companies: int
    users: int


class AdminStats(BaseModel):
    total_companies: int = 0
    total_users: int = 0
    active_requests: int = 0
    growth_data: List[GrowthDataPoint] = []


class DashboardFilters(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    employee_id: Optional[str] = None
