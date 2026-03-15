"""WebSocket chat endpoint for conversations with individual agent personas."""

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.database import engine
from app.models.simulation import Persona, Simulation
from app.services.chat_service import stream_chat_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.websocket("/simulations/{sim_id}/agents/{persona_id}/chat")
async def agent_chat(websocket: WebSocket, sim_id: int, persona_id: int):
    """WebSocket endpoint for real-time chat with an agent persona.

    Client sends: {"message": "your question"}
    Server sends: {"type": "token", "content": "..."} for each token
                  {"type": "complete", "content": "full response"}
    """
    # Validate simulation and persona exist
    with Session(engine) as session:
        sim = session.get(Simulation, sim_id)
        if not sim:
            await websocket.close(code=4004, reason="Simulation not found")
            return
        persona = session.get(Persona, persona_id)
        if not persona:
            await websocket.close(code=4004, reason="Persona not found")
            return

    await websocket.accept()

    try:
        while True:
            # Receive user message
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                user_message = parsed.get("message", "").strip()
            except json.JSONDecodeError:
                user_message = data.strip()

            if not user_message:
                await websocket.send_json({"type": "error", "content": "Empty message"})
                continue

            # Stream response tokens
            full_response = ""
            async for token in stream_chat_response(sim_id, persona_id, user_message):
                full_response += token
                await websocket.send_json({"type": "token", "content": token})

            # Send completion signal
            await websocket.send_json({"type": "complete", "content": full_response})

    except WebSocketDisconnect:
        logger.info(f"Chat disconnected: sim={sim_id}, persona={persona_id}")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": "Chat error occurred"})
        except Exception:
            pass
