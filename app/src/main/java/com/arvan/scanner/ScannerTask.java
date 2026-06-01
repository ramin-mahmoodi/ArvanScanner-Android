package com.arvan.scanner;

import android.app.Activity;
import android.webkit.WebView;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

public class ScannerTask {
    private final Activity activity;
    private final WebView webView;
    private ExecutorService executor;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public ScannerTask(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    public void stop() {
        isRunning.set(false);
        if (executor != null) {
            executor.shutdownNow();
        }
    }

    private void emitEvent(String eventName, String jsonPayload) {
        activity.runOnUiThread(() -> {
            String script = "javascript:window.dispatchEvent(new CustomEvent('" + eventName + "', {detail: " + jsonPayload + "}));";
            webView.evaluateJavascript(script, null);
        });
    }

    public void startScan(String[] cidrs, int concurrency, String mode, String sni, String[] ports) {
        isRunning.set(true);
        emitEvent("scan_start", "{}");

        executor = Executors.newFixedThreadPool(concurrency);
        
        new Thread(() -> {
            List<String> allIPs = new ArrayList<>();
            for (String cidr : cidrs) {
                allIPs.addAll(parseCIDR(cidr));
            }

            final int total = allIPs.size() * ports.length;
            AtomicInteger tested = new AtomicInteger(0);

            for (String ip : allIPs) {
                for (String port : ports) {
                    if (!isRunning.get()) break;
                    
                    final String targetIP = ip;
                    final int targetPort = Integer.parseInt(port);
                    
                    executor.submit(() -> {
                        if (!isRunning.get()) return;

                        long latency1 = -1;
                        long latency2 = -1;
                        
                        try (Socket socket = new Socket()) {
                            long start = System.currentTimeMillis();
                            socket.connect(new InetSocketAddress(targetIP, targetPort), 2000);
                            latency1 = System.currentTimeMillis() - start;
                        } catch (Exception ignored) {
                        }

                        if (latency1 > 0) {
                            try (Socket socket = new Socket()) {
                                long start = System.currentTimeMillis();
                                socket.connect(new InetSocketAddress(targetIP, targetPort), 2000);
                                latency2 = System.currentTimeMillis() - start;
                            } catch (Exception ignored) {
                            }
                        }

                        int currentTested = tested.incrementAndGet();
                        
                        if (latency1 > 0) {
                            long finalLatency = latency1;
                            long jitter = 0;
                            if (latency2 > 0) {
                                finalLatency = (latency1 + latency2) / 2;
                                jitter = Math.abs(latency1 - latency2);
                            }
                            String resultJson = String.format("{\"ip\": \"%s:%d\", \"latency\": %d, \"jitter\": %d}", targetIP, targetPort, finalLatency, jitter);
                            emitEvent("scan_result", resultJson);
                        }

                        if (currentTested % 10 == 0 || currentTested == total) {
                            String progressJson = String.format("{\"tested\": %d, \"total\": %d}", currentTested, total);
                            emitEvent("scan_progress", progressJson);
                        }

                        if (currentTested == total) {
                            emitEvent("scan_done", "{}");
                            isRunning.set(false);
                            executor.shutdown();
                        }
                    });
                }
            }
        }).start();
    }

    // Basic CIDR parser (very simplified for this example)
    private List<String> parseCIDR(String cidr) {
        List<String> ips = new ArrayList<>();
        try {
            String[] parts = cidr.split("/");
            if (parts.length == 1) {
                ips.add(parts[0]);
                return ips;
            }
            
            String ip = parts[0];
            int prefix = Integer.parseInt(parts[1]);
            
            String[] ipParts = ip.split("\\.");
            long ipNum = (Long.parseLong(ipParts[0]) << 24) |
                         (Long.parseLong(ipParts[1]) << 16) |
                         (Long.parseLong(ipParts[2]) << 8) |
                         Long.parseLong(ipParts[3]);
            
            long mask = ~((1L << (32 - prefix)) - 1);
            long startIp = (ipNum & mask) + 1;
            long endIp = (ipNum | ~mask) - 1;
            
            // Limit to max 2048 to avoid huge memory spikes in mobile
            long maxLimit = Math.min(endIp, startIp + 2048);
            
            for (long i = startIp; i <= maxLimit; i++) {
                String strIp = ((i >> 24) & 0xFF) + "." +
                               ((i >> 16) & 0xFF) + "." +
                               ((i >> 8) & 0xFF) + "." +
                               (i & 0xFF);
                ips.add(strIp);
            }
        } catch (Exception e) {
            ips.add(cidr);
        }
        return ips;
    }
}
