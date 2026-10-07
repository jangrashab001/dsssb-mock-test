from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, socket
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args): pass
try:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(('192.0.2.1', 80)); address=s.getsockname()[0]
except OSError:
    address=socket.gethostbyname(socket.gethostname())
print('PC: http://localhost:8080')
print(f'Phone on the same Wi-Fi: http://{address}:8080')
print('Keep this window open. Ctrl+C stops the server.')
try:
    ThreadingHTTPServer(('0.0.0.0',8080), Handler).serve_forever()
except KeyboardInterrupt:
    pass
