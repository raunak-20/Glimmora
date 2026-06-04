"""
Logs router — GET /logs
Allows viewing and filtering the backend JSON logs in the frontend console.
"""

import os
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, Response
from pydantic import BaseModel

from services.auth_service import get_current_user
from models.user import User

router = APIRouter()

class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str
    module: str
    request_id: Optional[str] = None
    exception: Optional[str] = None

@router.get(
    "",
    response_model=List[LogEntry],
    summary="Get application logs",
)
def get_logs(
    level: Optional[str] = Query(None, description="Filter by level (DEBUG, INFO, WARNING, ERROR)"),
    search: Optional[str] = Query(None, description="Search term to filter message content"),
    limit: int = Query(500, ge=1, le=1000, description="Max logs to return"),
    current_user: User = Depends(get_current_user),
):
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_file_path = os.path.join(backend_dir, "logs", "app.log")

    if not os.path.exists(log_file_path):
        return []

    logs = []
    # Read the log file from the end to fetch the latest logs first
    try:
        with open(log_file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        # Reverse to get newest first
        for line in reversed(lines):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                
                # Check log level filter
                if level and data.get("level", "").upper() != level.upper():
                    continue
                    
                # Check search query filter
                if search:
                    msg = data.get("message", "").lower()
                    exc = data.get("exception", "").lower()
                    mod = data.get("module", "").lower()
                    search_lower = search.lower()
                    if search_lower not in msg and search_lower not in exc and search_lower not in mod:
                        continue

                logs.append(LogEntry(
                    timestamp=data.get("timestamp", ""),
                    level=data.get("level", "INFO"),
                    message=data.get("message", ""),
                    module=data.get("module", ""),
                    request_id=data.get("request_id"),
                    exception=data.get("exception"),
                ))

                if len(logs) >= limit:
                    break
            except (json.JSONDecodeError, ValueError):
                continue
    except Exception as e:
        # Fallback or empty log
        return [{"timestamp": "", "level": "ERROR", "message": f"Failed to read logs: {str(e)}", "module": "routers.logs"}]

    return logs

@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear application logs",
)
def clear_logs(
    current_user: User = Depends(get_current_user),
):
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    log_file_path = os.path.join(backend_dir, "logs", "app.log")

    if os.path.exists(log_file_path):
        try:
            # Truncate the file to clear it
            with open(log_file_path, "w", encoding="utf-8") as f:
                f.truncate(0)
        except Exception:
            pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)
