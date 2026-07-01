from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    centro_acopio = 'centro_acopio' # Mantenido por compatibilidad
    comunidad = 'comunidad'
    refugio = 'refugio'
    lider_vecinal = 'lider_vecinal'
    ciudadano = 'ciudadano'
    clinica = 'clinica'
    iniciativa_ciudadana = 'iniciativa_ciudadana'

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    telefono: Optional[str] = None
    rol: str = "ciudadano"
    zona_operacion: Optional[str] = None
    cedula: Optional[str] = None
    foto_cedula_url: Optional[str] = None
    foto_rostro_url: Optional[str] = None
    codigo_secreto: Optional[str] = None

class UserVerification(BaseModel):
    cedula: str
    foto_cedula_url: str
    foto_rostro_url: str

class UserResponse(BaseModel):
    id: UUID4
    email: EmailStr
    nombre: str
    telefono: Optional[str]
    rol: UserRole
    zona_operacion: Optional[str]
    cedula: Optional[str] = None
    foto_cedula_url: Optional[str] = None
    foto_rostro_url: Optional[str] = None
    estado_verificacion: str = "pendiente"
    cantidad_reportes: int = 0
    activo: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    rol: Optional[UserRole] = None
    user_id: Optional[str] = None

# --- Nuevos Modelos Core ---

class SOSStatus(str, Enum):
    abierta = 'abierta'
    en_camino = 'en_camino'
    entregada = 'entregada'
    cancelada = 'cancelada'

class SOSRequestCreate(BaseModel):
    zona: str
    insumo_solicitado: str
    cantidad_solicitada: float
    descripcion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    dirigido_a_centro_id: Optional[UUID4] = None

class DonationQRCreate(BaseModel):
    insumo_donado: str
    cantidad_donada: float

class InventoryItem(BaseModel):
    insumo: str
    cantidad: float
    unidad_medida: str
    umbral_minimo: float = 0.0

class AnuncioCentroCreate(BaseModel):
    mensaje: str

class AnuncioCentroResponse(BaseModel):
    id: UUID4
    centro_id: UUID4
    mensaje: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PersonaRegistroCreate(BaseModel):
    nombre_completo: str
    cedula: Optional[str] = None
    estado_salud: str
    notas: Optional[str] = None

class PersonaRegistroResponse(BaseModel):
    id: UUID4
    nombre_completo: str
    cedula: Optional[str]
    estado_salud: str
    notas: Optional[str]
    registrador_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
