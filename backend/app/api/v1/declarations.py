from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    User, Declaration, DeclarationGroup, Vehicle, Client, Document, Folder, UserRole
)
from app.models.declaration import DeclarationMode, VehicleType
from app.schemas import (
    ApiResponse, PaginatedResponse, 
    DeclarationCreate, DeclarationUpdate, DeclarationResponse,
    DeclarationRedirectRequest, DeclarationGroupCreate, DeclarationGroupResponse,
    DeclarationGroupAddRemove, VehicleResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/declarations", tags=["Declarations"])


def declaration_to_response(decl: Declaration) -> DeclarationResponse:
    """Convert declaration model to response schema."""
    return DeclarationResponse(
        id=decl.id,
        post_number=decl.post_number,
        date=decl.date,
        declaration_number=decl.declaration_number,
        formatted_number=decl.formatted_number,
        client_id=decl.client_id,
        mode=decl.mode,
        note=decl.note,
        vehicles=[VehicleResponse(id=v.id, number=v.number, type=v.type) for v in decl.vehicles],
        attached_document_ids=[d.id for d in decl.attached_documents],
        attached_folder_ids=[f.id for f in decl.attached_folders],
        group_id=decl.group_id,
        owner_id=decl.owner_id,
        company_id=decl.company_id,
        created_at=decl.created_at,
        updated_at=decl.updated_at
    )


@router.post("", response_model=ApiResponse[DeclarationResponse])
async def create_declaration(
    data: DeclarationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new declaration."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании для создания декларации"
        )
    
    # Verify client exists and user has access
    result = await db.execute(select(Client).where(Client.id == data.client_id))
    client = result.scalar_one_or_none()
    if not client or client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Create declaration
    declaration = Declaration(
        post_number=data.post_number,
        date=data.date,
        declaration_number=data.declaration_number,
        client_id=data.client_id,
        mode=data.mode,
        note=data.note,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(declaration)
    await db.flush()
    
    # Add vehicles
    for vehicle_data in data.vehicles:
        vehicle = Vehicle(
            declaration_id=declaration.id,
            number=vehicle_data.number,
            type=vehicle_data.type
        )
        db.add(vehicle)
    
    # Attach documents
    if data.attached_document_ids:
        result = await db.execute(
            select(Document).where(Document.id.in_(data.attached_document_ids))
        )
        documents = result.scalars().all()
        declaration.attached_documents = list(documents)
    
    # Attach folders
    if data.attached_folder_ids:
        result = await db.execute(
            select(Folder).where(Folder.id.in_(data.attached_folder_ids))
        )
        folders = result.scalars().all()
        declaration.attached_folders = list(folders)
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Declaration)
        .options(
            selectinload(Declaration.vehicles),
            selectinload(Declaration.attached_documents),
            selectinload(Declaration.attached_folders)
        )
        .where(Declaration.id == declaration.id)
    )
    declaration = result.scalar_one()
    
    return ApiResponse(data=declaration_to_response(declaration), success=True)


