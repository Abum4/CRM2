from typing import Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID
from app.models.user import ActivityType


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    inn: str = Field(..., min_length=9, max_length=9)
    
    @field_validator('inn')
    @classmethod
    def validate_inn(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('ИНН должен содержать только цифры')
        if len(v) != 9:
            raise ValueError('ИНН должен состоять из 9 цифр')
        return v


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)


class CompanyResponse(CompanyBase):
    id: UUID
    activity_type: ActivityType
    is_blocked: bool = False
    director_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CompanyJoinRequest(BaseModel):
    inn: str = Field(..., min_length=9, max_length=9)
    
    @field_validator('inn')
    @classmethod
    def validate_inn(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('ИНН должен содержать только цифры')
        if len(v) != 9:
            raise ValueError('ИНН должен состоять из 9 цифр')
        return v
