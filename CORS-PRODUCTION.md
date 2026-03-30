Production CORS / 502 troubleshooting and nginx snippet
=====================================================

Problem summary
- Browser calls from `http://localhost:3001` to `https://wpp-api.abravacom.com.br` are blocked by CORS: "No 'Access-Control-Allow-Origin' header is present". The requests also return `502 Bad Gateway` (net::ERR_FAILED).

Why this happens
- The Node.js app `wpp-api-server` includes permissive CORS middleware and even echoes `Access-Control-Allow-Origin` using `req.headers.origin`. However when the public hostname is fronted by a reverse proxy, load balancer, or CDN (e.g., nginx, Cloudflare, AWS ALB), that proxy can return a 502 before the request reaches the Node process, or it can strip/override headers. A 502 response from the proxy will not include the app's CORS headers, causing the browser to block the request.

Quick developer checks
1. From your dev machine run (replace host if needed):

   curl -i -H "Origin: http://localhost:3001" https://wpp-api.abravacom.com.br/status

   - If you see `Access-Control-Allow-Origin` in the response headers the server/proxy is including it.
   - If you receive `502 Bad Gateway` and no CORS headers, check the proxy logs.

2. Confirm the same request directly to the upstream (if you can SSH to the host and curl the local Node port):

   curl -i -H "Origin: http://localhost:3001" http://127.0.0.1:8787/status

   - If the upstream returns the CORS header but the public host does not, the reverse proxy is the issue.

Nginx snippet to ensure CORS is present even on errors
-----------------------------------------------------
Place this inside the `server {}` block that serves `wpp-api.abravacom.com.br`. It ensures preflight handling and that responses (including proxied error responses) include CORS headers.

    # inside server { ... }
    set $cors_origin "https://abravacom.com.br";
    if ($http_origin = "http://localhost:3001") {
      set $cors_origin "http://localhost:3001";
    }
    if ($http_origin = "http://localhost:3000") {
      set $cors_origin "http://localhost:3000";
    }
    if ($http_origin = "https://email-api.abravacom.com.br") {
      set $cors_origin "https://email-api.abravacom.com.br";
    }

    # Handle preflight quickly
    if ($request_method = 'OPTIONS') {
      add_header 'Access-Control-Allow-Origin' $cors_origin always;
      add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD' always;
      add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, X-API-Key' always;
      add_header 'Access-Control-Allow-Credentials' 'true' always;
      add_header 'Access-Control-Max-Age' 1728000 always;
      return 204;
    }

    location / {
      proxy_pass http://127.0.0.1:8787; # adjust upstream
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      # Ensure CORS headers are added to all responses (including 502/50x)
      add_header 'Access-Control-Allow-Origin' $cors_origin always;
      add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD' always;
      add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept, Authorization, X-API-Key' always;
      add_header 'Access-Control-Allow-Credentials' 'true' always;
    }

Restart nginx after editing and then re-run the `curl` test above.

If you use a CDN (Cloudflare, Fastly) you must set these headers in that layer instead of nginx.

Local dev workaround
- You already have a Vite dev-proxy. Use that: calls from the browser should target `/status` (same origin) and Vite forwards server-side to the real host, avoiding browser CORS. If Vite proxy is insufficient because upstream is returning 502, verify the upstream is healthy.

If you want, I can:
- Add an `ALLOWED_ORIGINS` env-driven list to `wpp-api-server/server.js` and ensure it logs the origin check results, or
- Prepare a small PR with the nginx snippet and example `systemd` service notes.
