import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.adapters.database.connection import db
from app.domain.models import DonationQRCreate
from app.adapters.api.v1.sos_router import get_current_user_id
import datetime

router = APIRouter()

@router.post("/generar", tags=["Trazabilidad QR"])
def generar_qr_ciudadano(donacion: DonationQRCreate, user_id: str = Depends(get_current_user_id)):
    """
    El ciudadano genera un intento de donación. Retorna un token_qr único
    que se renderizará como imagen QR en la PWA del ciudadano.
    """
    token = str(uuid.uuid4())
    data = {
        "token_qr": token,
        "ciudadano_id": user_id,
        "insumo_donado": donacion.insumo_donado,
        "cantidad_donada": donacion.cantidad_donada,
        "estado": "pendiente"
    }
    res = db.client.table("donaciones_qr").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al generar QR")
    return {"token_qr": token, "mensaje": "QR generado con éxito. Muéstralo en el centro."}

@router.post("/escanear/{token_qr}", tags=["Trazabilidad QR"])
def escanear_qr_ciudadano(token_qr: str, receptor_id: str = Depends(get_current_user_id)):
    """
    El Centro de Acopio o Clínica escanea el QR del ciudadano.
    1. Marca la donación como completada.
    2. Suma el inventario al Centro de Acopio.
    """
    # 1. Buscar la donación
    qr_res = db.client.table("donaciones_qr").select("*").eq("token_qr", token_qr).eq("estado", "pendiente").execute()
    if not qr_res.data:
        raise HTTPException(status_code=404, detail="QR inválido, ya usado o no existe.")
    
    donacion = qr_res.data[0]
    
    # 2. Actualizar la donación a completada
    db.client.table("donaciones_qr").update({
        "estado": "completada",
        "receptor_id": receptor_id,
        "fecha_escaneo": datetime.datetime.utcnow().isoformat()
    }).eq("id", donacion["id"]).execute()
    
    # 3. Sumar inventario al receptor
    insumo = donacion["insumo_donado"]
    cantidad = donacion["cantidad_donada"]
    
    # Buscar si ya tiene el insumo
    inv_res = db.client.table("inventario").select("*").eq("propietario_id", receptor_id).eq("insumo", insumo).execute()
    
    if inv_res.data:
        nueva_cantidad = float(inv_res.data[0]["cantidad"]) + cantidad
        db.client.table("inventario").update({"cantidad": nueva_cantidad}).eq("id", inv_res.data[0]["id"]).execute()
    else:
        db.client.table("inventario").insert({
            "propietario_id": receptor_id,
            "insumo": insumo,
            "cantidad": cantidad,
            "unidad_medida": "unidades" # Asumido por defecto en MVP
        }).execute()

    return {"mensaje": f"¡Recepción exitosa! Se han añadido {cantidad} de {insumo} a tu inventario."}
