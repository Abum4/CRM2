from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from app.models.declaration import DeclarationMode, VehicleType


class VehicleBase(BaseModel):
    number: str = Field(..., min_length=1, max_length=50)
    type: VehicleType


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: UUID
    
    class Config:
        from_attributes = True


class DeclarationBase(BaseModel):
    post_number: str = Field(..., min_length=5, max_length=5)
    date: date
    declaration_number: str = Field(..., min_length=7, max_length=7)
    client_id: UUID
    mode: DeclarationMode
    note: Optional[str] = None
    
    @field_validator('post_number')
    @classmethod
    def validate_post_number(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('Номер поста должен содержать только цифры')
        if len(v) != 5:
            raise ValueError('Номер поста должен состоять из 5 цифр')
        return v
    
    @field_validator('declaration_number')
    @classmethod
    def validate_declaration_number(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('Номер декларации должен содержать только цифры')
        if len(v) != 7:
            raise ValueError('Номер декларации должен состоять из 7 цифр')
        return v


class DeclarationCreate(DeclarationBase):
    vehicles: List[VehicleCreate] = Field(..., min_length=1)
    attached_document_ids: List[UUID] = Field(default_factory=list)
    attached_folder_ids: List[UUID] = Field(default_factory=list)


class DeclarationUpdate(BaseModel):
    post_number: Optional[str] = Field(None, min_length=5, max_length=5)
    date: Optional[date] = None
    declaration_number: Optional[str] = Field(None, min_length=7, max_length=7)
    client_id: Optional[UUID] = None
    mode: Optional[DeclarationMode] = None
    note: Optional[str] = None
    vehicles: Optional[List[VehicleCreate]] = None
    attached_document_ids: Optional[List[UUID]] = None
    attached_folder_ids: Optional[List[UUID]] = None


class DeclarationResponse(DeclarationBase):
    id: UUID
    formatted_number: str
    vehicles: List[VehicleResponse] = []
    attached_document_ids: List[UUID] = []
    attached_folder_ids: List[UUID] = []
    group_id: Optional[UUID] = None
    owner_id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DeclarationRedirectRequest(BaseModel):
    to_user_id: UUID


class DeclarationGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    declaration_ids: List[UUID] = Field(..., min_length=1)


class DeclarationGroupResponse(BaseModel):
    id: UUID
    name: str
    declaration_ids: List[UUID] = []
    company_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeclarationGroupAddRemove(BaseModel):
    declaration_ids: List[UUID] = Field(..., min_length=1)


class DeclarationFilters(BaseModel):
    search: Optional[str] = None
    post_number: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    declaration_number: Optional[str] = None
    client_id: Optional[UUID] = None
    mode: Optional[DeclarationMode] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    owner_id: Optional[UUID] = None
    owner_type: Optional[str] = None  # 'mine', 'all', 'employee'
