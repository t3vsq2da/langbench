import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;

public class fileio {
    private static final int READ_BUFFER_SIZE = 65536; // 64 KiB

    public static void main(String[] args) throws IOException {
        int fileCount = Integer.parseInt(args[0]);
        int n = Integer.parseInt(args[1]);

        // Pre-allocate buffer with n '1' bytes
        byte[] writeBuffer = new byte[n];
        java.util.Arrays.fill(writeBuffer, (byte) '1');

        // Write phase
        for (int i = 0; i < fileCount; i++) {
            String filename = "file" + i;
            try (FileOutputStream fos = new FileOutputStream(filename)) {
                fos.write(writeBuffer);
            }
        }

        // Read phase
        long totalBytes = 0;
        byte[] readBuffer = new byte[READ_BUFFER_SIZE];

        for (int i = 0; i < fileCount; i++) {
            String filename = "file" + i;
            try (FileInputStream fis = new FileInputStream(filename)) {
                int bytesRead;
                while ((bytesRead = fis.read(readBuffer)) != -1) {
                    totalBytes += bytesRead;
                }
            }
        }

        // Count full 64KiB chunks
        long totalChunks = totalBytes / READ_BUFFER_SIZE;
        System.out.println(totalChunks);

        // Cleanup
        for (int i = 0; i < fileCount; i++) {
            String filename = "file" + i;
            Files.deleteIfExists(Paths.get(filename));
        }
    }
}