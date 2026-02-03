import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user import ActivityType


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    inn = Column(String(9), unique=True, nullable=False, index=True)
    activity_type = Column(Enum(ActivityType), nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    director_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    employees = relationship("User", back_populates="company", foreign_keys="User.company_id")
    director = relationship("User", foreign_keys=[director_id], post_update=True)
    declarations = relationship("Declaration", back_populates="company")
    declaration_groups = relationship("DeclarationGroup", back_populates="company")
    certificates = relationship("Certificate", back_populates="company", foreign_keys="Certificate.company_id")
    tasks_created = relationship("Task", back_populates="created_by_company", foreign_keys="Task.created_by_company_id")
    tasks_assigned = relationship("Task", back_populates="target_company", foreign_keys="Task.target_company_id")
    documents = relationship("Document", back_populates="company")
    folders = relationship("Folder", back_populates="company")
    clients = relationship("Client", back_populates="company")
    
    # Partnership relationships
    partnership_requests_sent = relationship(
        "Partnership", 
        back_populates="requesting_company", 
        foreign_keys="Partnership.requesting_company_id"
    )
    partnership_requests_received = relationship(
        "Partnership", 
        back_populates="target_company", 
        foreign_keys="Partnership.target_company_id"
    )
    
    def __repr__(self):
        return f"<Company {self.name} ({self.inn})>"
