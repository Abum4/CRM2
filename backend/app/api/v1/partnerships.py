from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models import User, Company, Partnership, PartnershipStatus, UserRole
from app.schemas import (
    ApiResponse, PartnershipRequestCreate, PartnershipResponse
)
from app.api.deps import get_current_user
from app.services.notification import create_notification

router = APIRouter(prefix="/partnerships", tags=["Partnerships"])


def partnership_to_response(partnership: Partnership) -> PartnershipResponse:
    """Convert partnership model to response schema."""
    return PartnershipResponse(
        id=partnership.id,
        requesting_company_id=partnership.requesting_company_id,
        target_company_id=partnership.target_company_id,
        note=partnership.note,
        status=partnership.status,
        created_at=partnership.created_at,
        updated_at=partnership.updated_at,
        requesting_company_name=partnership.requesting_company.name if partnership.requesting_company else None,
        target_company_name=partnership.target_company.name if partnership.target_company else None
    )


@router.post("/request", response_model=ApiResponse[PartnershipResponse])
async def request_partnership(
    data: PartnershipRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request partnership with another company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    # Check user is director or senior
    if current_user.role not in [UserRole.DIRECTOR, UserRole.SENIOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только директор или старший сотрудник может запрашивать партнерство"
        )
    
    # Find target company by INN
    result = await db.execute(select(Company).where(Company.inn == data.target_company_inn))
    target_company = result.scalar_one_or_none()
    
    if not target_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Компания с таким ИНН не найдена"
        )
    
    if target_company.id == current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя запросить партнерство с собственной компанией"
        )
    
    # Check if partnership already exists
    result = await db.execute(
        select(Partnership).where(
            ((Partnership.requesting_company_id == current_user.company_id) & 
             (Partnership.target_company_id == target_company.id)) |
            ((Partnership.requesting_company_id == target_company.id) & 
             (Partnership.target_company_id == current_user.company_id))
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Партнерство уже существует или запрос уже отправлен"
        )
    
    # Create partnership request
    partnership = Partnership(
        requesting_company_id=current_user.company_id,
        target_company_id=target_company.id,
        note=data.note,
        status=PartnershipStatus.PENDING
    )
    db.add(partnership)
    
    # Notify target company director
    if target_company.director_id:
        result = await db.execute(select(Company).where(Company.id == current_user.company_id))
        requesting_company = result.scalar_one()
        
        await create_notification(
            db=db,
            user_id=target_company.director_id,
            title="Запрос на партнерство",
            message=f"Компания {requesting_company.name} хочет стать вашим партнером",
            notification_type="info",
            link="/partnerships"
        )
    
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(Partnership)
        .where(Partnership.id == partnership.id)
    )
    partnership = result.scalar_one()
    
    # Load companies manually
    result = await db.execute(select(Company).where(Company.id == partnership.requesting_company_id))
    partnership.requesting_company = result.scalar_one()
    result = await db.execute(select(Company).where(Company.id == partnership.target_company_id))
    partnership.target_company = result.scalar_one()
    
    return ApiResponse(data=partnership_to_response(partnership), success=True)


