import time
from typing import Dict, Tuple, Optional
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.dependencies import limiter

# ==========================================
# 1. SISTEMA DE CACHÉ EN MEMORIA ($0 Budget)
# ==========================================
class MemoryCache:
    """
    Sistema simple de caché en memoria para reducir peticiones a la DB.
    """
    def __init__(self):
        self._cache: Dict[str, Tuple[any, float]] = {}

    def get(self, key: str) -> Optional[any]:
        if key in self._cache:
            value, expires_at = self._cache[key]
            if time.time() < expires_at:
                return value
            else:
                del self._cache[key] # Expirado
        return None

    def set(self, key: str, value: any, ttl_seconds: int):
        self._cache[key] = (value, time.time() + ttl_seconds)

local_cache = MemoryCache()

# ==========================================
# 3. CREACIÓN DE LA APP FASTAPI
# ==========================================

# ==========================================
# 3. CREACIÓN DE LA APP FASTAPI
# ==========================================
import asyncio
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from app.adapters.database.connection import db

async def cleanup_db_loop():
    while True:
        now = datetime.now(timezone.utc)
        
        # 1. Borrar SOS expirados (más de 6 horas)
        try:
            six_hours_ago = (now - timedelta(hours=6)).isoformat()
            db.client.table("solicitudes_sos").delete().lte("created_at", six_hours_ago).execute()
        except Exception as e:
            print(f"[Limpieza] Error borrando SOS expirados: {e}")
        
        # 2. Borrar SOS resueltos o cancelados
        try:
            db.client.table("solicitudes_sos").delete().in_("estado", ["entregada", "cancelada"]).execute()
        except Exception as e:
            print(f"[Limpieza] Error borrando SOS resueltos: {e}")
        
        # 3. Borrar mensajes del chat global con más de 3 días
        try:
            three_days_ago = (now - timedelta(days=3)).isoformat()
            db.client.table("mensajes_chat").delete().eq("room_id", "global_chat").lte("created_at", three_days_ago).execute()
        except Exception as e:
            print(f"[Limpieza] Error borrando mensajes de chat: {e}")
        
        # 4. Borrar publicaciones visuales con más de 24 horas
        try:
            one_day_ago = (now - timedelta(days=1)).isoformat()
            to_delete = db.client.table("publicaciones_visuales").select("id, media_url").lte("created_at", one_day_ago).execute()
            if to_delete.data:
                for pub in to_delete.data:
                    pub_id = pub.get("id")
                    media_url = pub.get("media_url")
                    db.client.table("publicaciones_visuales").delete().eq("id", pub_id).execute()
                    if media_url and "publicaciones" in media_url:
                        try:
                            filename = media_url.split("/")[-1]
                            db.client.storage.from_("publicaciones").remove([filename])
                            print(f"[Limpieza] Archivo {filename} eliminado de Storage.")
                        except Exception as se:
                            print(f"[Limpieza] Error borrando archivo de storage: {se}")
                print(f"[Limpieza] {len(to_delete.data)} publicaciones de +24h eliminadas.")
        except Exception as e:
            print(f"[Limpieza] Error borrando publicaciones visuales: {e}")
        
        await asyncio.sleep(3600)  # Dormir 1 hora

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar background task
    task = asyncio.create_task(cleanup_db_loop())
    yield
    # Cancelar al apagar
    task.cancel()

app = FastAPI(
    title="Plataforma de Logística Comunitaria - API",
    description="Backend Hexagonal MVP para gestión de contingencias",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: Limitar al dominio de producción y localhost en el futuro
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 4. MIDDLEWARE DE CACHÉ
# ==========================================
@app.middleware("http")
async def cache_middleware(request: Request, call_next):
    # Solo hacer caché en rutas públicas GET
    if request.method == "GET" and "/public/" in request.url.path:
        cache_key = f"cache:{request.url.path}:{request.url.query}"
        cached_res = local_cache.get(cache_key)
        
        if cached_res:
            return Response(
                content=cached_res["content"],
                media_type=cached_res["media_type"],
                headers={
                    "X-Cache": "HIT",
                    "Cache-Control": "public, max-age=120"
                }
            )
        
        response = await call_next(request)
        if response.status_code == 200:
            res_body = b""
            async for chunk in response.body_iterator:
                res_body += chunk
                
            local_cache.set(cache_key, {"content": res_body, "media_type": response.media_type}, 120)
            
            return Response(
                content=res_body, media_type=response.media_type, 
                status_code=response.status_code, headers={"X-Cache": "MISS"}
            )
    return await call_next(request)

# ==========================================
# 5. ENDPOINTS BASE Y HEALTHCHECK
# ==========================================
@app.api_route("/health", methods=["GET", "HEAD"], tags=["Sistema"])
@limiter.limit("30/minute")
async def health_check(request: Request):
    """Mantiene el backend despierto (CronJob / UptimeRobot)."""
    return {"status": "ok", "timestamp": time.time()}

# Incluir routers
from app.adapters.api.v1.auth_router import router as auth_router
from app.adapters.api.v1.inventory_router import router as inventory_router
from app.adapters.api.v1.sos_router import router as sos_router

from app.adapters.api.v1.anuncios_router import router as anuncios_router
from app.adapters.api.v1.upload_router import router as upload_router
from app.adapters.api.v1.personas_router import router as personas_router
from app.adapters.api.v1.voluntarios_router import router as voluntarios_router
from app.adapters.api.v1.reportes_router import router as reportes_router
from app.adapters.api.v1.publicaciones_router import router as publicaciones_router
from app.adapters.api.v1.fallas_router import router as fallas_router
from app.adapters.api.v1.convocatorias_router import router as convocatorias_router
from app.adapters.api.v1 import qr_router, ws_router, stats_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(inventory_router, prefix="/api/v1/inventario", tags=["Inventario"])
app.include_router(sos_router, prefix="/api/v1/sos", tags=["SOS"])

app.include_router(anuncios_router, prefix="/api/v1/anuncios", tags=["Anuncios"])
app.include_router(upload_router, prefix="/api/v1/upload", tags=["Uploads"])
app.include_router(personas_router, prefix="/api/v1/personas", tags=["Censo de Personas"])
app.include_router(voluntarios_router, prefix="/api/v1/voluntarios", tags=["Voluntarios"])
app.include_router(reportes_router, prefix="/api/v1/reportes", tags=["Reportes Antifraude"])
app.include_router(publicaciones_router, prefix="/api/v1/publicaciones", tags=["Muro de Reportes Visuales"])
app.include_router(fallas_router, prefix="/api/v1/fallas", tags=["Reportes de Fallas del Sistema"])
app.include_router(convocatorias_router, prefix="/api/v1/convocatorias", tags=["Convocatorias de Voluntariado"])
app.include_router(qr_router.router, prefix="/api/v1/qr", tags=["Trazabilidad QR"])
app.include_router(ws_router.router, prefix="/api/v1/ws", tags=["WebSockets"])
app.include_router(stats_router.router, prefix="/api/v1/stats", tags=["Estadísticas"])
