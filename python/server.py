# server_builtin.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    
    def do_POST(self):
        # Получаем длину контента
        content_length = int(self.headers.get('Content-Length', 0))
        
        # Читаем тело запроса
        body = self.rfile.read(content_length).decode('utf-8')
        
        # Пытаемся парсить как JSON
        try:
            data = json.loads(body)
            print(f"Received JSON: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Received raw data: {body}")
            data = body
        
        # Выводим заголовки
        print(f"Headers: {dict(self.headers)}")
        print("-" * 50)
        
        # Отправляем ответ
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = json.dumps({"status": "ok", "message": "Request received"})
        self.wfile.write(response.encode('utf-8'))
    
    def log_message(self, format, *args):
        # Отключаем стандартное логирование
        pass

def run_server(port=8080):
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print(f"Server running on http://0.0.0.0:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()