@router.get("", response_model=ApiResponse[list[PartnershipResponse]])
async def get_partnerships(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all partnerships for current company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    result = await db.execute(
        select(Partnership).where(
            (Partnership.requesting_company_id == current_user.company_id) |
            (Partnership.target_company_id == current_user.company_id)
        )
    )
    partnerships = result.scalars().all()
    
    # Load companies for each partnership
    responses = []
    for p in partnerships:
        result = await db.execute(select(Company).where(Company.id == p.requesting_company_id))
        p.requesting_company = result.scalar_one()
        result = await db.execute(select(Company).where(Company.id == p.target_company_id))
        p.target_company = result.scalar_one()
        responses.append(partnership_to_response(p))
    
    return ApiResponse(data=responses, success=True)


@router.get("/partners", response_model=ApiResponse[list[dict]])
async def get_partners(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get accepted partners for current company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо быть в компании"
        )
    
    result = await db.execute(
        select(Partnership).where(
            ((Partnership.requesting_company_id == current_user.company_id) |
             (Partnership.target_company_id == current_user.company_id)) &
            (Partnership.status == PartnershipStatus.ACCEPTED)
        )
    )
    partnerships = result.scalars().all()
    
    partners = []
    for p in partnerships:
        partner_id = p.target_company_id if p.requesting_company_id == current_user.company_id else p.requesting_company_id
        result = await db.execute(select(Company).where(Company.id == partner_id))
        partner_company = result.scalar_one()
        partners.append({
            "id": str(partner_company.id),
            "name": partner_company.name,
            "inn": partner_company.inn,
            "activity_type": partner_company.activity_type
        })
    
    return ApiResponse(data=partners, success=True)


@router.post("/{partnership_id}/accept", response_model=ApiResponse[PartnershipResponse])
async def accept_partnership(
    partnership_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a partnership request."""
    result = await db.execute(select(Partnership).where(Partnership.id == partnership_id))
    partnership = result.scalar_one_or_none()
    
    if not partnership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    if partnership.target_company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для принятия этого запроса"
        )
    
    if current_user.role not in [UserRole.DIRECTOR, UserRole.SENIOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только директор или старший сотрудник может принимать партнерство"
        )
    
    partnership.status = PartnershipStatus.ACCEPTED
    
    # Notify requesting company director
    result = await db.execute(select(Company).where(Company.id == partnership.requesting_company_id))
    requesting_company = result.scalar_one()
    
    if requesting_company.director_id:
        result = await db.execute(select(Company).where(Company.id == current_user.company_id))
        target_company = result.scalar_one()
        
        await create_notification(
            db=db,
            user_id=requesting_company.director_id,
            title="Партнерство принято",
            message=f"Компания {target_company.name} приняла ваш запрос на партнерство",
            notification_type="success",
            link="/partnerships"
        )
    
    await db.commit()
    await db.refresh(partnership)
    
    # Load companies
    result = await db.execute(select(Company).where(Company.id == partnership.requesting_company_id))
    partnership.requesting_company = result.scalar_one()
    result = await db.execute(select(Company).where(Company.id == partnership.target_company_id))
    partnership.target_company = result.scalar_one()
    
    return ApiResponse(data=partnership_to_response(partnership), success=True)


@router.post("/{partnership_id}/reject", response_model=ApiResponse[PartnershipResponse])
async def reject_partnership(
    partnership_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a partnership request."""
    result = await db.execute(select(Partnership).where(Partnership.id == partnership_id))
    partnership = result.scalar_one_or_none()
    
    if not partnership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запрос не найден"
        )
    
    if partnership.target_company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для отклонения этого запроса"
        )
    
    partnership.status = PartnershipStatus.REJECTED
    
    await db.commit()
    await db.refresh(partnership)
    
    # Load companies
    result = await db.execute(select(Company).where(Company.id == partnership.requesting_company_id))
    partnership.requesting_company = result.scalar_one()
    result = await db.execute(select(Company).where(Company.id == partnership.target_company_id))
    partnership.target_company = result.scalar_one()
    
    return ApiResponse(data=partnership_to_response(partnership), success=True)


@router.delete("/{partnership_id}", response_model=ApiResponse[None])
async def delete_partnership(
    partnership_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a partnership."""
    result = await db.execute(select(Partnership).where(Partnership.id == partnership_id))
    partnership = result.scalar_one_or_none()
    
    if not partnership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнерство не найдено"
        )
    
    if partnership.requesting_company_id != current_user.company_id and partnership.target_company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к партнерству"
        )
    
    await db.delete(partnership)
    await db.commit()
    
    return ApiResponse(data=None, success=True, message="Партнерство удалено")
