from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.adapters.database.connection import db
from app.adapters.api.v1.auth_router import get_current_user
from app.adapters.api.v1.publicaciones_router import verify_admin

router = APIRouter()

# ==========================================
# MODELOS
# ==========================================

class ConvocatoriaCreate(BaseModel):
    titulo: str
    descripcion: str
    instrucciones: Optional[str] = ""
    limite_personas: int = 50
    zona: Optional[str] = "Nacional"

class InscripcionCreate(BaseModel):
    nombre_completo: str
    cedula: str
    telefono: Optional[str] = ""
    zona: Optional[str] = ""

# ==========================================
# ENDPOINTS PÚBLICOS
# ==========================================

@router.get("")
def listar_convocatorias(zona: str = ""):
    """Lista todas las convocatorias activas. Acceso público."""
    try:
        query = db.client.table("convocatorias_voluntariado").select("*").eq("activa", True).order("created_at", desc=True)
        if zona and zona != "Nacional" and zona != "TODA VENEZUELA":
            filtro = zona.split("||")[0]
            query = query.ilike("zona", f"%{filtro}%")
        res = query.execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{convocatoria_id}/inscribirse", status_code=status.HTTP_201_CREATED)
def inscribirse(convocatoria_id: str, inscripcion: InscripcionCreate):
    """Permite a cualquier ciudadano inscribirse en una convocatoria."""
    if not inscripcion.nombre_completo.strip():
        raise HTTPException(status_code=400, detail="El nombre completo es obligatorio.")
    if not inscripcion.cedula.strip():
        raise HTTPException(status_code=400, detail="La cédula es obligatoria.")

    try:
        # Verificar que la convocatoria exista y esté activa
        conv = db.client.table("convocatorias_voluntariado").select("*").eq("id", convocatoria_id).execute()
        if not conv.data:
            raise HTTPException(status_code=404, detail="Convocatoria no encontrada.")
        
        convocatoria = conv.data[0]
        if not convocatoria["activa"]:
            raise HTTPException(status_code=400, detail="Esta convocatoria ya no está activa.")
        
        if convocatoria["inscritos_count"] >= convocatoria["limite_personas"]:
            raise HTTPException(status_code=400, detail="Los cupos para esta convocatoria están agotados.")
        
        # Verificar duplicado por cédula
        dup = db.client.table("inscripciones_voluntariado").select("id").eq("convocatoria_id", convocatoria_id).eq("cedula", inscripcion.cedula.strip()).execute()
        if dup.data:
            raise HTTPException(status_code=400, detail="Ya te inscribiste en esta convocatoria con esta cédula.")

        # Insertar inscripción
        db.client.table("inscripciones_voluntariado").insert({
            "convocatoria_id": convocatoria_id,
            "nombre_completo": inscripcion.nombre_completo.strip(),
            "cedula": inscripcion.cedula.strip(),
            "telefono": inscripcion.telefono,
            "zona": inscripcion.zona
        }).execute()

        # Incrementar contador
        nuevo_count = convocatoria["inscritos_count"] + 1
        db.client.table("convocatorias_voluntariado").update({"inscritos_count": nuevo_count}).eq("id", convocatoria_id).execute()

        # Si se llenó, cerrar automáticamente
        if nuevo_count >= convocatoria["limite_personas"]:
            db.client.table("convocatorias_voluntariado").update({"activa": False}).eq("id", convocatoria_id).execute()

        return {"mensaje": "¡Inscripción exitosa! Te esperamos como voluntario.", "inscritos": nuevo_count, "limite": convocatoria["limite_personas"]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inscripción voluntariado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ENDPOINTS AUTENTICADOS
# ==========================================

@router.post("", status_code=status.HTTP_201_CREATED)
def crear_convocatoria(conv: ConvocatoriaCreate, current_user: dict = Depends(get_current_user)):
    """Crea una nueva convocatoria. Requiere estar autenticado."""
    if not conv.titulo.strip() or not conv.descripcion.strip():
        raise HTTPException(status_code=400, detail="Título y descripción son obligatorios.")
    if conv.limite_personas < 1 or conv.limite_personas > 10000:
        raise HTTPException(status_code=400, detail="El límite debe ser entre 1 y 10.000 personas.")

    try:
        res = db.client.table("convocatorias_voluntariado").insert({
            "titulo": conv.titulo.strip(),
            "descripcion": conv.descripcion.strip(),
            "instrucciones": conv.instrucciones,
            "limite_personas": conv.limite_personas,
            "zona": conv.zona or "Nacional",
            "creador_id": current_user.get("user_id", ""),
            "creador_nombre": current_user.get("nombre", current_user.get("sub", "Centro")),
            "activa": True
        }).execute()

        if res.data:
            return {"mensaje": "Convocatoria publicada exitosamente", "convocatoria": res.data[0]}
        raise HTTPException(status_code=500, detail="Error al crear la convocatoria.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{convocatoria_id}/cerrar")
def cerrar_convocatoria(convocatoria_id: str, current_user: dict = Depends(get_current_user)):
    """Cierra una convocatoria. Solo el creador o el admin."""
    try:
        conv = db.client.table("convocatorias_voluntariado").select("creador_id").eq("id", convocatoria_id).execute()
        if not conv.data:
            raise HTTPException(status_code=404, detail="Convocatoria no encontrada.")
        
        ADMIN_EMAIL = "juanluislaya@gmail.com"
        if conv.data[0]["creador_id"] != current_user.get("user_id") and current_user.get("email") != ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="No tienes permiso para cerrar esta convocatoria.")

        db.client.table("convocatorias_voluntariado").update({"activa": False}).eq("id", convocatoria_id).execute()
        return {"mensaje": "Convocatoria cerrada exitosamente."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ENDPOINTS ADMIN
# ==========================================

@router.get("/admin/todas")
def listar_todas_admin(current_user: dict = Depends(verify_admin)):
    """Lista todas las convocatorias (activas e inactivas). Solo admin."""
    try:
        res = db.client.table("convocatorias_voluntariado").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{convocatoria_id}/inscritos")
def ver_inscritos(convocatoria_id: str, current_user: dict = Depends(verify_admin)):
    """Ver los inscritos de una convocatoria. Solo admin."""
    try:
        res = db.client.table("inscripciones_voluntariado").select("*").eq("convocatoria_id", convocatoria_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{convocatoria_id}")
def eliminar_convocatoria(convocatoria_id: str, current_user: dict = Depends(verify_admin)):
    """Elimina una convocatoria y todas sus inscripciones. Solo admin."""
    try:
        db.client.table("convocatorias_voluntariado").delete().eq("id", convocatoria_id).execute()
        return {"mensaje": "Convocatoria eliminada."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
