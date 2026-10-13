#!/usr/bin/env python3
"""Serve only the playable browser game, never the research folder."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description='Launch the Box Counting browser game')
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'dist'
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Box Counting is ready at http://127.0.0.1:{args.port}/', flush=True)
        print('Press Control-C to stop the local server.', flush=True)
        server.serve_forever()
except KeyboardInterrupt:
    print('\nServer stopped.')
except OSError as error:
    parser.exit(1, f'Could not start the server: {error}\nTry another port with --port 8766.\n')
