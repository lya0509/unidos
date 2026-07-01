from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.domain.models import PersonaRegistroCreate, PersonaRegistroResponse
from app.adapters.database.connection import db
from app.adapters.api.v1.auth_router import oauth2_scheme
from app.domain.security import decode_access_token

router = APIRouter()

@router.post("/", response_model=PersonaRegistroResponse)
def registrar_persona(data: PersonaRegistroCreate, token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="No autenticado")
        
    user_id = payload.get("user_id")
    rol = payload.get("rol")
    
    if rol not in ["clinica", "refugio", "comunidad", "centro_acopio", "lider_vecinal"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar personas.")

    try:
        response = db.client.table("registro_personas").insert({
            "nombre_completo": data.nombre_completo,
            "cedula": data.cedula,
            "estado_salud": data.estado_salud,
            "notas": data.notas,
            "registrador_id": user_id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al registrar persona.")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/centro", response_model=List[PersonaRegistroResponse])
def listar_personas_centro(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="No autenticado")
        
    user_id = payload.get("user_id")
    
    try:
        response = db.client.table("registro_personas").select("*").eq("registrador_id", user_id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/buscar")
def buscar_personas(q: Optional[str] = None, estado: Optional[str] = None):
    """
    Buscador público de personas.
    Retorna coincidencias de nombre o cédula, y filtra por estado si se provee.
    """
    try:
        query = db.client.table("registro_personas").select("*, usuarios(nombre, zona_operacion, rol)")
        
        if q:
            # Búsqueda tipo ILIKE
            or_condition = f"nombre_completo.ilike.%{q}%,cedula.ilike.%{q}%"
            query = query.or_(or_condition)
            
        if estado:
            query = query.eq("estado_salud", estado)
            
        response = query.order("created_at", desc=True).limit(50).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
