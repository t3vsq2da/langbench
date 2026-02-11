#!/usr/bin/env python3
import sys
import json
import os
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

n = int(sys.argv[1])
total_sum = 0
request_count = 0
lock = threading.Lock()  # 🔒 Защищаем критическую секцию

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        global total_sum, request_count
        
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)['data']
        
        should_exit = False
        
        with lock:  # 🔒 Атомарное обновление
            total_sum += data
            request_count += 1
            if request_count >= n:
                print(total_sum)
                os._exit(0)

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def log_message(self, format, *args):
        pass

ThreadingHTTPServer(('', 8080), Handler).serve_forever()