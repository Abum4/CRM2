from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.request import RequestType, RequestStatus


class RequestResponse(BaseModel):
    id: UUID
    type: RequestType
    status: RequestStatus
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    company_id: Optional[UUID] = None
    company_name: Optional[str] = None
    target_company_id: Optional[UUID] = None
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
