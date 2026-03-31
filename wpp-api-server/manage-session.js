#!/usr/bin/env node
/**
 * WhatsApp Session Manager
 * 
 * Usage:
 *   node manage-session.js status         - Check current session status
 *   node manage-session.js clear          - Delete session (requires re-scan QR)
 *   node manage-session.js restore        - Try to restore from backup
 *   node manage-session.js backup         - Create backup of current session
 */

const fs = require('fs');
const path = require('path');

const authDir = path.join(__dirname, '.wwebjs_auth');
const sessionPath = path.join(authDir, 'session-abravacom-wpp'); // Match server.js SESSION_CLIENT_ID
const backupDir = path.join(__dirname, '.wwebjs_backups');

function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

function statusSession() {
  console.log('\n📊 Session Status:\n');
  
  const authDirExists = fs.existsSync(authDir);
  const sessionDirExists = fs.existsSync(sessionPath);
  
  console.log(`✓ Auth directory exists: ${authDirExists ? '✅ YES' : '❌ NO'}`);
  console.log(`  Path: ${authDir}`);
  
  if (authDirExists) {
    const files = fs.readdirSync(authDir);
    console.log(`  Files/Folders: ${files.length}`);
    if (files.length > 0) {
      files.forEach(f => console.log(`    - ${f}`));
    }
  }
  
  console.log(`\n✓ Session directory exists: ${sessionDirExists ? '✅ YES' : '❌ NO'}`);
  console.log(`  Path: ${sessionPath}`);
  
  if (sessionDirExists) {
    const sessionFiles = fs.readdirSync(sessionPath);
    console.log(`  Session files: ${sessionFiles.length}`);
    
    // Calculate total size
    let totalSize = 0;
    function getSize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        const stat = fs.statSync(path.join(dir, f));
        if (stat.isDirectory()) {
          getSize(path.join(dir, f));
        } else {
          totalSize += stat.size;
        }
      });
    }
    getSize(sessionPath);
    console.log(`  Total size: ${(totalSize / 1024).toFixed(2)} KB`);
  }
  
  console.log('\n💡 Session Status:', sessionDirExists && fs.readdirSync(sessionPath).length > 0 
    ? '✅ SESSION ACTIVE (No QR needed on next restart)' 
    : '⚠️  NO SESSION (QR will be required)');
}

function clearSession() {
  console.log('\n⚠️  CLEARING SESSION...\n');
  
  if (!fs.existsSync(sessionPath)) {
    console.log('Session already cleared. No action needed.');
    return;
  }
  
  try {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log('✅ Session cleared successfully.');
    console.log('📌 Next restart: You WILL need to scan QR code\n');
  } catch (err) {
    console.error('❌ Failed to clear session:', err.message);
  }
}

function backupSession() {
  ensureBackupDir();
  
  if (!fs.existsSync(sessionPath)) {
    console.log('❌ No active session to backup.');
    return;
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Copy recursively
    fs.cpSync(sessionPath, backupPath, { recursive: true });
    
    console.log(`✅ Session backed up to: ${backupPath}`);
    console.log(`📌 ${fs.readdirSync(backupDir).length} total backups stored\n`);
  } catch (err) {
    console.error('❌ Failed to backup session:', err.message);
  }
}

function restoreSession() {
  ensureBackupDir();
  
  const backups = fs.readdirSync(backupDir).sort().reverse();
  
  if (backups.length === 0) {
    console.log('❌ No backups found.');
    return;
  }
  
  console.log(`\n📦 Available Backups:\n`);
  backups.forEach((backup, idx) => {
    console.log(`  ${idx + 1}. ${backup}`);
  });
  
  // Restore the latest backup
  const latestBackup = path.join(backupDir, backups[0]);
  
  try {
    // Clear current session first
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    
    // Restore from backup
    fs.cpSync(latestBackup, sessionPath, { recursive: true });
    
    console.log(`\n✅ Session restored from: ${backups[0]}`);
    console.log('📌 Restart the server to use restored session\n');
  } catch (err) {
    console.error('❌ Failed to restore session:', err.message);
  }
}

// Main
const command = process.argv[2] || 'status';

console.log('🔧 WhatsApp Session Manager\n');

switch (command.toLowerCase()) {
  case 'status':
    statusSession();
    break;
  case 'clear':
    clearSession();
    break;
  case 'backup':
    backupSession();
    break;
  case 'restore':
    restoreSession();
    break;
  default:
    console.log(`Unknown command: ${command}\n`);
    console.log('Available commands:');
    console.log('  status   - Show session status');
    console.log('  clear    - Delete current session (requires QR rescan)');
    console.log('  backup   - Create backup of current session');
    console.log('  restore  - Restore from latest backup\n');
}
