#!/usr/bin/env python3
"""
Lightweight study platform server with live cross-device sync.
Serves static files and persists answers/flags to progress.json on disk.
"""

import http.server
import socketserver
import os
import json
import socket

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROGRESS_FILE = os.path.join(BASE_DIR, "data", "progress.json")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

class SyncStudyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/progress":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            if os.path.exists(PROGRESS_FILE):
                with open(PROGRESS_FILE, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"{}")
            return
        
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/progress":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                # Validate JSON payload
                data = json.loads(post_data.decode("utf-8"))
                os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
                with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b'{"status":"synced"}')
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return
        
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def main():
    local_ip = get_local_ip()
    print("=" * 60)
    print("  KDPsych Study Platform — Cross-Device Server")
    print("=" * 60)
    print(f"  • On your Mac:     http://localhost:{PORT}")
    print(f"  • On your Samsung: http://{local_ip}:{PORT}")
    print("  • Storage: Both devices automatically sync to progress.json")
    print("=" * 60)
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), SyncStudyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down.")

if __name__ == "__main__":
    main()