@router.get("", response_model=PaginatedResponse[DeclarationResponse])
async def get_declarations(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    post_number: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    declaration_number: Optional[str] = None,
    client_id: Optional[UUID] = None,
    mode: Optional[DeclarationMode] = None,
    vehicle_number: Optional[str] = None,
    vehicle_type: Optional[VehicleType] = None,
    owner_id: Optional[UUID] = None,
    owner_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get declarations with filters."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Base query
    query = select(Declaration).where(Declaration.company_id == current_user.company_id)
    
    # Apply filters
    if owner_type == "mine":
        query = query.where(Declaration.owner_id == current_user.id)
    elif owner_type == "employee" and owner_id:
        query = query.where(Declaration.owner_id == owner_id)
    
    if post_number:
        query = query.where(Declaration.post_number.contains(post_number))
    
    if declaration_number:
        query = query.where(Declaration.declaration_number.contains(declaration_number))
    
    if date_from:
        query = query.where(Declaration.date >= date_from)
    
    if date_to:
        query = query.where(Declaration.date <= date_to)
    
    if client_id:
        query = query.where(Declaration.client_id == client_id)
    
    if mode:
        query = query.where(Declaration.mode == mode)
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        query
        .options(
            selectinload(Declaration.vehicles),
            selectinload(Declaration.attached_documents),
            selectinload(Declaration.attached_folders)
        )
        .order_by(Declaration.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    declarations = result.scalars().all()
    
    return PaginatedResponse.create(
        data=[declaration_to_response(d) for d in declarations],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{declaration_id}", response_model=ApiResponse[DeclarationResponse])
async def get_declaration(
    declaration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get declaration by ID."""
    result = await db.execute(
        select(Declaration)
        .options(
            selectinload(Declaration.vehicles),
            selectinload(Declaration.attached_documents),
            selectinload(Declaration.attached_folders)
        )
        .where(Declaration.id == declaration_id)
    )
    declaration = result.scalar_one_or_none()
    
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Декларация не найдена"
        )
    
    # Check access
    if declaration.company_id != current_user.company_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой декларации"
        )
    
    return ApiResponse(data=declaration_to_response(declaration), success=True)


@router.put("/{declaration_id}", response_model=ApiResponse[DeclarationResponse])
async def update_declaration(
    declaration_id: UUID,
    data: DeclarationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a declaration."""
    result = await db.execute(
        select(Declaration)
        .options(selectinload(Declaration.vehicles))
        .where(Declaration.id == declaration_id)
    )
    declaration = result.scalar_one_or_none()
    
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Декларация не найдена"
        )
    
    # Check access
    if declaration.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой декларации"
        )
    
    # Update fields
    update_dict = data.model_dump(exclude_unset=True, exclude={"vehicles", "attached_document_ids", "attached_folder_ids"})
    for key, value in update_dict.items():
        setattr(declaration, key, value)
    
    # Update vehicles if provided
    if data.vehicles is not None:
        # Remove old vehicles
        for vehicle in declaration.vehicles:
            await db.delete(vehicle)
        
        # Add new vehicles
        for vehicle_data in data.vehicles:
            vehicle = Vehicle(
                declaration_id=declaration.id,
                number=vehicle_data.number,
                type=vehicle_data.type
            )
            db.add(vehicle)
    
    # Update document attachments
    if data.attached_document_ids is not None:
        result = await db.execute(
            select(Document).where(Document.id.in_(data.attached_document_ids))
        )
        documents = result.scalars().all()
        declaration.attached_documents = list(documents)
    
    # Update folder attachments
    if data.attached_folder_ids is not None:
        result = await db.execute(
            select(Folder).where(Folder.id.in_(data.attached_folder_ids))
        )
        folders = result.scalars().all()
        declaration.attached_folders = list(folders)
    
    await db.commit()
    
    # Reload
    result = await db.execute(
        select(Declaration)
        .options(
            selectinload(Declaration.vehicles),
            selectinload(Declaration.attached_documents),
            selectinload(Declaration.attached_folders)
        )
        .where(Declaration.id == declaration_id)
    )
    declaration = result.scalar_one()
    
    return ApiResponse(data=declaration_to_response(declaration), success=True)


@router.delete("/{declaration_id}", response_model=ApiResponse[None])
async def delete_declaration(
    declaration_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a declaration."""
    result = await db.execute(
        select(Declaration).where(Declaration.id == declaration_id)
    )
    declaration = result.scalar_one_or_none()
    
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Декларация не найдена"
        )
    
    if declaration.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой декларации"
        )
    
    await db.delete(declaration)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Декларация удалена")


@router.post("/{declaration_id}/redirect", response_model=ApiResponse[DeclarationResponse])
async def redirect_declaration(
    declaration_id: UUID,
    data: DeclarationRedirectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Redirect declaration to another user."""
    result = await db.execute(
        select(Declaration)
        .options(
            selectinload(Declaration.vehicles),
            selectinload(Declaration.attached_documents),
            selectinload(Declaration.attached_folders)
        )
        .where(Declaration.id == declaration_id)
    )
    declaration = result.scalar_one_or_none()
    
    if not declaration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Декларация не найдена"
        )
    
    # Verify target user is in same company
    result = await db.execute(select(User).where(User.id == data.to_user_id))
    target_user = result.scalar_one_or_none()
    
    if not target_user or target_user.company_id != declaration.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь не найден в компании"
        )
    
    declaration.owner_id = data.to_user_id
    await db.commit()
    await db.refresh(declaration)
    
    return ApiResponse(data=declaration_to_response(declaration), success=True)


# Groups

@router.post("/groups", response_model=ApiResponse[DeclarationGroupResponse])
async def create_group(
    data: DeclarationGroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a declaration group."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    group = DeclarationGroup(
        name=data.name,
        company_id=current_user.company_id
    )
    db.add(group)
    await db.flush()
    
    # Add declarations to group
    result = await db.execute(
        select(Declaration).where(
            Declaration.id.in_(data.declaration_ids),
            Declaration.company_id == current_user.company_id
        )
    )
    declarations = result.scalars().all()
    
    for decl in declarations:
        decl.group_id = group.id
    
    await db.commit()
    await db.refresh(group)
    
    return ApiResponse(
        data=DeclarationGroupResponse(
            id=group.id,
            name=group.name,
            declaration_ids=data.declaration_ids,
            company_id=group.company_id,
            created_at=group.created_at
        ),
        success=True
    )


@router.get("/groups", response_model=ApiResponse[list[DeclarationGroupResponse]])
async def get_groups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all declaration groups."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    result = await db.execute(
        select(DeclarationGroup)
        .options(selectinload(DeclarationGroup.declarations))
        .where(DeclarationGroup.company_id == current_user.company_id)
    )
    groups = result.scalars().all()
    
    response_groups = []
    for group in groups:
        response_groups.append(DeclarationGroupResponse(
            id=group.id,
            name=group.name,
            declaration_ids=[d.id for d in group.declarations],
            company_id=group.company_id,
            created_at=group.created_at
        ))
    
    return ApiResponse(data=response_groups, success=True)


