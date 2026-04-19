"""
Simple SPA-compatible HTTP server for the portable frontend
Serves static files and falls back to index.html for SPA routes
"""
import http.server
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Proxy API requests info
        if self.path.startswith('/api/'):
            self.send_response(302)
            self.send_header('Location', f'http://localhost:8001{self.path}')
            self.end_headers()
            return

        # Try to serve the file
        file_path = os.path.join(DIRECTORY, self.path.lstrip('/'))
        if os.path.isfile(file_path):
            super().do_GET()
        else:
            # SPA fallback - serve index.html
            self.path = '/index.html'
            super().do_GET()

    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == '__main__':
    with http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler) as httpd:
        print(f"Frontend serving on http://localhost:{PORT}")
        httpd.serve_forever()
