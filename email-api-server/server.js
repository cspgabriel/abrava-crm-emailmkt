require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8788;
const X_API_KEY = process.env.X_API_KEY || '';

// ====================  MIDDLEWARE  ====================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Permissões de CORS
app.use(cors({
  origin: '*', // Permitir tudo para facilitar o uso de subdomínios variados
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'x-api-key', 'Authorization', 'Accept']
}));

// ====================  ENDPOINTS  ====================

app.get('/', (req, res) => res.json({ ok: true, message: 'EMAIL API Server Online' }));

/**
 * Helper to run Workspace CLI (prefer global `gws`, fallback to `npx gws`).
 */
function runGws(command, callback) {
  const tryGlobal = `gws ${command}`;
  exec(tryGlobal, (err, stdout, stderr) => {
    if (err && (err.code === 'ENOENT' || /not recognized|is not recognized|is not found/i.test(err.message + stderr))) {
      const fallback = `npx gws ${command}`;
      exec(fallback, callback);
    } else {
      callback(err, stdout, stderr);
    }
  });
}

/**
 * Get Workspace CLI status and account info
 */
app.get('/status', async (req, res) => {
  try {
    // Use `gws auth status` which returns JSON about the authenticated user
    runGws('auth status', (error, stdout, stderr) => {
      if (error) {
        return res.json({
          ok: false,
          authenticated: false,
          error: error.message,
          setupNeeded: true
        });
      }

      try {
        const info = JSON.parse(stdout);
        res.json({
          ok: true,
          authenticated: !!info.user,
          account: info.user || null,
          token_valid: info.token_valid || false,
          client_config_error: info.client_config_error || null
        });
      } catch (parseErr) {
        res.json({ ok: true, authenticated: false, error: 'invalid_auth_status_json', raw: stdout });
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * Send Email Marketing
 */
app.post('/send', async (req, res) => {
  try {
    const { to, recipientName, subject, body, provider } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields (to, subject, body)' });
    }

    console.log(`[EMAIL] 📥 Send request to ${to} via ${provider || 'workspace'}`);

    if (provider === 'workspace' || provider === 'gmail') {
      const tempBodyFile = path.join(__dirname, `temp_email_${Date.now()}.html`);
      fs.writeFileSync(tempBodyFile, body, 'utf8');
      let bodyContent = '';
      try {
        bodyContent = fs.readFileSync(tempBodyFile, 'utf8');
      } catch (e) {
        bodyContent = body;
      }

      // Remove temp file early; we'll send body as inline HTML via --body + --html
      try { fs.unlinkSync(tempBodyFile); } catch (e) {}

      // Escape double-quotes for safe shell embedding
      const escapedBody = bodyContent.replace(/"/g, '\\"').replace(/\r?\n/g, '\n');
      const gwsCmd = `gmail +send --to "${to}" --subject "${subject}" --body "${escapedBody}" --html`;

      runGws(gwsCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`[EMAIL] ❌ GWS Error: ${error.message}`);
            return res.status(500).json({ ok: false, error: 'gws_failed', detail: (stderr || error.message) });
        }

        console.log(`[EMAIL] ✅ Sent successfully: ${stdout}`);
        res.json({ ok: true, messageId: 'gws-sent' });
      });
    } else {
      res.status(501).json({ ok: false, error: 'not_implemented', detail: `Provider ${provider} not supported.` });
    }
  } catch (err) {
    console.error('[EMAIL] ❌ Error:', err.message);
    res.status(500).json({ ok: false, error: 'endpoint_failed', detail: err.message });
  }
});

// ====================  START SERVER  ====================
app.listen(PORT, () => {
  console.log(`\n📧 EMAIL API Server listening on port ${PORT}`);
  console.log('  GET  /status  → Check Auth Status');
  console.log('  POST /send    → Send Email');
});
