from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import uuid
import mimetypes
from app.adapters.database.connection import db
from app.domain.models import TokenData
from app.adapters.api.v1.auth_router import get_current_user

router = APIRouter()

@router.post("/verificacion")
async def upload_verificacion_photo(file: UploadFile = File(...)):
    """
    Sube una foto al bucket 'verificaciones' en Supabase Storage.
    Retorna la URL pública de la imagen.
    Nota: no usa get_current_user porque se sube durante el registro (antes de tener token).
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "El archivo debe ser una imagen")
        
    try:
        # Generar nombre único
        ext = mimetypes.guess_extension(file.content_type) or ".jpg"
        file_name = f"{uuid.uuid4()}{ext}"
        
        # Leer archivo
        file_bytes = await file.read()
        
        # Subir a Supabase Storage
        res = db.client.storage.from_("verificaciones").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Obtener URL pública
        public_url = db.client.storage.from_("verificaciones").get_public_url(file_name)
        
        return {"url": public_url}
        
    except Exception as e:
        print(f"Error subiendo archivo: {e}")
        raise HTTPException(500, f"Error subiendo archivo: {str(e)}")

@router.post("/publicacion")
async def upload_publicacion_photo(file: UploadFile = File(...)):
    """
    Sube una foto o video al bucket 'publicaciones' en Supabase Storage.
    Retorna la URL pública.
    """
    allowed_types = ['image/', 'video/']
    is_allowed = any(file.content_type.startswith(t) for t in allowed_types)
    if not is_allowed:
        raise HTTPException(400, "El archivo debe ser una imagen o video válido")
        
    try:
        ext = mimetypes.guess_extension(file.content_type) or ".jpg"
        file_name = f"{uuid.uuid4()}{ext}"
        
        file_bytes = await file.read()
        
        res = db.client.storage.from_("publicaciones").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        public_url = db.client.storage.from_("publicaciones").get_public_url(file_name)
        return {"url": public_url}
        
    except Exception as e:
        print(f"Error subiendo archivo de publicación: {e}")
        raise HTTPException(500, f"Error subiendo archivo: {str(e)}")
