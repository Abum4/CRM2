from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.models.partnership import PartnershipStatus


class PartnershipRequestCreate(BaseModel):
    target_company_inn: str = Field(..., min_length=9, max_length=9)
    note: Optional[str] = None


class PartnershipResponse(BaseModel):
    id: UUID
    requesting_company_id: UUID
    target_company_id: UUID
    note: Optional[str] = None
    status: PartnershipStatus
    created_at: datetime
    updated_at: datetime
    
    # Additional info
    requesting_company_name: Optional[str] = None
    target_company_name: Optional[str] = None
    
    class Config:
        from_attributes = True
