from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.adapters.database.connection import db
from app.domain.models import SOSRequestCreate

router = APIRouter()

class SOSEdit(BaseModel):
    descripcion: Optional[str] = None
    insumo_solicitado: Optional[str] = None
    cantidad_solicitada: Optional[float] = None

class SOSEstado(BaseModel):
    estado: str  # 'entregada' | 'cancelada'

# Importamos el get_current_user global para mantener compatibilidad y seguridad centralizada
from app.adapters.api.v1.auth_router import get_current_user

def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    return user_id

@router.get("/feed", tags=["SOS"])
def get_sos_feed(zona: Optional[str] = None):
    """
    Feed Geográfico: Devuelve las solicitudes SOS abiertas.
    Si se provee la zona, ordena/filtra dándole prioridad a esa zona.
    (La distancia exacta GPS se puede calcular en Frontend o con PostGIS, 
    aquí hacemos match por zona).
    """
    # Fix para ambigüedad de PostgREST cuando hay 2 claves foráneas a la misma tabla
    query = db.client.table("solicitudes_sos").select("*, usuarios:usuarios!solicitudes_sos_solicitante_id_fkey(nombre, foto_cedula_url, foto_rostro_url, rol)").eq("estado", "abierta")
    if zona and zona != 'undefined' and zona != 'Nacional' and zona != 'TODA VENEZUELA':
        # Buscamos coincidencias en cualquier parte del string de la zona (útil para buscar por estado o ciudad)
        filtro = zona.split("||")[0]
        query = query.ilike("zona", f"%{filtro}%")
        
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"ERROR en get_sos_feed: {e}")
        return []

from app.adapters.api.v1.ws_router import manager

@router.post("", tags=["SOS"])
async def create_sos(sos: SOSRequestCreate, user_id: str = Depends(get_current_user_id)):
    """
    Un Líder Vecinal o Clínica crea una solicitud de auxilio.
    Si dirigido_a_centro_id está presente, es una Solicitud Directa a un Acopio.
    """
    data = sos.model_dump()
    data["solicitante_id"] = user_id
    
    response = db.client.table("solicitudes_sos").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Error al crear SOS")
        
    created_sos = response.data[0]
    
    # Broadcast a todos los usuarios conectados en la zona
    zona = created_sos.get("zona")
    if zona:
        await manager.broadcast_to_zone({
            "type": "NEW_SOS",
            "data": created_sos
        }, zona)
        
    return created_sos

@router.put("/resolver/{sos_id}", tags=["SOS"])
def resolve_sos(sos_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Marca un SOS como resuelto. Solo el creador original puede resolverlo.
    """
    # 1. Verificar existencia y propiedad
    check = db.client.table("solicitudes_sos").select("*").eq("id", sos_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Alerta SOS no encontrada")
    
    if check.data[0]["solicitante_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para resolver esta alerta")
        
    # 2. Actualizar estado
    res = db.client.table("solicitudes_sos").update({"estado": "entregada"}).eq("id", sos_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al actualizar alerta")
        
    return {"mensaje": "Alerta marcada como entregada exitosamente"}

@router.put("/editar/{sos_id}", tags=["SOS"])
def edit_sos(sos_id: str, body: SOSEdit, user_id: str = Depends(get_current_user_id)):
    check = db.client.table("solicitudes_sos").select("*").eq("id", sos_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Alerta SOS no encontrada")
    if check.data[0]["solicitante_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta alerta")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    res = db.client.table("solicitudes_sos").update(updates).eq("id", sos_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al actualizar alerta")
    return res.data[0]

@router.put("/estado/{sos_id}", tags=["SOS"])
def change_sos_status(sos_id: str, body: SOSEstado, user_id: str = Depends(get_current_user_id)):
    if body.estado not in ("entregada", "cancelada"):
        raise HTTPException(status_code=400, detail="Estado inválido. Use 'entregada' o 'cancelada'")
    check = db.client.table("solicitudes_sos").select("*").eq("id", sos_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Alerta SOS no encontrada")
    if check.data[0]["solicitante_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para cambiar el estado de esta alerta")
    res = db.client.table("solicitudes_sos").update({"estado": body.estado}).eq("id", sos_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al actualizar estado")
    return {"mensaje": f"Alerta marcada como {body.estado} exitosamente"}

@router.delete("/{sos_id}", tags=["SOS"])
def delete_sos(sos_id: str, user_id: str = Depends(get_current_user_id)):
    """
    Elimina físicamente una alerta SOS de la base de datos. Solo el creador puede hacerlo.
    """
    check = db.client.table("solicitudes_sos").select("*").eq("id", sos_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Alerta SOS no encontrada")
    if check.data[0]["solicitante_id"] != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta alerta")
    
    db.client.table("solicitudes_sos").delete().eq("id", sos_id).execute()
    return {"mensaje": "Alerta SOS eliminada con éxito"}
