#!/usr/bin/env python3
"""Serve only the playable browser game, never the research folder."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser(description='Launch the Box Counting browser game')
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--host', default='127.0.0.1', help='Listening address; use 0.0.0.0 to test from a phone on the same network')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'dist'
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    with ThreadingHTTPServer((args.host, args.port), handler) as server:
        print(f'Box Counting is ready at http://{args.host}:{args.port}/', flush=True)
        if args.host == '0.0.0.0':
            print(f'On your phone, use http://<this computer\'s local IP>:{args.port}/ on the same Wi-Fi.', flush=True)
        print('Press Control-C to stop the local server.', flush=True)
        server.serve_forever()
except KeyboardInterrupt:
    print('\nServer stopped.')
except OSError as error:
    parser.exit(1, f'Could not start the server: {error}\nTry another port with --port 8766.\n')
