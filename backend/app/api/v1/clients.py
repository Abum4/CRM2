from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models import User, Client, UserRole, AccessType
from app.schemas import (
    ApiResponse, ClientCreate, ClientUpdate, ClientResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])


def client_to_response(client: Client) -> ClientResponse:
    """Convert client model to response schema."""
    return ClientResponse(
        id=client.id,
        company_name=client.company_name,
        inn=client.inn,
        director_name=client.director_name,
        note=client.note,
        access_type=client.access_type,
        access_user_ids=[u.id for u in client.access_users] if client.access_users else [],
        owner_id=client.owner_id,
        company_id=client.company_id,
        created_at=client.created_at,
        updated_at=client.updated_at
    )


@router.post("", response_model=ApiResponse[ClientResponse])
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new client."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    client = Client(
        company_name=data.company_name,
        inn=data.inn,
        director_name=data.director_name,
        note=data.note,
        access_type=data.access_type,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(client)
    await db.flush()
    
    # Add access users if selected
    if data.access_type == AccessType.SELECTED and data.access_user_ids:
        result = await db.execute(
            select(User).where(User.id.in_(data.access_user_ids))
        )
        users = result.scalars().all()
        client.access_users = list(users)
    
    await db.commit()
    
    # Reload
    result = await db.execute(
        select(Client).options(selectinload(Client.access_users)).where(Client.id == client.id)
    )
    client = result.scalar_one()
    
    return ApiResponse(data=client_to_response(client), success=True)


@router.get("", response_model=ApiResponse[list[ClientResponse]])
async def get_clients(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get clients."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    query = select(Client).options(selectinload(Client.access_users)).where(
        Client.company_id == current_user.company_id
    )
    
    if search:
        query = query.where(
            Client.company_name.ilike(f"%{search}%") |
            Client.inn.ilike(f"%{search}%") |
            Client.director_name.ilike(f"%{search}%")
        )
    
    result = await db.execute(query.order_by(Client.company_name))
    clients = result.scalars().all()
    
    # Filter by access
    accessible_clients = []
    for client in clients:
        if client.access_type == AccessType.PUBLIC:
            accessible_clients.append(client)
        elif client.access_type == AccessType.PRIVATE and client.owner_id == current_user.id:
            accessible_clients.append(client)
        elif client.access_type == AccessType.SELECTED:
            if client.owner_id == current_user.id or current_user.id in [u.id for u in client.access_users]:
                accessible_clients.append(client)
        
        # Directors can see all
        if current_user.role in [UserRole.DIRECTOR, UserRole.SENIOR, UserRole.ADMIN]:
            if client not in accessible_clients:
                accessible_clients.append(client)
    
    return ApiResponse(
        data=[client_to_response(c) for c in accessible_clients],
        success=True
    )


@router.get("/{client_id}", response_model=ApiResponse[ClientResponse])
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get client by ID."""
    result = await db.execute(
        select(Client).options(selectinload(Client.access_users)).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    if client.company_id != current_user.company_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к клиенту"
        )
    
    return ApiResponse(data=client_to_response(client), success=True)


@router.put("/{client_id}", response_model=ApiResponse[ClientResponse])
async def update_client(
    client_id: UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a client."""
    result = await db.execute(
        select(Client).options(selectinload(Client.access_users)).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    if client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к клиенту"
        )
    
    # Update fields
    update_dict = data.model_dump(exclude_unset=True, exclude={"access_user_ids"})
    for key, value in update_dict.items():
        setattr(client, key, value)
    
    if data.access_user_ids is not None:
        result = await db.execute(
            select(User).where(User.id.in_(data.access_user_ids))
        )
        users = result.scalars().all()
        client.access_users = list(users)
    
    await db.commit()
    await db.refresh(client)
    
    return ApiResponse(data=client_to_response(client), success=True)


@router.delete("/{client_id}", response_model=ApiResponse[None])
async def delete_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a client."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    if client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к клиенту"
        )
    
    await db.delete(client)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Клиент удален")


@router.post("/{client_id}/redirect", response_model=ApiResponse[ClientResponse])
async def redirect_client(
    client_id: UUID,
    to_user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Redirect client to another user."""
    result = await db.execute(
        select(Client).options(selectinload(Client.access_users)).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Verify target user
    result = await db.execute(select(User).where(User.id == to_user_id))
    target_user = result.scalar_one_or_none()
    
    if not target_user or target_user.company_id != client.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь не найден в компании"
        )
    
    client.owner_id = to_user_id
    await db.commit()
    await db.refresh(client)
    
    return ApiResponse(data=client_to_response(client), success=True)
