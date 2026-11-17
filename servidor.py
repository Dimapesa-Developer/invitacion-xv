#!/usr/bin/env python3
"""
Servidor local para revisar la invitación.

    python3 servidor.py

A diferencia de `python3 -m http.server`, este NO deja que el navegador
guarde nada en caché. Así, cada vez que recargas ves de verdad la última
versión de los archivos, sin mezclas raras de CSS viejo con HTML nuevo.
"""
import http.server, socketserver, os, sys

PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, formato, *args):
        pass                      # sin ruido en la terminal

# Con hilos: el navegador pide 25 archivos a la vez y un servidor de un solo
# hilo le corta conexiones, así que la página se carga a medias.
class Servidor(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

with Servidor(('127.0.0.1', PUERTO), SinCache) as s:
    print(f'Invitación servida en  http://localhost:{PUERTO}')
    print('Ctrl+C para detenerla.')
    try:
        s.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor detenido.')
