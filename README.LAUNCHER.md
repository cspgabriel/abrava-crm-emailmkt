Abravacom — launcher & WPP server notes

Quick setup and troubleshooting

1) Environment
- FRONTEND runs on port 3001 (Vite)
- WPP API runs on port 8787 (Express + whatsapp-web.js)

2) WPP runtime config
- By default the WPP server runs headless Chromium. To see the browser window for debugging set env `WPP_HEADLESS=false`.
- Sessions are persisted under `wpp-api-server/.wwebjs_auth`. Do NOT delete unless you want to force re-login.
- To force a full logout and clear session, call POST `/logout` on the API. The server will destroy the client and clear the directory.
- QR is available at `GET /qr` (returns JSON { ok: true, qr: '<data:url>' }).

3) Avoiding dev watch storms
- Vite is configured to ignore large folders like `.wwebjs_auth`, `.whatsapp_profile`, `launcher` and `**/dist/**` to avoid constant rebuilds that saturate CPU.

4) Launcher
- Use the `launcher` app to start/stop frontend and API together. The launcher runs both processes and shows terminal output.

5) Troubleshooting
- If Express reports `EADDRINUSE`, find and kill the process using that port:
  - `netstat -ano | Select-String ":8787"` then `Stop-Process -Id <PID> -Force`
- If Puppeteer fails to start, try disabling headless mode and re-run with `WPP_HEADLESS=false` to inspect the browser.
- If QR does not appear: ensure Chromium is allowed by anti-virus and that `wpp-api-server/.wwebjs_auth` exists and is writable.

6) Useful scripts
- Start frontend: `cd abravacom-main && npm install && npm run dev`
- Start WPP API: `cd wpp-api-server && npm install && npm run dev`
- Force logout: `curl -X POST http://localhost:8787/logout`

If you want, I can now restart both servers with these settings applied or implement the unified UI.
