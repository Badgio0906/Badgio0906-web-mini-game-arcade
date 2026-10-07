"""Local-only compiled distribution prefix check. Run from repository root."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/arcade/'):
            self.path = self.path[len('/arcade'):]
        super().do_GET()
    def log_message(self, *args):
        pass
root = Path(__file__).resolve().parents[2] / 'dist'
ThreadingHTTPServer(('127.0.0.1', 5620), lambda *args, **kwargs: Handler(*args, directory=str(root), **kwargs)).serve_forever()
