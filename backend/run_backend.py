"""
BolKhata Backend Launcher — Windows socket fix & smart startup
Handles [WinError 10013] permission issues by binding to 127.0.0.1
"""

import sys
import socket
import os
import uvicorn

def is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def find_available_port(host: str, preferred_port: int) -> int:
    port = preferred_port
    while port < preferred_port + 20:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((host, port))
                return port
        except OSError:
            port += 1
    return preferred_port

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    preferred_port = int(os.getenv("PORT", "8000"))

    port = find_available_port(host, preferred_port)
    if port != preferred_port:
        print(f"⚠️ Port {preferred_port} in use or restricted by Windows. Auto-switched to port {port}")

    print(f"🚀 Starting BolKhata Server on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
