import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Enum, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class TaskPriority(str, PyEnum):
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"


class TaskStatus(str, PyEnum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    ON_REVIEW = "on_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FROZEN = "frozen"


# Association tables
task_documents = Table(
    "task_documents",
    Base.metadata,
    Column("task_id", UUID(as_uuid=True), ForeignKey("tasks.id"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id"), primary_key=True),
)

task_declarations = Table(
    "task_declarations",
    Base.metadata,
    Column("task_id", UUID(as_uuid=True), ForeignKey("tasks.id"), primary_key=True),
    Column("declaration_id", UUID(as_uuid=True), ForeignKey("declarations.id"), primary_key=True),
)

task_certificates = Table(
    "task_certificates",
    Base.metadata,
    Column("task_id", UUID(as_uuid=True), ForeignKey("tasks.id"), primary_key=True),
    Column("certificate_id", UUID(as_uuid=True), ForeignKey("certificates.id"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    target_employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    note = Column(Text, nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.NORMAL, nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.NEW, nullable=False)
    deadline = Column(Date, nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_by_company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    target_company = relationship("Company", back_populates="tasks_assigned", foreign_keys=[target_company_id])
    target_employee = relationship("User", back_populates="assigned_tasks", foreign_keys=[target_employee_id])
    created_by = relationship("User", back_populates="created_tasks", foreign_keys=[created_by_user_id])
    created_by_company = relationship("Company", back_populates="tasks_created", foreign_keys=[created_by_company_id])
    
    attached_documents = relationship("Document", secondary=task_documents)
    attached_declarations = relationship("Declaration", secondary=task_declarations, back_populates="linked_tasks")
    attached_certificates = relationship("Certificate", secondary=task_certificates, back_populates="linked_tasks")
    
    status_history = relationship("TaskStatusChange", back_populates="task", cascade="all, delete-orphan", order_by="TaskStatusChange.created_at")
    
    def __repr__(self):
        return f"<Task {self.name} ({self.status})>"


class TaskStatusChange(Base):
    __tablename__ = "task_status_changes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    from_status = Column(Enum(TaskStatus), nullable=False)
    to_status = Column(Enum(TaskStatus), nullable=False)
    changed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    task = relationship("Task", back_populates="status_history")
    changed_by = relationship("User")
    
    def __repr__(self):
        return f"<TaskStatusChange {self.from_status} -> {self.to_status}>"
