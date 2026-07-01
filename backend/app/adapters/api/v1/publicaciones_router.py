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
    categoria: str # 'urgente' | 'autoridades' | 'donacion' | 'mal_estado' | 'servicios' | 'solidaridad'
    descripcion: str
    media_url: Optional[str] = None

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
def reportar_publicacion(id: str):
    """
    Incrementa el contador de banderitas de la publicación.
    Si llega a 5, se marca automáticamente como baneada.
    """
    try:
        check = db.client.table("publicaciones_visuales").select("*").eq("id", id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
        current = check.data[0]
        new_reports = (current.get("cantidad_reportes") or 0) + 1
        updates = {"cantidad_reportes": new_reports}
        
        if new_reports >= 5:
            updates["baneado"] = True
            
        res = db.client.table("publicaciones_visuales").update(updates).eq("id", id).execute()
        return {"mensaje": "Reporte registrado", "reportes": new_reports, "baneado": new_reports >= 5}
    except Exception as e:
        print(f"Error al reportar publicacion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints de administración (exclusivos para juan / admin)

def verify_admin(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario logueado sea el administrador juan"""
    if current_user.get("rol") != "juan":
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
        
        # Eliminar de la DB primero
        db.client.table("publicaciones_visuales").delete().eq("id", id).execute()
        
        # Eliminar archivo físico de Supabase Storage si existe y está en el bucket publicaciones
        if media_url and "publicaciones" in media_url:
            try:
                # Extraer nombre del archivo al final de la URL
                filename = media_url.split("/")[-1]
                db.client.storage.from_("publicaciones").remove([filename])
                print(f"Archivo de imagen {filename} borrado de Supabase Storage.")
            except Exception as se:
                print(f"Error borrando archivo de storage: {se}")
                
        return {"mensaje": "Publicación eliminada con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
