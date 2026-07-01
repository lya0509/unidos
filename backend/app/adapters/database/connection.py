from supabase import create_client, Client
from app.domain.security import settings

class Database:
    def __init__(self):
        self.client: Client = None

    def connect(self):
        """Inicializa el cliente de Supabase (REST API)"""
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            print("Cliente Supabase inicializado.")
        else:
            print("ADVERTENCIA: Credenciales de Supabase no configuradas.")

db = Database()
db.connect() # Inicialización síncrona para el cliente REST
