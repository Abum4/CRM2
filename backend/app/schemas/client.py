from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.models.document import AccessType


class ClientBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    inn: str = Field(..., min_length=1, max_length=50)
    director_name: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = None
    access_type: AccessType = AccessType.PUBLIC


class ClientCreate(ClientBase):
    access_user_ids: List[UUID] = Field(default_factory=list)


class ClientUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    inn: Optional[str] = Field(None, min_length=1, max_length=50)
    director_name: Optional[str] = Field(None, min_length=1, max_length=255)
    note: Optional[str] = None
    access_type: Optional[AccessType] = None
    access_user_ids: Optional[List[UUID]] = None


class ClientResponse(ClientBase):
    id: UUID
    access_user_ids: List[UUID] = []
    owner_id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
