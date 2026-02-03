from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    message: str,
    notification_type: str = "info",
    link: Optional[str] = None
) -> Notification:
    """Create a new notification for a user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=NotificationType(notification_type),
        link=link
    )
    db.add(notification)
    # Don't commit here - let the caller handle the transaction
    return notification
