from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.adapters.database.connection import db
from app.adapters.api.v1.sos_router import get_current_user_id
import datetime
import uuid

router = APIRouter()

class EscanearVoluntarioRequest(BaseModel):
    voluntario_id: str

@router.post("/escanear", tags=["Voluntarios"])
def escanear_voluntario(req: EscanearVoluntarioRequest, centro_id: str = Depends(get_current_user_id)):
    """
    El centro de acopio escanea el QR fijo del ciudadano (que contiene su ID)
    y lo registra como Voluntario Activo usando la tabla donaciones_qr como registro.
    """
    # Verificar que el usuario escaneado exista
    user_res = db.client.table("usuarios").select("id, nombre").eq("id", req.voluntario_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="Usuario voluntario no encontrado")

    # Verificar si ya está registrado en este centro como voluntario activo
    check = db.client.table("donaciones_qr").select("*")\
        .eq("ciudadano_id", req.voluntario_id)\
        .eq("receptor_id", centro_id)\
        .eq("insumo_donado", "Voluntario Activo")\
        .eq("estado", "completada")\
        .execute()
    
    if check.data:
        return {"mensaje": f"El usuario {user_res.data[0]['nombre']} ya está registrado como voluntario aquí.", "ya_registrado": True}

    # Registrar
    data = {
        "token_qr": f"vol_{req.voluntario_id}_{str(uuid.uuid4())[:8]}",
        "ciudadano_id": req.voluntario_id,
        "receptor_id": centro_id,
        "insumo_donado": "Voluntario Activo",
        "cantidad_donada": 1,
        "estado": "completada",
        "fecha_escaneo": datetime.datetime.utcnow().isoformat()
    }
    
    res = db.client.table("donaciones_qr").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al registrar voluntario")
        
    return {"mensaje": f"¡Voluntario {user_res.data[0]['nombre']} registrado exitosamente!"}


@router.get("/lista", tags=["Voluntarios"])
def get_voluntarios_centro(centro_id: str = Depends(get_current_user_id)):
    """
    Obtiene la lista de voluntarios registrados en este centro.
    """
    # Fix para error de postgrest en la relación de foreign key de donaciones_qr hacia usuarios
    query = db.client.table("donaciones_qr")\
        .select("*, usuarios:usuarios!donaciones_qr_ciudadano_id_fkey(id, nombre, email, telefono, foto_rostro_url)")\
        .eq("receptor_id", centro_id)\
        .eq("insumo_donado", "Voluntario Activo")\
        .eq("estado", "completada")\
        .order("fecha_escaneo", desc=True)
        
    res = query.execute()
    return res.data
