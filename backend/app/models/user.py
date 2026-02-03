import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, PyEnum):
    ADMIN = "admin"
    DIRECTOR = "director"
    SENIOR = "senior"
    EMPLOYEE = "employee"


class ActivityType(str, PyEnum):
    DECLARANT = "declarant"
    CERTIFICATION = "certification"


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    activity_type = Column(Enum(ActivityType), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    telegram_chat_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="employees", foreign_keys=[company_id])
    owned_declarations = relationship("Declaration", back_populates="owner", foreign_keys="Declaration.owner_id")
    owned_certificates = relationship("Certificate", back_populates="owner", foreign_keys="Certificate.owner_id")
    assigned_certificates = relationship("Certificate", back_populates="assigned_to", foreign_keys="Certificate.assigned_to_id")
    created_tasks = relationship("Task", back_populates="created_by", foreign_keys="Task.created_by_user_id")
    assigned_tasks = relationship("Task", back_populates="target_employee", foreign_keys="Task.target_employee_id")
    owned_documents = relationship("Document", back_populates="owner")
    owned_folders = relationship("Folder", back_populates="owner")
    owned_clients = relationship("Client", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"