@router.post("/groups/{group_id}/add", response_model=ApiResponse[DeclarationGroupResponse])
async def add_to_group(
    group_id: UUID,
    data: DeclarationGroupAddRemove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add declarations to a group."""
    result = await db.execute(
        select(DeclarationGroup)
        .options(selectinload(DeclarationGroup.declarations))
        .where(DeclarationGroup.id == group_id)
    )
    group = result.scalar_one_or_none()
    
    if not group or group.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена"
        )
    
    result = await db.execute(
        select(Declaration).where(
            Declaration.id.in_(data.declaration_ids),
            Declaration.company_id == current_user.company_id
        )
    )
    declarations = result.scalars().all()
    
    for decl in declarations:
        decl.group_id = group.id
    
    await db.commit()
    await db.refresh(group)
    
    return ApiResponse(
        data=DeclarationGroupResponse(
            id=group.id,
            name=group.name,
            declaration_ids=[d.id for d in group.declarations],
            company_id=group.company_id,
            created_at=group.created_at
        ),
        success=True
    )


@router.post("/groups/{group_id}/remove", response_model=ApiResponse[DeclarationGroupResponse])
async def remove_from_group(
    group_id: UUID,
    data: DeclarationGroupAddRemove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove declarations from a group."""
    result = await db.execute(
        select(DeclarationGroup)
        .options(selectinload(DeclarationGroup.declarations))
        .where(DeclarationGroup.id == group_id)
    )
    group = result.scalar_one_or_none()
    
    if not group or group.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Группа не найдена"
        )
    
    result = await db.execute(
        select(Declaration).where(Declaration.id.in_(data.declaration_ids))
    )
    declarations = result.scalars().all()
    
    for decl in declarations:
        if decl.group_id == group.id:
            decl.group_id = None
    
    await db.commit()
    
    # Reload group
    result = await db.execute(
        select(DeclarationGroup)
        .options(selectinload(DeclarationGroup.declarations))
        .where(DeclarationGroup.id == group_id)
    )
    group = result.scalar_one()
    
    return ApiResponse(
        data=DeclarationGroupResponse(
            id=group.id,
            name=group.name,
            declaration_ids=[d.id for d in group.declarations],
            company_id=group.company_id,
            created_at=group.created_at
        ),
        success=True
    )
