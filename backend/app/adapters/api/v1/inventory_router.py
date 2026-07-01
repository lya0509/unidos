from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.adapters.database.connection import db
from app.adapters.api.v1.sos_router import get_current_user_id

router = APIRouter()

@router.get("/mi-inventario", tags=["Inventario"])
@router.get("/mi_inventario", tags=["Inventario"])
def obtener_mi_inventario(user_id: str = Depends(get_current_user_id)):
    """Retorna el inventario del usuario actual (Centro, Clínica o Líder)"""
    res = db.client.table("inventario").select("*").eq("propietario_id", user_id).execute()
    return res.data

@router.get("/centros-cercanos", tags=["Inventario"])
def ver_inventario_centros(zona: str):
    """
    Permite a Clínicas y Líderes Vecinales ver el inventario de los 
    Centros de Acopio en su zona para mandar Solicitudes Directas.
    """
    # 1. Buscar centros en la zona
    centros_res = db.client.table("usuarios").select("id, nombre").eq("rol", "centro_acopio").eq("zona_operacion", zona).execute()
    if not centros_res.data:
        return []
    
    centros_ids = [c["id"] for c in centros_res.data]
    
    # 2. Buscar inventario de esos centros
    inv_res = db.client.table("inventario").select("*, usuarios(nombre)").in_("propietario_id", centros_ids).execute()
    return inv_res.data

@router.post("/despacho/checklist", tags=["Checklist de Despacho"])
def crear_checklist(destino_id: str, contenido: List[Dict[str, Any]], origen_id: str = Depends(get_current_user_id)):
    """
    El Centro de Acopio prepara un envío y genera un Checklist.
    contenido: [{"insumo": "Harina Pan", "cant": 10}]
    """
    # Restar del inventario del centro (Lógica básica)
    for item in contenido:
        insumo = item["insumo"]
        cantidad_a_restar = float(item["cant"])
        
        inv_actual = db.client.table("inventario").select("*").eq("propietario_id", origen_id).eq("insumo", insumo).execute()
        if inv_actual.data and float(inv_actual.data[0]["cantidad"]) >= cantidad_a_restar:
            nueva_cant = float(inv_actual.data[0]["cantidad"]) - cantidad_a_restar
            db.client.table("inventario").update({"cantidad": nueva_cant}).eq("id", inv_actual.data[0]["id"]).execute()
        else:
            raise HTTPException(status_code=400, detail=f"No hay suficiente {insumo} en inventario para despachar.")
            
    # Crear Checklist
    data = {
        "origen_id": origen_id,
        "destino_id": destino_id,
        "contenido": contenido,
        "estado": "en_camino"
    }
    res = db.client.table("despachos_checklist").insert(data).execute()
    return {"mensaje": "Checklist generado y en camino.", "despacho": res.data[0]}

from pydantic import BaseModel

class InventoryManualEntry(BaseModel):
    insumo: str
    cantidad: float

@router.delete("/{id}", tags=["Inventario"])
def eliminar_inventario(id: str, user_id: str = Depends(get_current_user_id)):
    """Elimina completamente un insumo del inventario por su ID"""
    try:
        # Validar propiedad
        check = db.client.table("inventario").select("*").eq("id", id).eq("propietario_id", user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")
        
        db.client.table("inventario").delete().eq("id", id).execute()
        return {"mensaje": "Insumo eliminado del inventario."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", tags=["Inventario"])
@router.post("/", tags=["Inventario"])
@router.post("/manual", tags=["Inventario"])
def agregar_inventario_manual(entry: InventoryManualEntry, user_id: str = Depends(get_current_user_id)):
    """
    Agrega stock manual al inventario (útil para insumos recolectados offline).
    Si el insumo ya existe, suma la cantidad. Si no, lo crea.
    """
    insumo_nombre = entry.insumo.strip()
    
    # Manejo especial para HORARIO: Eliminar todos los viejos y crear uno nuevo para evitar duplicados fantasma
    if insumo_nombre.startswith("HORARIO:"):
        # Borrar todos los horarios existentes
        db.client.table("inventario").delete().eq("propietario_id", user_id).ilike("insumo", "HORARIO:%").execute()
        
        # Insertar el nuevo
        nuevo_registro = {
            "propietario_id": user_id,
            "insumo": insumo_nombre,
            "cantidad": 1,
            "unidad_medida": "Unidad"
        }
        res = db.client.table("inventario").insert(nuevo_registro).execute()
        return {"mensaje": f"Horario fijado exitosamente a {insumo_nombre}", "data": res.data[0]}
            
    # 1. Buscar si ya existe el insumo
    check = db.client.table("inventario").select("*").eq("propietario_id", user_id).ilike("insumo", insumo_nombre).execute()
    
    if check.data:
        # Existe, sumamos
        registro_actual = check.data[0]
        nueva_cantidad = float(registro_actual["cantidad"]) + float(entry.cantidad)
        res = db.client.table("inventario").update({"cantidad": nueva_cantidad}).eq("id", registro_actual["id"]).execute()
        return {"mensaje": f"Stock actualizado. Nuevo total de {insumo_nombre}: {nueva_cantidad}", "data": res.data[0]}
    else:
        # No existe, creamos
        nuevo_registro = {
            "propietario_id": user_id,
            "insumo": insumo_nombre,
            "cantidad": float(entry.cantidad),
            "unidad_medida": "Unidad"
        }
        res = db.client.table("inventario").insert(nuevo_registro).execute()
        return {"mensaje": f"Insumo {insumo_nombre} agregado exitosamente.", "data": res.data[0]}

class InventoryConsumeEntry(BaseModel):
    insumo: str
    cantidad: float

@router.post("/consumir", tags=["Inventario"])
def consumir_inventario(entry: InventoryConsumeEntry, user_id: str = Depends(get_current_user_id)):
    """
    Resta una cantidad del inventario (útil cuando se entregan insumos a la gente o se usan).
    """
    insumo_nombre = entry.insumo.strip()
    
    # 1. Buscar el insumo
    check = db.client.table("inventario").select("*").eq("propietario_id", user_id).ilike("insumo", insumo_nombre).execute()
    
    if not check.data:
        raise HTTPException(status_code=404, detail=f"No tienes {insumo_nombre} en tu inventario.")
        
    registro_actual = check.data[0]
    cantidad_actual = float(registro_actual["cantidad"])
    cantidad_a_restar = float(entry.cantidad)
    
    if cantidad_a_restar > cantidad_actual:
        nueva_cantidad = 0
    else:
        nueva_cantidad = cantidad_actual - cantidad_a_restar
    
    if nueva_cantidad <= 0:
        db.client.table("inventario").delete().eq("id", registro_actual["id"]).execute()
        return {"mensaje": f"Insumo agotado y eliminado: {insumo_nombre}.", "data": None}
    else:
        res = db.client.table("inventario").update({"cantidad": nueva_cantidad}).eq("id", registro_actual["id"]).execute()
        return {"mensaje": f"Descontado. Quedan {nueva_cantidad} de {insumo_nombre}.", "data": res.data[0] if res.data else None}
