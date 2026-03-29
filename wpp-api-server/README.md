WPP API Server (whatsapp-web.js)

This is a minimal Express server that exposes a POST `/send` endpoint to send WhatsApp messages via `whatsapp-web.js`.

Features
- CORS allowed for a configured domain (`ALLOWED_ORIGIN`)
- Checks `x-api-key` header against `X_API_KEY` (if configured)
- Uses `LocalAuth` for persistent session storage (no QR scan after initial login)
- Accepts JSON body: `{ phone, message, mediaBase64?, filename? }`

Quick start
1. Copy `.env.example` to `.env` and edit:

```
PORT=3001
X_API_KEY=your-secret-here
ALLOWED_ORIGIN=https://abravacom.com.br
```

2. Install dependencies and run:

```bash
cd wpp-api-server
npm ci
npm run start
```

3. On first run you will see a QR code in the console. Scan it with the WhatsApp account you want to use.

4. Expose the server via Cloudflare Tunnel (public hostname `wpp-api.abravacom.com.br` -> `http://localhost:3001`).

Example request (from CRM):

POST https://wpp-api.abravacom.com.br/send
Headers: { 'Content-Type': 'application/json', 'x-api-key': 'your-secret-here' }
Body: { "phone": "5511999998888", "message": "Olá!" }

Security checklist
- Set a strong `X_API_KEY` and configure it in your CRM (`VITE_WHATSAPP_API_URL` + `X_API_KEY` in env)
- Set `ALLOWED_ORIGIN` to your CRM domain (https://abravacom.com.br)
- Configure Cloudflare Tunnel with public hostname `wpp-api.abravacom.com.br`

Notes
- `LocalAuth` stores session data under `./.wwebjs_auth` — keep this directory persistent.
- For production, consider containerizing and using a process manager (pm2) or a service on a stable host.

Additional helpers
- Check current auth status: `GET /status` returns `{ ok: true, ready: true|false }`.
- Only request the QR (`GET /qr`) when `ready` is `false` to avoid unnecessary scans.
- Force logout and clear session: `POST /logout`.
