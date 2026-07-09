const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Desk-Aerotop\\.local\\share\\mimocode\\mimocode.db', {open: true, readOnly: true});

// Find sessions for this project directory
const sessions = db.prepare("SELECT id, directory, title, time_created FROM session WHERE directory = 'D:\\cmsofficial' ORDER BY time_created DESC LIMIT 20").all();
console.log('=== SESSIONS FOR D:\\cmsofficial ===');
sessions.forEach(s => console.log(s.id, '|', s.title, '|', new Date(Number(s.time_created)).toISOString()));

// Get all session IDs for this project
const sids = sessions.map(s => s.id);

// Find user messages in these sessions
const stmt = db.prepare(`SELECT m.session_id, m.id as msg_id, substr(json_extract(m.data, '$.content'), 1, 300) as preview
FROM message m
WHERE json_extract(m.data, '$.role') = 'user'
  AND m.session_id IN (${sids.map(s => `'${s}'`).join(',')})
ORDER BY m.time_created`);

const msgs = stmt.all();
console.log('\n=== USER MESSAGES ===');
msgs.forEach(m => console.log(m.session_id, '|', m.preview));
