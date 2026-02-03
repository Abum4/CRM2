from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.models import User, Document, Folder, Client, UserRole, AccessType
from app.schemas import (
    ApiResponse, DocumentResponse, FolderCreate, FolderUpdate, FolderResponse
)
from app.api.deps import get_current_user
from app.utils.files import save_upload_file, delete_file

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=ApiResponse[DocumentResponse])
async def upload_document(
    file: UploadFile = File(...),
    folder_id: Optional[UUID] = None,
    client_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a document."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Verify folder exists if provided
    if folder_id:
        result = await db.execute(select(Folder).where(Folder.id == folder_id))
        folder = result.scalar_one_or_none()
        if not folder or folder.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Папка не найдена"
            )
    
    # Save file
    file_url, file_type, file_size = await save_upload_file(file, str(current_user.company_id))
    
    # Create document record
    document = Document(
        name=file.filename or "file",
        file_url=file_url,
        file_type=file_type,
        file_size=file_size,
        folder_id=folder_id,
        client_id=client_id,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return ApiResponse(data=DocumentResponse.model_validate(document), success=True)


@router.get("", response_model=ApiResponse[list[DocumentResponse]])
async def get_documents(
    folder_id: Optional[UUID] = None,
    client_id: Optional[UUID] = None,
    owner_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get documents with optional filters."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    query = select(Document).where(Document.company_id == current_user.company_id)
    
    if folder_id:
        query = query.where(Document.folder_id == folder_id)
    
    if client_id:
        query = query.where(Document.client_id == client_id)
    
    if owner_id:
        query = query.where(Document.owner_id == owner_id)
    
    result = await db.execute(query.order_by(Document.created_at.desc()))
    documents = result.scalars().all()
    
    return ApiResponse(
        data=[DocumentResponse.model_validate(d) for d in documents],
        success=True
    )


@router.get("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document by ID."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    if document.company_id != current_user.company_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к документу"
        )
    
    return ApiResponse(data=DocumentResponse.model_validate(document), success=True)


@router.delete("/{document_id}", response_model=ApiResponse[None])
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    if document.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к документу"
        )
    
    # Delete file from storage
    await delete_file(document.file_url)
    
    await db.delete(document)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Документ удален")


# Folders

@router.post("/folders", response_model=ApiResponse[FolderResponse])
async def create_folder(
    data: FolderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a folder."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Verify parent folder if provided
    if data.parent_id:
        result = await db.execute(select(Folder).where(Folder.id == data.parent_id))
        parent = result.scalar_one_or_none()
        if not parent or parent.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Родительская папка не найдена"
            )
    
    folder = Folder(
        name=data.name,
        parent_id=data.parent_id,
        access_type=data.access_type,
        client_id=data.client_id,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    db.add(folder)
    await db.flush()
    
    # Add access users if access type is 'selected'
    if data.access_type == AccessType.SELECTED and data.access_user_ids:
        result = await db.execute(
            select(User).where(User.id.in_(data.access_user_ids))
        )
        users = result.scalars().all()
        folder.access_users = list(users)
    
    await db.commit()
    await db.refresh(folder)
    
    return ApiResponse(
        data=FolderResponse(
            id=folder.id,
            name=folder.name,
            parent_id=folder.parent_id,
            access_type=folder.access_type,
            access_user_ids=[u.id for u in folder.access_users] if folder.access_users else [],
            client_id=folder.client_id,
            owner_id=folder.owner_id,
            company_id=folder.company_id,
            created_at=folder.created_at,
            updated_at=folder.updated_at
        ),
        success=True
    )


@router.get("/folders", response_model=ApiResponse[list[FolderResponse]])
async def get_folders(
    parent_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get folders."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    query = select(Folder).options(selectinload(Folder.access_users)).where(
        Folder.company_id == current_user.company_id
    )
    
    if parent_id:
        query = query.where(Folder.parent_id == parent_id)
    else:
        query = query.where(Folder.parent_id == None)
    
    result = await db.execute(query.order_by(Folder.name))
    folders = result.scalars().all()
    
    # Filter by access
    accessible_folders = []
    for folder in folders:
        if folder.access_type == AccessType.PUBLIC:
            accessible_folders.append(folder)
        elif folder.access_type == AccessType.PRIVATE and folder.owner_id == current_user.id:
            accessible_folders.append(folder)
        elif folder.access_type == AccessType.SELECTED:
            if folder.owner_id == current_user.id or current_user.id in [u.id for u in folder.access_users]:
                accessible_folders.append(folder)
        
        # Directors can see all
        if current_user.role in [UserRole.DIRECTOR, UserRole.SENIOR, UserRole.ADMIN]:
            if folder not in accessible_folders:
                accessible_folders.append(folder)
    
    return ApiResponse(
        data=[
            FolderResponse(
                id=f.id,
                name=f.name,
                parent_id=f.parent_id,
                access_type=f.access_type,
                access_user_ids=[u.id for u in f.access_users] if f.access_users else [],
                client_id=f.client_id,
                owner_id=f.owner_id,
                company_id=f.company_id,
                created_at=f.created_at,
                updated_at=f.updated_at
            ) for f in accessible_folders
        ],
        success=True
    )


@router.put("/folders/{folder_id}", response_model=ApiResponse[FolderResponse])
async def update_folder(
    folder_id: UUID,
    data: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a folder."""
    result = await db.execute(
        select(Folder).options(selectinload(Folder.access_users)).where(Folder.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Папка не найдена"
        )
    
    if folder.owner_id != current_user.id and current_user.role not in [UserRole.DIRECTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для редактирования"
        )
    
    # Update fields
    update_dict = data.model_dump(exclude_unset=True, exclude={"access_user_ids"})
    for key, value in update_dict.items():
        setattr(folder, key, value)
    
    if data.access_user_ids is not None:
        result = await db.execute(
            select(User).where(User.id.in_(data.access_user_ids))
        )
        users = result.scalars().all()
        folder.access_users = list(users)
    
    await db.commit()
    await db.refresh(folder)
    
    return ApiResponse(
        data=FolderResponse(
            id=folder.id,
            name=folder.name,
            parent_id=folder.parent_id,
            access_type=folder.access_type,
            access_user_ids=[u.id for u in folder.access_users] if folder.access_users else [],
            client_id=folder.client_id,
            owner_id=folder.owner_id,
            company_id=folder.company_id,
            created_at=folder.created_at,
            updated_at=folder.updated_at
        ),
        success=True
    )


@router.delete("/folders/{folder_id}", response_model=ApiResponse[None])
async def delete_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a folder."""
    result = await db.execute(select(Folder).where(Folder.id == folder_id))
    folder = result.scalar_one_or_none()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Папка не найдена"
        )
    
    if folder.owner_id != current_user.id and current_user.role not in [UserRole.DIRECTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для удаления"
        )
    
    await db.delete(folder)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Папка удалена")
