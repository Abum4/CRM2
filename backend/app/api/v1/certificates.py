from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import (
    User, Company, Certificate, CertificateAction, CertificateStatus, 
    Client, Document, Folder, Declaration, UserRole
)
from app.schemas import (
    ApiResponse, PaginatedResponse,
    CertificateCreate, CertificateUpdate, CertificateResponse,
    CertificateRedirectRequest, CertificateStatusUpdateRequest,
    CertificateFillNumberRequest, CertificateAttachPaymentRequest,
    CertificateActionResponse
)
from app.api.deps import get_current_user
from app.services.notification import create_notification

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def certificate_to_response(cert: Certificate) -> CertificateResponse:
    """Convert certificate model to response schema."""
    return CertificateResponse(
        id=cert.id,
        certifier_company_id=cert.certifier_company_id,
        type=cert.type,
        deadline=cert.deadline,
        number=cert.number,
        number_to_be_filled_by_certifier=cert.number_to_be_filled_by_certifier,
        client_id=cert.client_id,
        note=cert.note,
        sent_date=cert.sent_date,
        status=cert.status,
        owner_id=cert.owner_id,
        assigned_to_id=cert.assigned_to_id,
        company_id=cert.company_id,
        certifier_company_name=cert.certifier_company.name if cert.certifier_company else None,
        certifier_name=cert.assigned_to.full_name if cert.assigned_to else None,
        declarant_company_id=cert.declarant_company_id,
        declarant_company_name=cert.declarant_company.name if cert.declarant_company else None,
        declarant_name=cert.owner.full_name if cert.owner else None,
        linked_declaration_ids=[d.id for d in cert.linked_declarations] if cert.linked_declarations else [],
        attached_document_ids=[d.id for d in cert.attached_documents] if cert.attached_documents else [],
        attached_folder_ids=[f.id for f in cert.attached_folders] if cert.attached_folders else [],
        actions=[
            CertificateActionResponse(
                id=a.id,
                certificate_id=a.certificate_id,
                action=a.action,
                note=a.note,
                attached_file_ids=[f.id for f in a.attached_files] if a.attached_files else [],
                performed_by=a.performed_by_id,
                created_at=a.created_at
            ) for a in cert.actions
        ] if cert.actions else [],
        created_at=cert.created_at,
        updated_at=cert.updated_at
    )


