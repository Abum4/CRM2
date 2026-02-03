import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class PartnershipStatus(str, PyEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Partnership(Base):
    __tablename__ = "partnerships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requesting_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    target_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(Enum(PartnershipStatus), default=PartnershipStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    requesting_company = relationship("Company", back_populates="partnership_requests_sent", foreign_keys=[requesting_company_id])
    target_company = relationship("Company", back_populates="partnership_requests_received", foreign_keys=[target_company_id])
    
    def __repr__(self):
        return f"<Partnership {self.requesting_company_id} -> {self.target_company_id} ({self.status})>"
