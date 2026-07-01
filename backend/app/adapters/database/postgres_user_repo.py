from typing import Optional
from app.ports.user_repo import UserRepository
from app.domain.models import UserCreate, UserResponse
from app.adapters.database.connection import db

class SupabaseUserRepository(UserRepository):
    def create_user(self, user: UserCreate, hashed_password: str) -> Optional[UserResponse]:
        data = {
            "email": user.email,
            "hashed_password": hashed_password,
            "nombre": user.nombre,
            "telefono": user.telefono,
            "rol": user.rol,
            "zona_operacion": user.zona_operacion,
            "cedula": user.cedula,
            "foto_cedula_url": user.foto_cedula_url,
            "foto_rostro_url": user.foto_rostro_url
        }
        try:
            response = db.client.table("usuarios").insert(data).execute()
            if response.data:
                return UserResponse(**response.data[0])
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
        return None

    def get_user_by_email(self, email: str) -> Optional[dict]:
        try:
            response = db.client.table("usuarios").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            print(f"Error fetching user: {e}")
        return None

    def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        try:
            response = db.client.table("usuarios").select("*").eq("id", user_id).execute()
            if response.data:
                return UserResponse(**response.data[0])
        except Exception as e:
            print(f"Error fetching user: {e}")
        return None
