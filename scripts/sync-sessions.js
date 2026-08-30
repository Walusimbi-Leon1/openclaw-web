#!/usr/bin/env node
/**
 * Sync OpenClaw sessions with Firebase Realtime Database.
 *
 * Usage:
 *   node scripts/sync-sessions.js pull   # Download sessions from Firebase RTDB to ~/.openclaw/sessions/
 *   node scripts/sync-sessions.js push   # Upload local sessions to Firebase RTDB
 *
 * Environment variables:
 *   FIREBASE_SERVICE_ACCOUNT  - JSON string of Firebase service account key
 *   FIREBASE_DATABASE_URL     - Firebase RTDB database URL (e.g. https://<project>-default-rtdb.firebaseio.com)
 */

const fs = require('fs');
const path = require('path');

const home = process.env.HOME || '/home/runner';
const sessionsDir = path.join(home, '.openclaw', 'sessions');
const dbUrl = process.env.FIREBASE_DATABASE_URL;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!dbUrl || !serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT and FIREBASE_DATABASE_URL must be set');
  process.exit(1);
}

async function main() {
  const admin = require('firebase-admin');

  // Parse service account from env (JSON string)
  let sa;
  try {
    sa = JSON.parse(serviceAccount);
  } catch (e) {
    console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    process.exit(1);
  }

  // Initialize Firebase
  const app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: dbUrl,
  });

  const mode = process.argv[2];
  if (mode === 'pull') {
    await pullSessions(app);
  } else if (mode === 'push') {
    await pushSessions(app);
  } else {
    console.error('Usage: node scripts/sync-sessions.js [pull|push]');
    process.exit(1);
  }

  await app.delete();
}

async function pullSessions(app) {
  const { getDatabase, ref, get } = require('firebase-admin/database');
  const db = getDatabase(app);

  console.log('📥 Pulling sessions from Firebase RTDB...');
  fs.mkdirSync(sessionsDir, { recursive: true });

  // Pull sessions index first
  const indexSnap = await get(ref(db, 'openclaw-sessions-index'));
  if (indexSnap.exists()) {
    const index = indexSnap.val();
    const indexPath = path.join(home, '.openclaw', 'sessions.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
    console.log('  ✅ Restored sessions.json index');
  }

  // Pull individual session files
  const snapshot = await get(ref(db, 'openclaw-sessions'));
  if (!snapshot.exists()) {
    console.log('  No remote sessions found. Starting fresh.');
    return;
  }

  const data = snapshot.val();
  let count = 0;

  for (const [sessionId, sessionData] of Object.entries(data)) {
    if (typeof sessionData === 'string') {
      const filePath = path.join(sessionsDir, `${sessionId}.jsonl`);
      fs.writeFileSync(filePath, sessionData, 'utf8');
      console.log(`  ✅ Restored session: ${sessionId} (${sessionData.length} bytes)`);
      count++;
    }
  }

  console.log(`📥 Pulled ${count} sessions from Firebase RTDB`);
}

async function pushSessions(app) {
  const { getDatabase, ref, set } = require('firebase-admin/database');
  const db = getDatabase(app);

  console.log('📤 Pushing sessions to Firebase RTDB...');
  if (!fs.existsSync(sessionsDir)) {
    console.log('  No local sessions directory. Nothing to push.');
    return;
  }

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  let pushed = 0;

  for (const file of files) {
    const sessionId = file.replace('.jsonl', '');
    const filePath = path.join(sessionsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    await set(ref(db, `openclaw-sessions/${sessionId}`), content);
    console.log(`  ✅ Pushed session: ${sessionId} (${content.length} bytes)`);
    pushed++;
  }

  // Upload sessions.json index
  const indexPath = path.join(home, '.openclaw', 'sessions.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    await set(ref(db, 'openclaw-sessions-index'), index);
    console.log(`  ✅ Pushed sessions.json index (${Object.keys(index).length} entries)`);
  }

  console.log(`📤 Pushed ${pushed} sessions to Firebase RTDB`);
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});