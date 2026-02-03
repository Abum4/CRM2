from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole, ActivityType


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=5, max_length=50)
    activity_type: ActivityType


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=5, max_length=50)
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    company_id: Optional[UUID] = None
    is_blocked: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserWithRoleResponse(UserResponse):
    role: UserRole
    
    class Config:
        from_attributes = True


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRegisterRequest(UserCreate):
    pass


class AdminLoginRequest(BaseModel):
    login: str
    password: str
    code: str


class TokenResponse(BaseModel):
    user: UserWithRoleResponse
    token: str


class AdminTokenResponse(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=6, max_length=100)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class AssignRoleRequest(BaseModel):
    role: UserRole


class RemoveUserRequest(BaseModel):
    reassign_to_id: UUID


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
