import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.adapters.database.connection import db

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping a room/zone to a list of connected WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
                    
    # Alias for backwards compatibility with SOS, but broadcasts globally a todos
    async def broadcast_to_zone(self, message: dict, zona: str):
        for room_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            # We listen for chat messages
            data = await websocket.receive_text()
            try:
                msg_dict = json.loads(data)
                
                # If it's a chat message, save to Supabase
                if msg_dict.get("type") == "CHAT_MESSAGE":
                    remitente_id = msg_dict.get("remitente_id")
                    mensaje_texto = msg_dict.get("mensaje")
                    
                    if remitente_id and mensaje_texto:
                        db.client.table("mensajes_chat").insert({
                            "sala_id": room_id,
                            "remitente_id": remitente_id,
                            "mensaje": mensaje_texto
                        }).execute()
                        
                # Broadcast the message to everyone in the room
                await manager.broadcast_to_room(msg_dict, room_id)
            except Exception as e:
                print(f"Error processing websocket message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

@router.get("/history/{room_id}", tags=["Chat"])
def get_chat_history(room_id: str):
    from datetime import datetime, timedelta
    
    # 24h limit
    yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
    
    res = db.client.table("mensajes_chat").select("*, usuarios(nombre, foto_cedula_url, foto_rostro_url)").eq("sala_id", room_id).gte("created_at", yesterday).order("created_at", desc=False).execute()
    return res.data

@router.delete("/history/{room_id}", tags=["Chat"])
def delete_chat_room(room_id: str):
    # Endpoint to delete all messages for a specific room when chat is closed
    try:
        db.client.table("mensajes_chat").delete().eq("sala_id", room_id).execute()
        return {"status": "success", "message": f"Sala {room_id} eliminada"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

