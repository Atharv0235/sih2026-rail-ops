"""
RAIL-OPS Backend — FastAPI Application Entry Point.

Handles:
- CORS for frontend dev server
- Lifespan: DB table creation + XGBoost model preload
- All API router mounting
- WebSocket endpoint for live feed
"""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from config import CORS_ORIGINS
from database import create_tables
from services.criticality import load_model

_frontend_dir = Path(__file__).resolve().parent.parent / "frontend" / "public"

class RewriteHtmlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method == "GET" and not path.startswith("/api/") and "." not in path.split("/")[-1]:
            if path != "/":
                possible_html = _frontend_dir / (path.strip("/") + ".html")
                if possible_html.is_file():
                    request.scope["path"] = path + ".html"
        return await call_next(request)


class NoCacheMiddleware(BaseHTTPMiddleware):
    """Prevent browser from caching static files during development."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path.endswith(('.html', '.js', '.css')):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

# Import all routers
from routers.auth import router as auth_router
from routers.defects import router as defects_router
from routers.blocks import router as blocks_router
from routers.dashboard import router as dashboard_router
from routers.live import router as live_router
from routers.health import router as health_router
from routers.optimize import router as optimize_router
from routers.reschedule import router as reschedule_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables + load XGBoost model."""
    print("[Startup] Creating database tables...")
    await create_tables()
    print("[Startup] Loading XGBoost criticality model...")
    load_model()
    print("[Startup] READY - RAIL-OPS backend ready")
    yield
    print("[Shutdown] RAIL-OPS backend shutting down")


app = FastAPI(
    title="RAIL-OPS API",
    description="AI-Driven Railway Block Scheduling System — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RewriteHtmlMiddleware)
app.add_middleware(NoCacheMiddleware)

# ── Mount Routers ──
app.include_router(auth_router)
app.include_router(defects_router)
app.include_router(blocks_router)
app.include_router(dashboard_router)
app.include_router(live_router)
app.include_router(health_router)
app.include_router(optimize_router)
app.include_router(reschedule_router)


from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/login.html")

# ── Serve frontend static files (HTML pages, JS, CSS) ──
# Must be AFTER all API routers so /api/* routes take priority
if _frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")
    print(f"[Static] Serving frontend from {_frontend_dir}")

