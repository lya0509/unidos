from fastapi import APIRouter
from app.adapters.database.connection import db

router = APIRouter()

@router.get("/global", tags=["Estadísticas"])
def get_global_stats():
    """Retorna estadísticas globales de la plataforma."""
    try:
        # SOS stats
        all_sos = db.client.table("solicitudes_sos").select("estado").execute()
        sos_data = all_sos.data or []
        total_sos = len(sos_data)
        sos_abiertos = len([s for s in sos_data if s["estado"] == "abierta"])
        sos_entregados = len([s for s in sos_data if s["estado"] in ["entregada", "resuelta"]])
        sos_cancelados = len([s for s in sos_data if s["estado"] == "cancelada"])
        sos_en_camino = len([s for s in sos_data if s["estado"] == "en_camino"])
        
        # Inventory stats
        all_inv = db.client.table("inventario").select("insumo, cantidad").execute()
        inv_data = all_inv.data or []
        total_insumos = len(inv_data)
        insumos_agrupados = {}
        for item in inv_data:
            nombre = item["insumo"]
            if nombre in insumos_agrupados:
                insumos_agrupados[nombre] += float(item["cantidad"])
            else:
                insumos_agrupados[nombre] = float(item["cantidad"])
        
        # Users stats
        all_users = db.client.table("usuarios").select("rol").execute()
        users_data = all_users.data or []
        total_usuarios = len(users_data)
        usuarios_por_rol = {}
        for u in users_data:
            r = u["rol"]
            usuarios_por_rol[r] = usuarios_por_rol.get(r, 0) + 1
        
        return {
            "sos": {
                "total": total_sos,
                "abiertos": sos_abiertos,
                "entregados": sos_entregados,
                "cancelados": sos_cancelados,
                "en_camino": sos_en_camino
            },
            "inventario": {
                "total_registros": total_insumos,
                "por_insumo": insumos_agrupados
            },
            "usuarios": {
                "total": total_usuarios,
                "por_rol": usuarios_por_rol
            }
        }
    except Exception as e:
        return {"error": str(e)}
