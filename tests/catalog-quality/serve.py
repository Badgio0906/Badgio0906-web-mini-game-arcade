"""Local immutable Pages-style files, real 404s and isolation for Godot QA."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse


class Files(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', default='dist')
    parser.add_argument('--port', type=int, default=4952)
    args = parser.parse_args()
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Files, directory=args.directory)).serve_forever()
