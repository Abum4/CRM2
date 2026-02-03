from fastapi import APIRouter

from app.api.v1 import (
    auth, users, companies, declarations, certificates,
    tasks, documents, clients, partnerships, requests,
    notifications, dashboard
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(companies.router)
api_router.include_router(declarations.router)
api_router.include_router(certificates.router)
api_router.include_router(tasks.router)
api_router.include_router(documents.router)
api_router.include_router(clients.router)
api_router.include_router(partnerships.router)
api_router.include_router(requests.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
