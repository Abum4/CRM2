from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    type: NotificationType
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
