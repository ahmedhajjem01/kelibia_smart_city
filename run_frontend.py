import http.server
import socketserver
import os

PORT = 5500
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

# Create the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving Frontend at http://localhost:{PORT}")
    try:
        print(f"Serving directory: {os.path.abspath(DIRECTORY)}")
    except Exception:
        pass
    print(f"Open http://localhost:{PORT}/login.html to start")
    httpd.serve_forever()
