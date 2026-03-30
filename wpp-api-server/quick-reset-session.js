nao #!/usr/bin/env node
/**
 * 🆘 QUICK SESSION RESET - Emergency cleanup for stuck Chrome processes
 * 
 * Usage:
 *   node quick-reset-session.js       - Full cleanup (kills Chrome, clears locks but KEEPS session)
 *   node quick-reset-session.js full  - Nuclear option (deletes entire session, requires QR scan)
 * 
 * Use this when:
 *   - "The browser is already running" error won't go away
 *   - WPP API starts but can't connect
 *   - Chromium processes are stuck
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const authDir = path.join(__dirname, '.wwebjs_auth');
const sessionPath = path.join(authDir, 'session-abravacon-wpp');
const args = process.argv.slice(2);
const isNuclear = args.includes('full');

console.log('\n' + '═'.repeat(70));
console.log(isNuclear ? '🆘 NUCLEAR SESSION RESET' : '🧹 QUICK SESSION CLEANUP');
console.log('═'.repeat(70));

// ===== STEP 1: Kill Chrome/Chromium processes =====
console.log('\n[1/4] 🔪 Killing Chrome/Chromium processes...');
try {
  if (process.platform === 'win32') {
    console.log('      → Windows: taskkill chrome.exe');
    try {
      execSync('taskkill /F /IM chrome.exe /T 2>nul', { stdio: 'ignore' });
    } catch (e) {}
    try {
      execSync('taskkill /F /IM chromium.exe /T 2>nul', { stdio: 'ignore' });
    } catch (e) {}
  } else {
    console.log('      → Unix: killall -9');
    try {
      execSync("killall -9 chrome 2>/dev/null || true", { stdio: 'ignore' });
      execSync("killall -9 chromium 2>/dev/null || true", { stdio: 'ignore' });
    } catch (e) {}
  }
  console.log('      ✅ Done');
} catch (e) {
  console.log('      ⚠️  ' + e.message);
}

// Wait for processes to fully terminate
console.log('\n[2/4] ⏰ Waiting 2s for process cleanup...');
require('child_process').execSync('timeout /t 2 /nobreak 2>nul || sleep 2', { stdio: 'ignore' });
console.log('      ✅ Done');

// ===== STEP 2: Clear lock files =====
console.log('\n[3/4] 🗑️  Cleaning lock files...');
const lockPatterns = [
  'LOCK',
  'SingletonLock',
  '.lockfile',
  'Service Worker.lock'
];

let locksRemoved = 0;
if (fs.existsSync(sessionPath)) {
  try {
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (lockPatterns.some(pattern => file.includes(pattern))) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`      🔓 Removed: ${file}`);
            locksRemoved++;
          } catch (e) {
            // File may be in use, that's OK
          }
        }
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        }
      }
    };
    walkDir(sessionPath);
  } catch (e) {
    console.log('      ⚠️  Error scanning: ' + e.message);
  }
}

console.log(`      ✅ Removed ${locksRemoved} lock files`);

// ===== STEP 3: Optional nuclear option =====
console.log('\n[4/4] 📋 Session status...');
if (isNuclear) {
  console.log('      🔥 NUCLEAR MODE: Deleting entire session...');
  try {
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('      ✅ Session deleted');
      console.log('\n      ⚠️  NEXT START: You will need to scan QR code!');
    }
  } catch (e) {
    console.log('      ❌ Error: ' + e.message);
  }
} else {
  if (fs.existsSync(sessionPath)) {
    const files = fs.readdirSync(sessionPath);
    const size = (() => {
      let total = 0;
      const walk = (dir) => {
        fs.readdirSync(dir).forEach(f => {
          const stat = fs.statSync(path.join(dir, f));
          if (stat.isDirectory()) walk(path.join(dir, f));
          else total += stat.size;
        });
      };
      walk(sessionPath);
      return total;
    })();
    console.log(`      ✅ Session preserved (${(size / 1024).toFixed(2)} KB, ${files.length} files)`);
    console.log('\n      🚀 NEXT START: Session will auto-restore (no QR needed)');
  } else {
    console.log('      ⚠️  No session found');
  }
}

console.log('\n' + '═'.repeat(70));
console.log('✅ Cleanup complete! Restart WPP API Server now.\n');
console.log('   node server.js');
console.log('═'.repeat(70) + '\n');
