import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.adapters.database.connection import db
from app.adapters.api.v1.auth_router import get_current_user
from app.adapters.api.v1.sos_router import get_current_user_id

router = APIRouter()

class PublicacionCreate(BaseModel):
    creador_id: Optional[str] = None
    creador_nombre: Optional[str] = "Ciudadano Anónimo"
    creador_rol: Optional[str] = "ciudadano"
    cedula: Optional[str] = None  # Cédula obligatoria para trazabilidad
    categoria: str
    descripcion: str
    media_url: Optional[str] = None

class ReporteCreate(BaseModel):
    motivo: Optional[str] = "No especificado"  # 'Falsa' | 'Inadecuada' | 'Perjudicial'

@router.post("", tags=["Muro"])
def crear_publicacion(pub: PublicacionCreate):
    """
    Crea una publicación en el muro visual. 
    Permite llamadas anónimas si no viene creador_id.
    """
    data = pub.model_dump()
    data["cantidad_reportes"] = 0
    data["baneado"] = False
    
    try:
        res = db.client.table("publicaciones_visuales").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Error al insertar publicación")
        return res.data[0]
    except Exception as e:
        print(f"Error creando publicacion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feed", tags=["Muro"])
def get_publicaciones_feed(categoria: Optional[str] = None):
    """
    Retorna publicaciones activas y no baneadas.
    Permite filtrar por categoría.
    """
    try:
        query = db.client.table("publicaciones_visuales").select("*").eq("baneado", False)
        if categoria and categoria != "todos":
            query = query.eq("categoria", categoria)
        
        # Ordenar por fecha de creación descendente
        res = query.order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Error en feed de publicaciones: {e}")
        return []

@router.post("/{id}/reportar", tags=["Muro"])
def reportar_publicacion(id: str, body: ReporteCreate = ReporteCreate()):
    """
    Incrementa el contador de banderitas de la publicación.
    Si llega a 25, se marca automáticamente como baneada.
    Recibe opcionalmente un motivo: 'Falsa', 'Inadecuada', 'Perjudicial'.
    """
    try:
        check = db.client.table("publicaciones_visuales").select("*").eq("id", id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
        current = check.data[0]
        new_reports = (current.get("cantidad_reportes") or 0) + 1
        updates = {"cantidad_reportes": new_reports}
        
        UMBRAL_BANEO = 25
        if new_reports >= UMBRAL_BANEO:
            updates["baneado"] = True
            # Registrar en log de auditoría
            cedula = current.get("cedula") or "No registrada"
            creador = current.get("creador_nombre") or "Anónimo"
            print(f"[AUDIT] Publicación '{id}' de '{creador}' (cédula: {cedula}) baneada por {UMBRAL_BANEO}+ reportes. Último motivo: {body.motivo}")
            
        res = db.client.table("publicaciones_visuales").update(updates).eq("id", id).execute()
        return {"mensaje": "Reporte registrado", "reportes": new_reports, "baneado": new_reports >= UMBRAL_BANEO, "motivo": body.motivo}
    except Exception as e:
        print(f"Error al reportar publicacion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints de administración (exclusivos para juan / admin)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "laya.juanluis@gmail.com")

def verify_admin(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea el administrador supremo por email."""
    if current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de superusuario")
    return current_user

@router.get("/admin/todas", tags=["Muro Admin"])
def get_todas_publicaciones(current_user: dict = Depends(verify_admin)):
    """Retorna todas las publicaciones sin importar si están baneadas o no."""
    try:
        res = db.client.table("publicaciones_visuales").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}/desbanear", tags=["Muro Admin"])
def desbanear_publicacion(id: str, current_user: dict = Depends(verify_admin)):
    """Restablece una publicación baneada colocándole cantidad_reportes = 0 y baneado = false"""
    try:
        res = db.client.table("publicaciones_visuales").update({"cantidad_reportes": 0, "baneado": False}).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        return {"mensaje": "Publicación restablecida con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}", tags=["Muro Admin"])
def delete_publicacion(id: str, current_user: dict = Depends(verify_admin)):
    """Elimina físicamente una publicación de la DB y limpia su imagen de Supabase Storage si existe."""
    try:
        check = db.client.table("publicaciones_visuales").select("*").eq("id", id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
            
        pub = check.data[0]
        media_url = pub.get("media_url")
        cedula = pub.get("cedula") or "No registrada"
        creador = pub.get("creador_nombre") or "Anónimo"
        reportes = pub.get("cantidad_reportes") or 0
        
        # Log de auditoría
        print(f"[AUDIT] Publicación '{id}' del usuario '{creador}' (cédula: {cedula}) eliminada por admin con {reportes} reportes.")
        
        # Eliminar de la DB primero
        db.client.table("publicaciones_visuales").delete().eq("id", id).execute()
        
        # Eliminar archivo físico de Supabase Storage si existe
        if media_url and "publicaciones" in media_url:
            try:
                filename = media_url.split("/")[-1]
                db.client.storage.from_("publicaciones").remove([filename])
                print(f"Archivo de imagen {filename} borrado de Supabase Storage.")
            except Exception as se:
                print(f"Error borrando archivo de storage: {se}")
                
        return {"mensaje": "Publicación eliminada con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
