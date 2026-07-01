from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.adapters.database.sqlite_db import get_sqlite_conn
from app.adapters.database.connection import db
from app.adapters.api.v1.sos_router import get_current_user_id

router = APIRouter()

class ReporteCreate(BaseModel):
    reported_id: str
    reason: str

@router.post("/", tags=["Reportes"])
def crear_reporte(req: ReporteCreate, reporter_id: str = Depends(get_current_user_id)):
    """
    Crea un reporte contra un usuario. Si llega a 5, se bloquea.
    """
    if req.reported_id == reporter_id:
        raise HTTPException(status_code=400, detail="No puedes reportarte a ti mismo.")
        
    conn = get_sqlite_conn()
    cursor = conn.cursor()
    
    try:
        # Registrar reporte
        cursor.execute(
            "INSERT INTO reportes (reporter_id, reported_id, reason) VALUES (?, ?, ?)",
            (reporter_id, req.reported_id, req.reason)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        # Si ya lo reportó antes, SQLite lanzará un error de constraint UNIQUE
        raise HTTPException(status_code=400, detail="Ya has reportado a este usuario anteriormente.")
        
    # Verificar cantidad de reportes
    cursor.execute("SELECT COUNT(*) as count FROM reportes WHERE reported_id = ?", (req.reported_id,))
    row = cursor.fetchone()
    report_count = row["count"]
    
    conn.close()
    
    # Si llegó a 5 reportes, bloquearlo en Supabase
    bloqueado = False
    if report_count >= 5:
        # Actualizar rol a bloqueado
        res = db.client.table("usuarios").update({"rol": "bloqueado"}).eq("id", req.reported_id).execute()
        bloqueado = True
        
    return {
        "mensaje": "Reporte registrado exitosamente.",
        "report_count": report_count,
        "usuario_bloqueado": bloqueado
    }
