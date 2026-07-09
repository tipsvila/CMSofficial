const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Desk-Aerotop\\.local\\share\\mimocode\\mimocode.db', {open: true, readOnly: true});

// Check message data structure
const sample = db.prepare("SELECT data FROM message WHERE session_id = 'ses_0bf3c3df1ffeSA8x9b9Y33zuDN' LIMIT 3").all();
console.log('=== SAMPLE MESSAGE DATA ===');
sample.forEach((r, i) => {
  console.log(`--- Row ${i} ---`);
  console.log(r.data);
});

// Also check the most recent active sessions (last 7 days)
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
const recentSessions = db.prepare(`SELECT id, directory, title, time_created FROM session WHERE directory = 'D:\\cmsofficial' AND time_created > ${cutoff} ORDER BY time_created DESC`).all();
console.log('\n=== RECENT SESSIONS (last 7 days) ===');
recentSessions.forEach(s => console.log(s.id, '|', s.title, '|', new Date(Number(s.time_created)).toISOString()));

// Get assistant messages from recent sessions with text content
const assistantMsgs = db.prepare(`SELECT m.session_id, json_extract(m.data, '$.role') as role, substr(m.data, 1, 500) as data_preview FROM message m WHERE m.session_id IN ('ses_0bf3c3df1ffeSA8x9b9Y33zuDN','ses_0bf3e4177ffe6vtgJa2sLDDO4p','ses_0da4ef51cffeBv0FFXKPlWDVFe','ses_0da7078a6ffe1gvLGGmmK2DyMU') ORDER BY m.time_created LIMIT 10`).all();
console.log('\n=== RECENT MESSAGES (first 10) ===');
assistantMsgs.forEach(m => console.log(m.session_id, '|', m.role, '|', m.data_preview));
