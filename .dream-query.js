const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('C:/Users/Desk-Aerotop/.local/share/mimocode/mimocode.db', {open: true, readOnly: true});

// Get recent user sessions (non-checkpoint-writer)
const sessions = db.prepare(`
  SELECT id, project_id, title, time_created 
  FROM session 
  WHERE project_id LIKE '%46fb1071%' 
    AND title NOT LIKE 'checkpoint-writer:%'
  ORDER BY time_created DESC 
  LIMIT 10
`).all();
console.log("=== RECENT SESSIONS ===");
console.log(JSON.stringify(sessions, null, 2));

// Get user messages from recent sessions (to find rules, decisions, errors)
const userMsgs = db.prepare(`
  SELECT m.id, m.session_id, m.time_created,
         json_extract(m.data, '$.role') as role,
         json_extract(p.data, '$.type') as part_type,
         substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id IN (SELECT id FROM session WHERE project_id LIKE '%46fb1071%' AND title NOT LIKE 'checkpoint-writer:%')
    AND json_extract(m.data, '$.role') = 'user'
  ORDER BY m.time_created DESC
  LIMIT 30
`).all();
console.log("\n=== RECENT USER MESSAGES ===");
console.log(JSON.stringify(userMsgs, null, 2));

db.close();
