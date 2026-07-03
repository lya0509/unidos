from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.domain.models import UserCreate, UserResponse, Token, UserVerification
from app.domain.security import get_password_hash, verify_password, create_access_token
from app.adapters.database.postgres_user_repo import SupabaseUserRepository
from app.adapters.database.connection import db

from app.dependencies import limiter
from fastapi import Request

router = APIRouter()
user_repo = SupabaseUserRepository()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
def register(request: Request, user: UserCreate):

    # Validar roles permitidos
    roles_permitidos = ["centro_acopio", "comunidad", "refugio", "clinica", "lider_vecinal", "iniciativa_ciudadana"]
    if user.rol not in roles_permitidos:
        raise HTTPException(status_code=400, detail="El rol especificado no está permitido para registro público.")

    # Verificar si existe
    existing_user = user_repo.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    
    hashed_pw = get_password_hash(user.password)
    new_user = user_repo.create_user(user, hashed_pw)
    if not new_user:
        raise HTTPException(status_code=500, detail="Error al crear el usuario en la base de datos.")
    
    # Si el usuario es clínica, refugio, comunidad o centro_acopio, crearlo en centros_y_clinicas también
    if user.rol in ["centro_acopio", "clinica", "comunidad", "refugio"]:
        try:
            db.client.table("centros_y_clinicas").insert({
                "nombre": user.nombre,
                "tipo": user.rol,
                "zona": user.zona_operacion or "Nacional",
                "encargado_id": str(new_user.id)
            }).execute()
        except Exception as e:
            print(f"Error registrando en centros_y_clinicas: {e}")
            
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = user_repo.get_user_by_email(form_data.username)
    if not user_dict:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    if not user_dict.get("activo", True):
        raise HTTPException(status_code=403, detail="Usuario suspendido o inactivo. Contacta a soporte.")

    # Validar si ya está verificado
    verificado = bool(user_dict.get("foto_cedula_url") and user_dict.get("foto_rostro_url"))

    access_token = create_access_token(
        data={
            "sub": user_dict["email"], 
            "email": user_dict["email"],
            "nombre": user_dict.get("nombre", "Usuario"),
            "rol": user_dict["rol"], 
            "user_id": str(user_dict["id"]), 
            "zona_operacion": user_dict.get("zona_operacion"),
            "verificado": verificado
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/verificar-identidad")
def verificar_identidad(
    data: UserVerification,
    current_user_id: str = Depends(oauth2_scheme)  # Simple token check, in real prod use full decode
):
    try:
        from app.domain.security import decode_access_token
        payload = decode_access_token(current_user_id)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        real_user_id = payload.get("user_id")
        
        db.client.table("usuarios").update({
            "cedula": data.cedula,
            "foto_cedula_url": data.foto_cedula_url,
            "foto_rostro_url": data.foto_rostro_url
        }).eq("id", real_user_id).execute()
        
        return {"mensaje": "Identidad verificada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reportar/{user_id}")
def report_user(user_id: str):
    try:
        # Get current reports
        response = db.client.table("usuarios").select("cantidad_reportes").eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        current_reports = response.data[0].get("cantidad_reportes") or 0
        new_reports = current_reports + 1
        
        update_data: dict = {"cantidad_reportes": new_reports}
        
        # Bloqueo automático a los 5 reportes
        if new_reports >= 5:
            update_data["activo"] = False
            
        db.client.table("usuarios").update(update_data).eq("id", user_id).execute()
        return {"mensaje": "Reporte registrado", "reportes": new_reports, "bloqueado": new_reports >= 5}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/centros-mapa", tags=["Mapa"])
def get_centros_mapa(zona: str = ""):
    try:
        roles = ["centro_acopio", "clinica", "refugio", "lider_vecinal", "iniciativa_ciudadana"]
        query = db.client.table("usuarios").select("id, nombre, email, rol, zona_operacion, telefono").in_("rol", roles)
        if zona and zona != "Nacional" and zona != "TODA VENEZUELA":
            filtro = zona.split("||")[0]
            query = query.ilike("zona_operacion", f"%{filtro}%")
        res = query.execute()
        
        formatted = []
        for u in res.data:
            formatted.append({
                "id": u["id"],
                "nombre": u["nombre"],
                "tipo": u["rol"],
                "zona": u["zona_operacion"],
                "direccion": "",
                "latitud": None,
                "longitud": None,
                "contacto": u["telefono"]
            })
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_current_user(token: str = Depends(oauth2_scheme)):
    from app.domain.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    return payload

@router.delete('/me', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(current_user: dict = Depends(get_current_user)):
    try:
        db.client.table('usuarios').delete().eq('id', current_user['id']).execute()
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail='Error eliminando cuenta')

@router.get('/directorio', tags=['Directorio'])
def get_directorio(zona: str = ''):
    try:
        roles = ['centro_acopio', 'clinica', 'comunidad', 'refugio', 'lider_vecinal', 'iniciativa_ciudadana']
        query = db.client.table('usuarios').select('id, nombre, email, rol, zona_operacion, telefono, foto_cedula_url, foto_rostro_url').in_('rol', roles)
        if zona and zona != 'Nacional' and zona != 'TODA VENEZUELA':
            query = query.ilike('zona_operacion', f'%{zona}%')
        res = query.execute()
        
        # Fetch inventory for all these users
        user_ids = [u['id'] for u in res.data]
        if not user_ids:
            return []
        inv_res = db.client.table('inventario').select('propietario_id, insumo, cantidad').in_('propietario_id', user_ids).execute()
        
        inv_map = {}
        for item in inv_res.data:
            uid = item['propietario_id']
            if uid not in inv_map: inv_map[uid] = []
            inv_map[uid].append({'insumo': item['insumo'], 'cantidad': item['cantidad']})
            
        for u in res.data:
            u['inventario'] = inv_map.get(u['id'], [])
        return res.data
    except Exception as e:
        print('Error en directorio:', e)
        return []

@router.get('/auditoria', tags=['Admin'])
def get_auditoria_identidades(current_user: dict = Depends(get_current_user)):
    # Limit to admin email
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    try:
        res = db.client.table('usuarios').select('id, nombre, email, rol, foto_cedula_url, foto_rostro_url, verificado, activo').not_.is_('foto_cedula_url', 'null').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/usuarios/{user_id}/rechazar-identidad', tags=['Admin'])
def rechazar_identidad(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    try:
        db.client.table('usuarios').update({
            'foto_cedula_url': None,
            'foto_rostro_url': None,
            'verificado': False
        }).eq('id', user_id).execute()
        return {'mensaje': 'Identidad rechazada'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/usuarios/{user_id}', tags=['Admin'])
def delete_user_by_admin(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    try:
        db.client.table('usuarios').delete().eq('id', user_id).execute()
        return {'mensaje': 'Usuario eliminado'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# NUEVOS ENDPOINTS DE ADMINISTRACIÓN SUPREMA
# ==========================================

@router.get('/admin/usuarios', tags=['Admin'])
def list_usuarios_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere superadmin")
    try:
        res = db.client.table('usuarios').select('id, nombre, email, rol, zona_operacion, telefono, verificado, activo, created_at').order('created_at', desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/usuarios/{user_id}/cambiar-estado', tags=['Admin'])
def cambiar_estado_usuario(user_id: str, activo: bool, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere superadmin")
    try:
        res = db.client.table('usuarios').update({'activo': activo}).eq('id', user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        estado_txt = "activado" if activo else "suspendido"
        print(f"[AUDIT] Usuario {user_id} ha sido {estado_txt} por el administrador.")
        return {'mensaje': f'Usuario {estado_txt} con éxito'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/usuarios/{user_id}/aprobar-identidad', tags=['Admin'])
def aprobar_identidad_manual(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != "laya.juanluis@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere superadmin")
    try:
        res = db.client.table('usuarios').update({'verificado': True}).eq('id', user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        print(f"[AUDIT] Identidad del usuario {user_id} aprobada manualmente por admin.")
        return {'mensaje': 'Identidad verificada manualmente'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

