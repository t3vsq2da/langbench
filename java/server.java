import java.io.*;
import java.net.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import com.sun.net.httpserver.*;

public class server {
    private static AtomicLong totalSum = new AtomicLong(0);
    private static AtomicInteger requestCount = new AtomicInteger(0);
    private static int n;
    
    static class SumHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Читаем тело запроса
            String body = new String(exchange.getRequestBody().readAllBytes());
            
            // Извлекаем число из JSON
            int data = extractNumber(body);
            
            // Увеличиваем счетчик
            int count = requestCount.incrementAndGet();
            
            // Если count <= n, добавляем к сумме
            if (count <= n) {
                totalSum.addAndGet(data);
            }
            
            // Отправляем ответ
            sendOk(exchange);
            
            // Если это n-ный запрос - выводим сумму
            if (count == n) {
                System.out.println(totalSum.get());
                System.exit(0);
            }
        }
        
        private int extractNumber(String json) {
            json = json.replaceAll("\\s", "");
            int start = json.indexOf("\"data\":") + 7;
            int end = start;
            
            if (json.charAt(end) == '-') {
                end++;
            }
            
            while (end < json.length() && Character.isDigit(json.charAt(end))) {
                end++;
            }
            
            return Integer.parseInt(json.substring(start, end));
        }
        
        private void sendOk(HttpExchange exchange) throws IOException {
            String response = "OK";
            exchange.sendResponseHeaders(200, response.length());
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }
    
    public static void main(String[] args) throws IOException {
        n = Integer.parseInt(args[0]);
        
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/", new SumHandler());
        server.start();
    }
}