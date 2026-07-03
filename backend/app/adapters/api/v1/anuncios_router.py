from fastapi import APIRouter, Depends, HTTPException, status
from app.adapters.api.v1.auth_router import get_current_user
from app.domain.models import TokenData, AnuncioCentroCreate, AnuncioCentroResponse
from app.adapters.database.connection import db
from typing import List

router = APIRouter()

@router.post("")
async def create_anuncio(anuncio: AnuncioCentroCreate, current_user: TokenData = Depends(get_current_user)):
    ADMIN_EMAIL = "juanluislaya@gmail.com"
    roles_permitidos = ["centro_acopio", "comunidad", "refugio", "clinica", "lider_vecinal", "iniciativa_ciudadana"]
    if current_user.get("rol") not in roles_permitidos and current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="No tienes permiso para crear anuncios.")
        
    try:
        response = db.client.table("anuncios_centros").insert({
            "centro_id": current_user.get("user_id"),
            "mensaje": anuncio.mensaje
        }).execute()
        
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=500, detail="No se pudo crear el anuncio")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feed")
async def get_anuncios(zona: str = None):
    try:
        query = db.client.table("anuncios_centros").select("*, usuarios:centro_id!inner(nombre, zona_operacion, rol, foto_cedula_url, foto_rostro_url)").order("created_at", desc=True)
        if zona and zona != "Nacional" and zona != "TODA VENEZUELA":
            query = query.ilike("usuarios.zona_operacion", f"%{zona}%")
        
        response = query.execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{anuncio_id}")
async def delete_anuncio(anuncio_id: str, current_user: TokenData = Depends(get_current_user)):
    try:
        # Verificar dueño
        anuncio = db.client.table("anuncios_centros").select("centro_id").eq("id", anuncio_id).execute()
        if not anuncio.data or str(anuncio.data[0]["centro_id"]) != str(current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="No puedes borrar este anuncio")
            
        db.client.table("anuncios_centros").delete().eq("id", anuncio_id).execute()
        return {"message": "Borrado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
