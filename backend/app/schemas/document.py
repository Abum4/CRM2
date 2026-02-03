from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.models.document import AccessType


class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[UUID] = None
    access_type: AccessType = AccessType.PUBLIC
    client_id: Optional[UUID] = None


class FolderCreate(FolderBase):
    access_user_ids: List[UUID] = Field(default_factory=list)


class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[UUID] = None
    access_type: Optional[AccessType] = None
    access_user_ids: Optional[List[UUID]] = None
    client_id: Optional[UUID] = None


class FolderResponse(FolderBase):
    id: UUID
    access_user_ids: List[UUID] = []
    owner_id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    folder_id: Optional[UUID] = None
    client_id: Optional[UUID] = None


class DocumentResponse(DocumentBase):
    id: UUID
    file_url: str
    file_type: str
    file_size: int
    owner_id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
