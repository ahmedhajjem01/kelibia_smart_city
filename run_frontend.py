import http.server
import socketserver
import os

PORT = 5500
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving Frontend at http://localhost:{PORT}")
    print(f"Open http://localhost:{PORT}/index.html to start")
    httpd.serve_forever()
