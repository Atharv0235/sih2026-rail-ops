"""Auth router — login/logout (simple role-based, no JWT for hackathon)."""
from fastapi import APIRouter
from schemas.auth import LoginRequest, UserOut
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory session store (hackathon-grade)
_sessions: dict[str, dict] = {}


@router.post("/login", response_model=UserOut)
async def login(req: LoginRequest):
    """Create a user session based on role and optional department."""
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    name = "Divisional Controller" if req.role == "controller" else f"{req.department} Engineer"
    user = {
        "id": user_id,
        "name": name,
        "role": req.role,
        "department": req.department if req.role == "engineer" else None,
        "division": "Bhopal",
    }
    _sessions[user_id] = user
    return user


@router.post("/logout")
async def logout():
    """Clear session (placeholder)."""
    return {"ok": True}
