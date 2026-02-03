from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models import User, Company, UserRole
from app.schemas import (
    ApiResponse, PaginatedResponse, UserWithRoleResponse, UserUpdate,
    AssignRoleRequest, RemoveUserRequest, SendMessageRequest
)
from app.api.deps import get_current_user, require_admin, require_director
from app.utils.files import save_upload_file
from app.services.notification import create_notification

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=ApiResponse[UserWithRoleResponse])
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Check access - same company or admin
    if current_user.role != UserRole.ADMIN and current_user.company_id != user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому пользователю"
        )
    
    return ApiResponse(data=UserWithRoleResponse.model_validate(user), success=True)


@router.get("/company/{company_id}", response_model=ApiResponse[list[UserWithRoleResponse]])
async def get_users_by_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users in a company."""
    # Check access
    if current_user.role != UserRole.ADMIN and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к пользователям этой компании"
        )
    
    result = await db.execute(
        select(User).where(User.company_id == company_id).order_by(User.full_name)
    )
    users = result.scalars().all()
    
    return ApiResponse(
        data=[UserWithRoleResponse.model_validate(u) for u in users],
        success=True
    )


@router.get("", response_model=PaginatedResponse[UserWithRoleResponse])
async def get_all_users(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Get all users (admin only)."""
    # Count total
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    users = result.scalars().all()
    
    return PaginatedResponse.create(
        data=[UserWithRoleResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.put("/{user_id}", response_model=ApiResponse[UserWithRoleResponse])
async def update_user(
    user_id: UUID,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile."""
    # Can only update self unless admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Можно редактировать только свой профиль"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    await db.commit()
    await db.refresh(user)
    
    return ApiResponse(data=UserWithRoleResponse.model_validate(user), success=True)


@router.post("/{user_id}/avatar", response_model=ApiResponse[dict])
async def update_avatar(
    user_id: UUID,
    avatar: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload user avatar."""
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Можно изменять только свой аватар"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Save avatar file
    file_url, _, _ = await save_upload_file(avatar, "avatars")
    user.avatar_url = file_url
    
    await db.commit()
    
    return ApiResponse(data={"avatar_url": file_url}, success=True)


@router.post("/{user_id}/block", response_model=ApiResponse[UserWithRoleResponse])
async def block_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Block a user (admin or director)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Check permissions
    can_block = False
    if current_user.role == UserRole.ADMIN:
        can_block = True
    elif current_user.role == UserRole.DIRECTOR and current_user.company_id == user.company_id:
        can_block = True
    
    if not can_block:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    user.is_blocked = True
    await db.commit()
    await db.refresh(user)
    
    return ApiResponse(data=UserWithRoleResponse.model_validate(user), success=True)


@router.post("/{user_id}/unblock", response_model=ApiResponse[UserWithRoleResponse])
async def unblock_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unblock a user (admin or director)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Check permissions
    can_unblock = False
    if current_user.role == UserRole.ADMIN:
        can_unblock = True
    elif current_user.role == UserRole.DIRECTOR and current_user.company_id == user.company_id:
        can_unblock = True
    
    if not can_unblock:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    user.is_blocked = False
    await db.commit()
    await db.refresh(user)
    
    return ApiResponse(data=UserWithRoleResponse.model_validate(user), success=True)


@router.post("/{user_id}/remove", response_model=ApiResponse[None])
async def remove_user(
    user_id: UUID,
    request: RemoveUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a user from company and reassign their data."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Check permissions
    can_remove = False
    if current_user.role == UserRole.ADMIN:
        can_remove = True
    elif current_user.role == UserRole.DIRECTOR and current_user.company_id == user.company_id:
        can_remove = True
    
    if not can_remove:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    # Verify reassign target exists and is in same company
    result = await db.execute(select(User).where(User.id == request.reassign_to_id))
    target_user = result.scalar_one_or_none()
    
    if not target_user or target_user.company_id != user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный пользователь для переназначения данных"
        )
    
    # TODO: Reassign all user's data (declarations, certificates, etc.) to target user
    # This would be done via service layer
    
    # Remove user from company
    user.company_id = None
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Пользователь удален из компании")


@router.post("/{user_id}/role", response_model=ApiResponse[UserWithRoleResponse])
async def assign_role(
    user_id: UUID,
    request: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Assign role to user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if request.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя назначить роль администратора"
        )
    
    old_role = user.role
    user.role = request.role
    
    # If assigning director, update company
    if request.role == UserRole.DIRECTOR and user.company_id:
        result = await db.execute(select(Company).where(Company.id == user.company_id))
        company = result.scalar_one_or_none()
        if company:
            company.director_id = user.id
    
    await db.commit()
    await db.refresh(user)
    
    return ApiResponse(data=UserWithRoleResponse.model_validate(user), success=True)


@router.post("/{user_id}/message", response_model=ApiResponse[None])
async def send_message_to_user(
    user_id: UUID,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin())
):
    """Send message to user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Create notification
    await create_notification(
        db=db,
        user_id=user.id,
        title="Сообщение от администратора",
        message=request.message,
        notification_type="info"
    )
    
    # TODO: Send Telegram message if user has telegram_chat_id
    
    return ApiResponse(data=None, success=True, message="Сообщение отправлено")
