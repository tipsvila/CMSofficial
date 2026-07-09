const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Desk-Aerotop\\.local\\share\\mimocode\\mimocode.db', {open: true, readOnly: true});

// Get text parts from user messages in recent sessions
const sessions = ['ses_0bf3c3df1ffeSA8x9b9Y33zuDN','ses_0bf3e4177ffe6vtgJa2sLDDO4p','ses_0da4ef51cffeBv0FFXKPlWDVFe','ses_0da7078a6ffe1gvLGGmmK2DyMU','ses_0c01ecd0effejFTnGOXXM3ZxkY','ses_0ca3316e5ffeFqgIOdHhrELEWm'];
const sidList = sessions.map(s => `'${s}'`).join(',');

// User text parts
const userParts = db.prepare(`SELECT p.session_id, json_extract(p.data, '$.text') as text, substr(p.data, 1, 500) as data_preview
FROM part p
JOIN message m ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'user'
  AND json_extract(p.data, '$.type') = 'text'
  AND p.session_id IN (${sidList})
ORDER BY p.time_created`).all();

console.log('=== USER TEXT PARTS ===');
userParts.forEach(p => console.log(p.session_id, '|', p.text ? p.text.substring(0, 300) : '(no text)'));

// Also check assistant text parts for decisions/rules
const assistantParts = db.prepare(`SELECT p.session_id, json_extract(p.data, '$.text') as text, substr(p.data, 1, 500) as data_preview
FROM part p
JOIN message m ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'text'
  AND p.session_id IN (${sidList})
ORDER BY p.time_created`).all();

console.log('\n=== ASSISTANT TEXT PARTS ===');
assistantParts.forEach(p => console.log(p.session_id, '|', p.text ? p.text.substring(0, 300) : '(no text)'));

// Check part table schema
const cols = db.prepare("PRAGMA table_info(part)").all();
console.log('\n=== PART TABLE COLUMNS ===');
cols.forEach(c => console.log(c.name, c.type));
