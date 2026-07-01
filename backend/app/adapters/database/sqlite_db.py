import sqlite3
import os
from pathlib import Path

# Configurar ruta de la base de datos local
DB_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = DB_DIR / "local_reports.db"

def get_sqlite_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    conn = get_sqlite_conn()
    cursor = conn.cursor()
    # Tabla de reportes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id TEXT NOT NULL,
            reported_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(reporter_id, reported_id)
        )
    ''')
    conn.commit()
    conn.close()

# Inicializar al importar
init_sqlite_db()