@router.post("", response_model=ApiResponse[CertificateResponse])
async def create_certificate(
    data: CertificateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new certificate request."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Verify client exists
    result = await db.execute(select(Client).where(Client.id == data.client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Create certificate
    certificate = Certificate(
        certifier_company_id=data.certifier_company_id,
        type=data.type,
        deadline=data.deadline,
        number=data.number,
        number_to_be_filled_by_certifier=data.number_to_be_filled_by_certifier,
        client_id=data.client_id,
        note=data.note,
        sent_date=datetime.utcnow(),
        status=CertificateStatus.IN_PROGRESS,
        owner_id=current_user.id,
        company_id=current_user.company_id,
        declarant_company_id=current_user.company_id if data.certifier_company_id else None
    )
    db.add(certificate)
    await db.flush()
    
    # Link declarations
    if data.linked_declaration_ids:
        result = await db.execute(
            select(Declaration).where(Declaration.id.in_(data.linked_declaration_ids))
        )
        declarations = result.scalars().all()
        certificate.linked_declarations = list(declarations)
    
    # Attach documents
    if data.attached_document_ids:
        result = await db.execute(
            select(Document).where(Document.id.in_(data.attached_document_ids))
        )
        documents = result.scalars().all()
        certificate.attached_documents = list(documents)
    
    # Attach folders
    if data.attached_folder_ids:
        result = await db.execute(
            select(Folder).where(Folder.id.in_(data.attached_folder_ids))
        )
        folders = result.scalars().all()
        certificate.attached_folders = list(folders)
    
    # Create initial action
    action = CertificateAction(
        certificate_id=certificate.id,
        action="Создан запрос на сертификат",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    # Notify certifier company director if applicable
    if data.certifier_company_id:
        result = await db.execute(
            select(Company).where(Company.id == data.certifier_company_id)
        )
        certifier_company = result.scalar_one_or_none()
        if certifier_company and certifier_company.director_id:
            await create_notification(
                db=db,
                user_id=certifier_company.director_id,
                title="Новая заявка на сертификат",
                message=f"Получена заявка на сертификат от {current_user.full_name}",
                notification_type="info",
                link="/certificates"
            )
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.linked_declarations),
            selectinload(Certificate.attached_documents),
            selectinload(Certificate.attached_folders),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate.id)
    )
    certificate = result.scalar_one()
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.get("", response_model=PaginatedResponse[CertificateResponse])
async def get_certificates(
    page: int = 1,
    page_size: int = 20,
    certifier_company_id: Optional[UUID] = None,
    number: Optional[str] = None,
    client_id: Optional[UUID] = None,
    status: Optional[CertificateStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    owner_id: Optional[UUID] = None,
    owner_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get certificates with filters."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Query certificates where user's company is either owner or certifier
    query = select(Certificate).where(
        (Certificate.company_id == current_user.company_id) |
        (Certificate.certifier_company_id == current_user.company_id)
    )
    
    # Apply filters
    if owner_type == "mine":
        query = query.where(
            (Certificate.owner_id == current_user.id) | 
            (Certificate.assigned_to_id == current_user.id)
        )
    elif owner_type == "employee" and owner_id:
        query = query.where(
            (Certificate.owner_id == owner_id) |
            (Certificate.assigned_to_id == owner_id)
        )
    
    if certifier_company_id:
        query = query.where(Certificate.certifier_company_id == certifier_company_id)
    
    if number:
        query = query.where(Certificate.number.contains(number))
    
    if client_id:
        query = query.where(Certificate.client_id == client_id)
    
    if status:
        query = query.where(Certificate.status == status)
    
    if date_from:
        query = query.where(Certificate.sent_date >= datetime.combine(date_from, datetime.min.time()))
    
    if date_to:
        query = query.where(Certificate.sent_date <= datetime.combine(date_to, datetime.max.time()))
    
    # Count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        query
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.linked_declarations),
            selectinload(Certificate.attached_documents),
            selectinload(Certificate.attached_folders),
            selectinload(Certificate.actions)
        )
        .order_by(Certificate.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    certificates = result.scalars().all()
    
    return PaginatedResponse.create(
        data=[certificate_to_response(c) for c in certificates],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{certificate_id}", response_model=ApiResponse[CertificateResponse])
async def get_certificate(
    certificate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get certificate by ID."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.linked_declarations),
            selectinload(Certificate.attached_documents),
            selectinload(Certificate.attached_folders),
            selectinload(Certificate.actions).selectinload(CertificateAction.attached_files)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    # Check access
    has_access = (
        certificate.company_id == current_user.company_id or
        certificate.certifier_company_id == current_user.company_id or
        current_user.role == UserRole.ADMIN
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому сертификату"
        )
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.put("/{certificate_id}", response_model=ApiResponse[CertificateResponse])
async def update_certificate(
    certificate_id: UUID,
    data: CertificateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a certificate."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.linked_declarations),
            selectinload(Certificate.attached_documents),
            selectinload(Certificate.attached_folders),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    # Update fields
    update_dict = data.model_dump(exclude_unset=True, exclude={"linked_declaration_ids", "attached_document_ids", "attached_folder_ids"})
    for key, value in update_dict.items():
        setattr(certificate, key, value)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.delete("/{certificate_id}", response_model=ApiResponse[None])
async def delete_certificate(
    certificate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a certificate."""
    result = await db.execute(
        select(Certificate).where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    if certificate.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому сертификату"
        )
    
    await db.delete(certificate)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Сертификат удален")


@router.post("/{certificate_id}/redirect", response_model=ApiResponse[CertificateResponse])
async def redirect_certificate(
    certificate_id: UUID,
    data: CertificateRedirectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Redirect certificate to another user."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    # Verify target user
    result = await db.execute(select(User).where(User.id == data.to_user_id))
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь не найден"
        )
    
    certificate.assigned_to_id = data.to_user_id
    
    # Add action
    action = CertificateAction(
        certificate_id=certificate.id,
        action=f"Перенаправлен на {target_user.full_name}",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.post("/{certificate_id}/status", response_model=ApiResponse[CertificateResponse])
async def update_certificate_status(
    certificate_id: UUID,
    data: CertificateStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update certificate status."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    old_status = certificate.status
    certificate.status = data.status
    
    # Create action
    status_names = {
        CertificateStatus.IN_PROGRESS: "В процессе",
        CertificateStatus.AWAITING_PAYMENT: "Ожидание оплаты",
        CertificateStatus.ON_REVIEW: "На проверке",
        CertificateStatus.COMPLETED: "Завершен",
        CertificateStatus.REJECTED: "Отклонен"
    }
    
    action = CertificateAction(
        certificate_id=certificate.id,
        action=f"Статус изменен на: {status_names.get(data.status, data.status)}",
        note=data.note,
        performed_by_id=current_user.id
    )
    db.add(action)
    
    # Notify owner about status change
    if certificate.owner_id != current_user.id:
        await create_notification(
            db=db,
            user_id=certificate.owner_id,
            title="Статус сертификата изменен",
            message=f"Сертификат {certificate.number or certificate.type} - {status_names.get(data.status, data.status)}",
            notification_type="info",
            link=f"/certificates/{certificate_id}"
        )
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.post("/{certificate_id}/number", response_model=ApiResponse[CertificateResponse])
async def fill_certificate_number(
    certificate_id: UUID,
    data: CertificateFillNumberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fill certificate number (by certifier)."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    certificate.number = data.number
    
    action = CertificateAction(
        certificate_id=certificate.id,
        action=f"Заполнен номер сертификата: {data.number}",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.post("/{certificate_id}/confirm-payment", response_model=ApiResponse[CertificateResponse])
async def confirm_payment(
    certificate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm payment for certificate."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    action = CertificateAction(
        certificate_id=certificate.id,
        action="Платеж подтвержден",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.post("/{certificate_id}/confirm-review", response_model=ApiResponse[CertificateResponse])
async def confirm_review(
    certificate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm review for certificate."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    action = CertificateAction(
        certificate_id=certificate.id,
        action="Проверка подтверждена",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)


@router.post("/{certificate_id}/attach-payment", response_model=ApiResponse[CertificateResponse])
async def attach_payment_files(
    certificate_id: UUID,
    data: CertificateAttachPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Attach payment files to certificate."""
    result = await db.execute(
        select(Certificate)
        .options(
            selectinload(Certificate.certifier_company),
            selectinload(Certificate.owner),
            selectinload(Certificate.assigned_to),
            selectinload(Certificate.declarant_company),
            selectinload(Certificate.actions),
            selectinload(Certificate.payment_files)
        )
        .where(Certificate.id == certificate_id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден"
        )
    
    # Get documents
    result = await db.execute(
        select(Document).where(Document.id.in_(data.file_ids))
    )
    documents = result.scalars().all()
    certificate.payment_files = list(documents)
    
    action = CertificateAction(
        certificate_id=certificate.id,
        action="Прикреплены платежные документы",
        performed_by_id=current_user.id
    )
    db.add(action)
    
    await db.commit()
    await db.refresh(certificate)
    
    return ApiResponse(data=certificate_to_response(certificate), success=True)
