import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.adapters.database.connection import db
from app.adapters.api.v1.auth_router import get_current_user
from app.adapters.api.v1.publicaciones_router import verify_admin

router = APIRouter()

class FallaCreate(BaseModel):
    nombre_usuario: Optional[str] = "Anónimo"
    email: Optional[str] = ""
    descripcion: str
    dispositivo: Optional[str] = "No especificado"

class FallaResponse(BaseModel):
    id: str
    created_at: str
    nombre_usuario: str
    email: str
    descripcion: str
    dispositivo: str
    resuelta: bool

@router.post("", status_code=status.HTTP_201_CREATED)
def reportar_falla(falla: FallaCreate):
    """Permite a cualquier usuario reportar una falla o bug en el sistema."""
    if not falla.descripcion.strip():
        raise HTTPException(status_code=400, detail="La descripción de la falla es obligatoria.")
        
    try:
        res = db.client.table("reportes_fallas").insert({
            "nombre_usuario": falla.nombre_usuario,
            "email": falla.email,
            "descripcion": falla.descripcion,
            "dispositivo": falla.dispositivo,
            "resuelta": False
        }).execute()
        
        if res.data:
            return {"mensaje": "Reporte de falla enviado exitosamente", "falla": res.data[0]}
        raise HTTPException(status_code=500, detail="No se pudo registrar la falla.")
    except Exception as e:
        print(f"Error al reportar falla: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[FallaResponse])
def listar_fallas(current_user: dict = Depends(verify_admin)):
    """Lista todas las fallas reportadas. Exclusivo para el superadministrador."""
    try:
        res = db.client.table("reportes_fallas").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{falla_id}/resolver")
def resolver_falla(falla_id: str, resuelta: bool = True, current_user: dict = Depends(verify_admin)):
    """Marca una falla como resuelta o pendiente. Exclusivo para el superadministrador."""
    try:
        res = db.client.table("reportes_fallas").update({"resuelta": resuelta}).eq("id", falla_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Falla no encontrada")
        return {"mensaje": "Estado de la falla actualizado", "falla": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{falla_id}")
def eliminar_falla(falla_id: str, current_user: dict = Depends(verify_admin)):
    """Elimina definitivamente un reporte de falla. Exclusivo para el superadministrador."""
    try:
        db.client.table("reportes_fallas").delete().eq("id", falla_id).execute()
        return {"mensaje": "Reporte de falla eliminado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
