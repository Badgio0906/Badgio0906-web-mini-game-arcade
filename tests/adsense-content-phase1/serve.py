"""Local build QA only: emulate root and a Pages repository subpath."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/phase1/'):
            self.path = self.path[len('/phase1'):]
        super().do_GET()

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 4922), partial(Handler, directory=str(Path.cwd() / 'dist'))).serve_forever()
